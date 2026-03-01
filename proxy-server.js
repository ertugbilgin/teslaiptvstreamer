const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { execSync } = require('child_process');

// EPG Parser
try {
    var EPGParser = require('./epg-parser');
} catch (e) {
    // EPG modülü yoksa devam et
    var EPGParser = null;
}
const epgParser = EPGParser ? new EPGParser() : null;
const epgCache = {
    data: null,
    url: null,
    timestamp: null
};

const PORT = process.env.PORT || 3000;

// Cloudflared URL'sini dosyadan oku
function getCloudflareUrl() {
    try {
        // Dosyadan son URL'yi oku (host'daki script tarafından yazılır)
        const urlFile = '/app/public-url.txt'; // Container içindeki path
        if (fs.existsSync(urlFile)) {
            const url = fs.readFileSync(urlFile, 'utf8').trim();
            if (url && url.includes('trycloudflare.com')) {
                return url;
            }
        }
        return null;
    } catch (e) {
        return null;
    }
}

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// URL'den içerik çek (redirect'leri takip ederek)
function fetchUrl(targetUrl, options = {}) {
    return new Promise((resolve, reject) => {
        const maxRedirects = options.maxRedirects || 5;
        let redirectCount = 0;

        function doRequest(currentUrl) {
            const parsedUrl = new URL(currentUrl);
            const isHttps = parsedUrl.protocol === 'https:';
            const client = isHttps ? https : http;

            const requestOptions = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || (isHttps ? 443 : 80),
                path: parsedUrl.pathname + parsedUrl.search,
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': '*/*',
                    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Referer': 'https://www.google.com/'
                },
                timeout: 30000,
                rejectUnauthorized: false
            };

            const req = client.request(requestOptions, (res) => {
                // Redirect durumları
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    redirectCount++;
                    if (redirectCount > maxRedirects) {
                        reject(new Error('Too many redirects'));
                        return;
                    }
                    
                    const redirectUrl = new URL(res.headers.location, currentUrl).toString();
                    console.log(`  ↪️ Redirect ${redirectCount}: ${redirectUrl.substring(0, 80)}...`);
                    doRequest(redirectUrl);
                    return;
                }

                // Yanıtı topla
                let data = [];
                res.on('data', chunk => data.push(chunk));
                res.on('end', () => {
                    const buffer = Buffer.concat(data);
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: buffer,
                        finalUrl: currentUrl // Final URL (redirect sonrası)
                    });
                });
            });

            req.on('error', (err) => reject(err));
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            req.end();
        }

        doRequest(targetUrl);
    });
}

// HLS Manifest içindeki URL'leri proxy URL'lerine çevir
function rewriteManifestUrls(content, baseUrl, proxyBase) {
    const lines = content.split('\n');
    const result = [];
    
    for (let line of lines) {
        line = line.trim();
        
        // Boş satır veya yorum
        if (!line || line.startsWith('#')) {
            // EXT-X-STREAM-INF satırı (master manifest)
            if (line.includes('URI="')) {
                // URI içeren satır - Key veya segment map
                line = line.replace(/URI="([^"]+)"/g, (match, uri) => {
                    const absoluteUrl = new URL(uri, baseUrl).toString();
                    const proxyUrl = `${proxyBase}/stream-proxy?url=${encodeURIComponent(absoluteUrl)}`;
                    return `URI="${proxyUrl}"`;
                });
            }
            result.push(line);
            continue;
        }
        
        // URL satırı (relative veya absolute)
        let absoluteUrl;
        try {
            // Eğer zaten absolute URL ise
            if (line.startsWith('http://') || line.startsWith('https://')) {
                absoluteUrl = line;
            } else {
                // Relative URL - baseUrl ile birleştir
                absoluteUrl = new URL(line, baseUrl).toString();
            }
            
            // Proxy URL'sine çevir
            const proxyUrl = `${proxyBase}/stream-proxy?url=${encodeURIComponent(absoluteUrl)}`;
            result.push(proxyUrl);
        } catch (e) {
            // URL değilse olduğu gibi bırak
            result.push(line);
        }
    }
    
    return result.join('\n');
}

const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Cloudflare veya diğer reverse proxy arkasındaysak HTTPS kullan
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const url = new URL(req.url, `${protocol}://${host}`);
    const pathname = url.pathname;
    const proxyBase = `${protocol}://${host}`;

    console.log(`\n[${new Date().toLocaleTimeString()}] ${req.method} ${pathname}`);

    // Cloudflare URL endpoint
    if (pathname === '/cloudflare-url') {
        const cfUrl = getCloudflareUrl();
        res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
            url: cfUrl,
            timestamp: new Date().toISOString()
        }));
        return;
    }

    // EPG endpoint
    if (pathname === '/epg' && epgParser) {
        const channelId = url.searchParams.get('channel');
        
        if (channelId) {
            // Belirli kanalın EPG'si
            const current = epgParser.getCurrentProgram(channelId);
            const next = epgParser.getNextProgram(channelId);
            
            res.writeHead(200, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({ 
                channel: channelId,
                current: current,
                next: next
            }));
        } else {
            // Tüm EPG verileri
            res.writeHead(200, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({ 
                data: epgParser.getAllData(),
                lastFetch: epgParser.lastFetch
            }));
        }
        return;
    }

    // EPG yükleme endpoint'i
    if (pathname === '/epg-load' && epgParser) {
        const epgUrl = url.searchParams.get('url');
        if (!epgUrl) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'EPG URL gerekli' }));
            return;
        }

        try {
            await epgParser.fetchEPG(epgUrl);
            epgCache.data = epgParser.getAllData();
            epgCache.url = epgUrl;
            epgCache.timestamp = new Date();
            
            res.writeHead(200, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({ 
                success: true,
                message: 'EPG yüklendi',
                channels: Object.keys(epgCache.data).length
            }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                error: 'EPG yüklenemedi',
                message: error.message
            }));
        }
        return;
    }

    // Kısa URL yönlendirmesi /t
    if (pathname === '/t' || pathname === '/t/') {
        const cfUrl = getCloudflareUrl();
        if (cfUrl) {
            res.writeHead(302, { 'Location': cfUrl });
            res.end();
        } else {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>URL bulunamadı</h1><p>Cloudflare tunnel aktif değil.</p>');
        }
        return;
    }

    // Proxy endpoint: M3U dosyaları ve HLS manifestleri
    if (pathname === '/proxy' || pathname === '/stream-proxy') {
        const targetUrl = url.searchParams.get('url');
        if (!targetUrl) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'URL parametresi gerekli' }));
            return;
        }

        console.log(`  🎯 Hedef: ${targetUrl.substring(0, 100)}`);

        try {
            const result = await fetchUrl(targetUrl);
            
            console.log(`  ✅ Status: ${result.statusCode}`);
            console.log(`  📦 Content-Type: ${result.headers['content-type'] || 'unknown'}`);
            
            // İçerik tipini belirle
            let contentType = result.headers['content-type'] || 'application/octet-stream';
            const isTextContent = contentType.includes('text') || 
                                  contentType.includes('application/vnd.apple.mpegurl') ||
                                  contentType.includes('audio/mpegurl');
            
            // M3U8/M3U dosyası mı kontrol et
            const isM3U = targetUrl.includes('.m3u') || 
                          (isTextContent && result.body.toString('utf8', 0, 100).includes('#EXTM3U'));
            
            if (isM3U && isTextContent) {
                console.log(`  🎬 HLS Manifest tespit edildi - URL'leri rewrite ediliyor`);
                
                // Manifest içeriğini al
                let manifestContent = result.body.toString('utf8');
                
                // URL'leri rewrite et
                const baseUrl = result.finalUrl || targetUrl;
                manifestContent = rewriteManifestUrls(manifestContent, baseUrl, proxyBase);
                
                const rewrittenBuffer = Buffer.from(manifestContent, 'utf8');
                
                res.writeHead(result.statusCode, {
                    'Content-Type': 'application/vnd.apple.mpegurl',
                    'Content-Length': rewrittenBuffer.length,
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'no-cache'
                });
                res.end(rewrittenBuffer);
                
                console.log(`  ✏️  Manifest rewrite edildi (${rewrittenBuffer.length} bytes)`);
            } else {
                // Binary içerik (TS segment, vb.)
                res.writeHead(result.statusCode, {
                    'Content-Type': contentType,
                    'Content-Length': result.body.length,
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=3600'
                });
                res.end(result.body);
            }

        } catch (error) {
            console.error(`  ❌ Hata: ${error.message}`);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                error: 'Proxy hatası', 
                message: error.message,
                url: targetUrl 
            }));
        }
        return;
    }

    // Statik dosya servisi
    let filePath = pathname === '/' ? '/index.html' : pathname;
    filePath = path.join(__dirname, filePath);

    const extname = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(204);
                res.end();
            } else {
                res.writeHead(500);
                res.end('Sunucu hatası');
            }
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*'
            });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║    🚗 Tesla IPTV Proxy Server Başladı!         ║');
    console.log('╠════════════════════════════════════════════════╣');
    
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                console.log(`║  🌐 http://${net.address}:${PORT}                    `);
            }
        }
    }
    
    console.log(`║  💻 http://localhost:${PORT}                      `);
    console.log('╚════════════════════════════════════════════════╝');
    console.log('');
    console.log('Özellikler:');
    console.log('  • /proxy?url=...  - M3U dosyaları (rewrite yok)');
    console.log('  • /stream-proxy?url=... - HLS manifestleri (URL rewrite)');
    console.log('  • Otomatik redirect takibi');
    console.log('  • Manifest URL rewrite (relative → absolute → proxy)');
    console.log('');
});
