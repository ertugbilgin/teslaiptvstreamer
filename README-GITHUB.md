# 🚗 Tesla IPTV Streamer

Tesla araçlarının tarayıcısında çalışmak üzere optimize edilmiş, hafif ve kullanıcı dostu bir IPTV streamer uygulaması.

![Tesla IPTV](https://img.shields.io/badge/Tesla-Compatible-red)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Özellikler

- 📺 **Canlı TV** - M3U/M3U8 playlist desteği
- ❤️ **Favoriler** - Sık izlediğiniz kanalları kaydedin
- 🕐 **Son İzlenenler** - Son 10 kanalı otomatik hatırla
- 📱 **Tesla Optimize** - Dokunmatik ekran ve WebKit uyumlu
- 🌐 **Cloudflare Tunnel** - Her yerden erişim
- 🍓 **Raspberry Pi Desteği** - Düşük kaynak tüketimi
- 🐳 **Docker Ready** - Portainer ile kolay kurulum

## 🚀 Hızlı Başlangıç

### Docker ile Kurulum (Önerilen)

```bash
# Repo'yu klonlayın
git clone https://github.com/ertugbilgin/teslaiptvstreamer.git
cd teslaiptvstreamer

# Docker Compose ile başlat
docker-compose up -d
```

### Manuel Kurulum

```bash
# Gerekli bağımlılıklar
npm install

# Sunucuyu başlat
node proxy-server.js
```

## 🎯 Tesla'da Kullanım

1. **Bilgisayarınızda** sunucuyu başlatın
2. **Cloudflare Tunnel** ile dışarıya açın
3. **Tesla tarayıcısında** URL'yi açın
4. **IPTV linkinizi** yapıştırın ve izleyin!

## 📁 Proje Yapısı

```
├── proxy-server.js      # Ana sunucu (CORS proxy + HLS)
├── index.html           # Web arayüzü
├── epg-parser.js        # EPG (TV Rehberi) desteği
├── docker-compose.yml   # Docker yapılandırması
└── docs/               # Kurulum rehberleri
    ├── RASPBERRY-PI-GUIDE.md
    ├── PORTAINER-GUIDE.md
    └── TESLA-GUIDE.md
```

## 🔧 Donanım Desteği

| Cihaz | Destek | Notlar |
|-------|--------|--------|
| Raspberry Pi 4 | ✅ Tam | Önerilen |
| Raspberry Pi 3 | ✅ Tam | Çalışır |
| Raspberry Pi Zero 2 W | ✅ Tam | Çok verimli |
| Herhangi bir sunucu | ✅ | Node.js 18+ |

## 🛠️ Teknolojiler

- **Backend:** Node.js, Express-like HTTP server
- **Frontend:** Vanilla JavaScript, HLS.js
- **Proxy:** Özel CORS proxy (harici bağımlılık yok)
- **Container:** Docker, Docker Compose
- **Tunnel:** Cloudflare Tunnel (isteğe bağlı)

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen bir Pull Request gönderin.

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

---

⭐ **Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!**