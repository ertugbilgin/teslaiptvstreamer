// EPG (Electronic Program Guide) Parser
// XMLTV formatını parse eder

const xml2js = require('xml2js');
const https = require('https');
const http = require('http');

class EPGParser {
    constructor() {
        this.epgData = new Map(); // channel id -> programs
        this.lastFetch = null;
    }

    // EPG XML'sini indir ve parse et
    async fetchEPG(url) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const client = parsedUrl.protocol === 'https:' ? https : http;

            const requestOptions = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
                path: parsedUrl.pathname + parsedUrl.search,
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    'Accept': 'application/xml,text/xml,*/*'
                },
                timeout: 30000,
                rejectUnauthorized: false
            };

            const req = client.request(requestOptions, (res) => {
                let data = [];
                res.on('data', chunk => data.push(chunk));
                res.on('end', () => {
                    const buffer = Buffer.concat(data);
                    this.parseXML(buffer.toString())
                        .then(() => resolve())
                        .catch(reject);
                });
            });

            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('EPG timeout'));
            });
            req.end();
        });
    }

    // XML'i parse et
    async parseXML(xmlString) {
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xmlString);

        if (!result.tv || !result.tv.programme) {
            throw new Error('Geçersiz EPG formatı');
        }

        const programmes = Array.isArray(result.tv.programme) 
            ? result.tv.programme 
            : [result.tv.programme];

        // Kanal bazında grupla
        this.epgData.clear();
        
        for (const prog of programmes) {
            const channelId = prog.$.channel;
            if (!this.epgData.has(channelId)) {
                this.epgData.set(channelId, []);
            }

            this.epgData.get(channelId).push({
                title: prog.title ? (Array.isArray(prog.title) ? prog.title[0]._ : prog.title._ || prog.title) : 'Bilinmeyen Program',
                description: prog.desc ? (Array.isArray(prog.desc) ? prog.desc[0]._ : prog.desc._ || prog.desc) : '',
                start: this.parseEPGTime(prog.$.start),
                stop: this.parseEPGTime(prog.$.stop),
                category: prog.category ? (Array.isArray(prog.category) ? prog.category[0]._ : prog.category._ || prog.category) : ''
            });
        }

        // Her kanal için programları zaman sıralamasına göre sırala
        for (const [channelId, programs] of this.epgData) {
            programs.sort((a, b) => a.start - b.start);
        }

        this.lastFetch = new Date();
    }

    // EPG zaman formatını parse et (XMLTV format: 20240301120000 +0000)
    parseEPGTime(timeStr) {
        if (!timeStr) return new Date();
        
        // YYYYMMDDHHMMSS formatını parse et
        const year = parseInt(timeStr.substring(0, 4));
        const month = parseInt(timeStr.substring(4, 6)) - 1;
        const day = parseInt(timeStr.substring(6, 8));
        const hour = parseInt(timeStr.substring(8, 10));
        const minute = parseInt(timeStr.substring(10, 12));
        const second = parseInt(timeStr.substring(12, 14));

        return new Date(year, month, day, hour, minute, second);
    }

    // Şu anki programı bul
    getCurrentProgram(channelId) {
        const programs = this.epgData.get(channelId);
        if (!programs) return null;

        const now = new Date();
        
        for (const prog of programs) {
            if (prog.start <= now && prog.stop >= now) {
                return prog;
            }
        }

        return null;
    }

    // Sonraki programı bul
    getNextProgram(channelId) {
        const programs = this.epgData.get(channelId);
        if (!programs) return null;

        const now = new Date();
        
        for (const prog of programs) {
            if (prog.start > now) {
                return prog;
            }
        }

        return null;
    }

    // Tüm EPG verilerini getir
    getAllData() {
        const result = {};
        for (const [channelId, programs] of this.epgData) {
            result[channelId] = programs;
        }
        return result;
    }

    // Kanal ID'sini normalize et (farklı formatları eşleştirmek için)
    normalizeChannelId(channelId) {
        return channelId.toLowerCase().replace(/[^a-z0-9]/g, '');
    }
}

module.exports = EPGParser;
