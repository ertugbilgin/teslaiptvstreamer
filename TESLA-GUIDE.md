# 🚗 Tesla'da Kullanım Rehberi

## Hızlı Başlangıç (En Kolay Yöntem)

### Adım 1: Bilgisayarınızda Sunucuyu Başlatın

Terminal'de:
```bash
cd /Users/ertugbilgin/PROJECTS/iptv
node proxy-server.js
```

Sunucu çalışmaya başlayacak:
```
🚗 Tesla IPTV Proxy Server Başladı!
🌐 http://192.168.1.200:3000
💻 http://localhost:3000
```

### Adım 2: İnternete Açın (Cloudflare Tunnel)

Yeni bir terminal penceresi açın:

```bash
# macOS
brew install cloudflared

# Windows  
winget install Cloudflare.cloudflared

# Linux
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
```

Kurulumdan sonra:
```bash
cloudflared tunnel --url http://localhost:3000
```

Çıktı:
```
Tunnel established at https://abc123.trycloudflare.com
```

Bu URL'yi kopyalayın! 🎉

### Adım 3: Tesla'da Açın

1. Tesla'nızı WiFi'ye bağlayın (veya telefon hotspot)
2. Browser'ı açın
3. `https://abc123.trycloudflare.com` yazın
4. IPTV linkinizi yapıştırın
5. İzlemeye başlayın! 📺

---

## ⚡ Her Seferinde Yapılması Gerekenler

Her Tesla kullanımında:

1. **Bilgisayarı açın**
2. **Sunucuyu başlatın**: `node proxy-server.js`
3. **Tunnel açın**: `cloudflared tunnel --url http://localhost:3000`
4. **Yeni URL'yi Tesla'da açın** (her seferinde farklı olur)

---

## 🔧 Alternatif: Ngrok

Cloudflare yerine ngrok da kullanabilirsiniz:

```bash
# Kurulum
brew install ngrok  # macOS

# Çalıştırma
ngrok http 3000
```

Ancak ücretsiz ngrok:
- Her zaman farklı URL verir
- 8 saat sonra kapanır
- Daha yavaş

**Cloudflare Tunnel önerilir!**

---

## 🏠 Evde Kalıcı Çözüm (Opsiyonel)

Eğer bilgisayarınızı sürekli açık tutmak istemiyorsanız:

### Raspberry Pi (Önerilen)
- $30-40 maliyet
- 5W güç tüketimi (ayda ~$1 elektrik)
- 7/24 açık kalabilir

Kurulum:
```bash
# Raspberry Pi'de
git clone <repo-url>
cd tesla-iptv
npm install  # gerekirse
node proxy-server.js &
cloudflared tunnel --url http://localhost:3000 &
```

---

## 🌐 Public IPTV Test Linkleri

Çalışan linkler bulmak için:
- https://github.com/iptv-org/iptv (GitHub IPTV listesi)
- Kendi IPTV sağlayıcınızın M3U linki

⚠️ **Yasal Uyarı**: Sadece lisanslı içerikleri izleyin!

---

## ❓ Sık Sorulan Sorular

**Q: Tunnel URL'si her seferinde değişiyor, sabit yapabilir miyim?**
A: Evet! Cloudflare hesabı açıp kalıcı tunnel oluşturabilirsiniz. Bkz: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/

**Q: Arkadaşlarımla paylaşabilir miyim?**
A: Evet, aynı URL'yi kullanabilirler. Ancak bant genişliği sizin internet hızınıza bağlı.

**Q: İnternetsiz çalışır mı?**
A: Hayır, hem bilgisayarınız hem Tesla internete bağlı olmalı.

**Q: VPN ile çalışır mı?**
A: Evet, bilgisayarınızda VPN açıkken de çalışır.

---

## 🆘 Sorun Giderme

**"Connection refused" hatası:**
- Sunucu çalışıyor mu kontrol edin
- Firewall kapalı mı?

**Video oynamıyor:**
- Terminal'de hata mesajlarına bakın
- Farklı bir kanal deneyin
- IPTV linkinizi kontrol edin

**Tesla browser çok yavaş:**
- Düşük kaliteli (360p/480p) kanalları seçin
- Park halindeyken kullanın (daha iyi sinyal)
