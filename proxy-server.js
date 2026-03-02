/**
 * Tesla IPTV Proxy Server
 * CORS proxy for IPTV streams and HLS manifest rewriting
 */

const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

const PORT = process.env.PORT || 3000;

// MIME types
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.m3u': 'application/x-mpegurl',
    '.m3u8': 'application/vnd.apple.mpegurl'
};

// Parse M3U playlist
function parseM3U(content) {
    const lines = content.split('\n');
    const channels = [];
    let currentChannel = null;

    for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('#EXTINF:')) {
            const nameMatch = trimmed.match(/tvg-name="([^"]+)"/);
            const logoMatch = trimmed.match(/tvg-logo="([^"]+)"/);
            const idMatch = trimmed.match(/tvg-id="([^"]+)"/);
            
            let name = trimmed.split(',').pop() || 'Unknown';
            if (nameMatch) name = nameMatch[1];
            
            currentChannel = {
                id: idMatch ? idMatch[1] : name,
                name: name,
                logo: logoMatch ? logoMatch[1] : null,
                url: null
            };
        } else if (trimmed && !trimmed.startsWith('#') && currentChannel) {
            currentChannel.url = trimmed;
            channels.push(currentChannel);
            currentChannel = null;
        }
    }

    return channels;
}

// Parse EPG XML
async function parseEPG(xmlContent) {
    const parser = new xml2js.Parser({ explicitArray: false });
    
    try {
        const result = await parser.parseStringPromise(xmlContent);
        const programmes = result.tv.programme;
        const epgData = {};

        programmes.forEach(prog => {
            const channelId = prog.$.channel;
            if (!epgData[channelId]) {
                epgData[channelId] = [];
            }
            
            epgData[channelId].push({
                title: prog.title ? prog.title._ || prog.title : 'Bilinmeyen',
                start: parseXMLTVDate(prog.$.start),
                stop: parseXMLTVDate(prog.$.stop),
                desc: prog.desc ? prog.desc._ || prog.desc : ''
            });
        });

        return epgData;
    } catch (e) {
        console.error('EPG parse error:', e);
        return {};
    }
}

// Parse XMLTV date format
function parseXMLTVDate(dateStr) {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6) - 1;
    const day = dateStr.substring(6, 8);
    const hour = dateStr.substring(8, 10);
    const minute = dateStr.substring(10, 12);
    
    return new Date(year, month, day, hour, minute);
}

// Proxy request with redirect support
function proxyRequest(targetUrl, res, rewriteUrls = false, redirectCount = 0) {
    console.log(`[DEBUG] Proxy: ${targetUrl.substring(0, 100)} rewrite=${rewriteUrls} redirect=${redirectCount}`);
    
    // Prevent infinite redirects
    if (redirectCount > 5) {
        res.statusCode = 508;
        res.end(JSON.stringify({ error: 'Too many redirects' }));
        return;
    }

    const parsed = url.parse(targetUrl);
    const protocol = parsed.protocol === 'https:' ? https : http;

    const options = {
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.path,
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.0',
            'Accept': '*/*',
            'Accept-Encoding': 'identity',
            'Connection': 'keep-alive'
        },
        timeout: 10000,
        rejectUnauthorized: false
    };

    const proxyReq = protocol.request(options, (proxyRes) => {
        console.log(`[DEBUG] Response status: ${proxyRes.statusCode}, content-type: ${proxyRes.headers['content-type']}`);
        
        // Handle redirects (301, 302, 307, 308)
        if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
            let redirectUrl = proxyRes.headers.location;
            
            // Resolve relative URLs
            if (!redirectUrl.startsWith('http')) {
                redirectUrl = url.resolve(targetUrl, redirectUrl);
            }
            
            console.log(`Redirect ${proxyRes.statusCode}: ${targetUrl} -> ${redirectUrl}`);
            
            // Follow redirect recursively
            proxyRequest(redirectUrl, res, rewriteUrls, redirectCount + 1);
            return;
        }

        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');
        
        // Content-Type
        const contentType = proxyRes.headers['content-type'] || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);

        if (rewriteUrls && contentType.includes('mpegurl')) {
            // Rewrite ALL HLS URLs (m3u8 and ts) through proxy for CORS
            console.log(`[DEBUG] Rewriting manifest: ${targetUrl}, content-type: ${contentType}`);
            let body = '';
            proxyRes.setEncoding('utf8');
            proxyRes.on('data', chunk => body += chunk);
            proxyRes.on('end', () => {
                const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
                console.log(`[DEBUG] Manifest body length: ${body.length}, baseUrl: ${baseUrl}`);
                
                // Log first few lines of manifest
                const lines = body.split('\n').filter(l => l.trim() && !l.startsWith('#')).slice(0, 5);
                console.log(`[DEBUG] Manifest URLs (first 5):`, lines);
                
                const rewritten = body.replace(/^([^#\s].+)$/gm, (match) => {
                    // Skip if already a proxy URL or comment
                    if (match.startsWith('/stream-proxy') || match.startsWith('/proxy') || match.startsWith('#')) {
                        return match;
                    }
                    // Make absolute URL if relative
                    const absoluteUrl = match.startsWith('http') ? match : baseUrl + match;
                    const proxiedUrl = `/stream-proxy?url=${encodeURIComponent(absoluteUrl)}`;
                    console.log(`[DEBUG] Rewrite: ${match.substring(0, 60)}... -> ${proxiedUrl.substring(0, 60)}...`);
                    return proxiedUrl;
                });
                console.log(`[DEBUG] Manifest rewritten, sending response`);
                res.end(rewritten);
            });
        } else {
            res.writeHead(proxyRes.statusCode);
            proxyRes.pipe(res);
        }
    });

    proxyReq.on('error', (err) => {
        console.error('[DEBUG] Proxy error:', err.message, 'for URL:', targetUrl.substring(0, 80));
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
    });

    proxyReq.on('timeout', () => {
        proxyReq.destroy();
        res.statusCode = 504;
        res.end(JSON.stringify({ error: 'Gateway timeout' }));
    });

    proxyReq.end();
}

// Create server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // Enable CORS for all responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
    }

    // Routes
    if (pathname === '/proxy') {
        const targetUrl = parsedUrl.query.url;
        if (!targetUrl) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'URL parameter required' }));
            return;
        }
        proxyRequest(targetUrl, res);

    } else if (pathname === '/stream-proxy') {
        const targetUrl = parsedUrl.query.url;
        if (!targetUrl) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'URL parameter required' }));
            return;
        }
        proxyRequest(targetUrl, res, true);

    } else if (pathname === '/epg') {
        const epgUrl = parsedUrl.query.url;
        if (!epgUrl) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'URL parameter required' }));
            return;
        }

        const parsed = url.parse(epgUrl);
        const protocol = parsed.protocol === 'https:' ? https : http;

        const options = {
            hostname: parsed.hostname,
            port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
            path: parsed.path,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.0'
            },
            timeout: 15000
        };

        const epgReq = protocol.request(options, async (epgRes) => {
            let xmlData = '';
            epgRes.setEncoding('utf8');
            epgRes.on('data', chunk => xmlData += chunk);
            epgRes.on('end', async () => {
                try {
                    const epgData = await parseEPG(xmlData);
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(epgData));
                } catch (e) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'EPG parse failed' }));
                }
            });
        });

        epgReq.on('error', (err) => {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
        });

        epgReq.on('timeout', () => {
            epgReq.destroy();
            res.statusCode = 504;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'EPG fetch timeout' }));
        });

        epgReq.end();

    } else if (pathname === '/parse-m3u') {
        let body = '';
        req.setEncoding('utf8');
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const channels = parseM3U(body);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(channels));
            } catch (e) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: e.message }));
            }
        });

    } else if (pathname === '/' || pathname === '/index.html') {
        const filePath = path.join(__dirname, 'index.html');
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                res.statusCode = 500;
                res.end('Error loading index.html');
                return;
            }
            res.setHeader('Content-Type', 'text/html');
            res.end(data);
        });

    } else {
        const filePath = path.join(__dirname, pathname);
        const ext = path.extname(filePath).toLowerCase();
        
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.statusCode = 404;
                res.end('Not found');
                return;
            }
            res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
            res.end(data);
        });
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚗 Tesla IPTV Server running on port ${PORT}`);
    console.log(`🌐 Domain: https://iptv.evmcp.shop`);
    console.log(`📡 Listening on 0.0.0.0:${PORT}`);
});
