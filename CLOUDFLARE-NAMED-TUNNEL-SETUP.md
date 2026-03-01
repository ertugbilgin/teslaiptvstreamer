# 🔒 Cloudflare Named Tunnel Kurulumu (Kalıcı URL)

Bu rehberle `xxx.trycloudflare.com` yerine `iptv.sizindomain.com` gibi kalıcı bir URL oluşturacaksınız.

---

## 📋 Gereksinimler

- ✅ Cloudflare hesabı (açtınız)
- ✅ Bir domain (Cloudflare'e ekli olmalı)
   - Kendi domaininiz varsa onu kullanın
   - Yoksa Freenom'dan ücretsiz `.tk`, `.ml` alın

---

## 🚀 Adım 1: Domain Ekleme (Eğer yoksa)

### Seçenek A: Kendi Domaininiz Var
1. Cloudflare Dashboard → "Add Site"
2. Domaininizi yazın
3. Nameserver'ları değiştirin (Cloudflare verecek)

### Seçenek B: Ücretsiz Domain (Freenom)
1. https://freenom.com adresine gidin
2. Ücretsiz hesap oluşturun
3. `.tk`, `.ml`, `.ga` uzantılı domain arayın
4. 12 aylığına ücretsiz kaydedin
5. Cloudflare'e ekleyin

---

## 🔧 Adım 2: Tunnel Oluşturma

### Pi'de Cloudflared Login
```bash
ssh pi@192.168.2.153

# Cloudflared'e giriş yapın
cloudflared tunnel login
```

Bu komut size bir URL verecek:
```
A browser window should have opened at the following URL:
https://dash.cloudflare.com/argotunnel?callback=https%3A%2F%2Flocalhost%3A1...
```

**Bu URL'yi bilgisayarınızda açıp yetkilendirme yapın.**

---

## 📝 Adım 3: Tunnel Oluşturma

```bash
# Tunnel oluştur (örnek ad: tesla-iptv)
cloudflared tunnel create tesla-iptv

# Çıktı örneği:
# Tunnel credentials written to /home/pi/.cloudflared/<TUNNEL_ID>.json
# cloudflared has generated a credentials file at ...
```

**TUNNEL_ID'yi not edin!** (Örn: `5f4e3d2c-1b2a-3c4d-5e6f-7a8b9c0d1e2f`)

---

## ⚙️ Adım 4: Config Dosyası

```bash
# Config dizini oluştur
mkdir -p ~/.cloudflared

# Config dosyası oluştur
nano ~/.cloudflared/config.yml
```

**İçeriği yapıştırın:**
```yaml
tunnel: TUNNEL_IDNIZI_BURAYA_YAZIN
credentials-file: /home/pi/.cloudflared/TUNNEL_IDNIZI_BURAYA_YAZIN.json

ingress:
  - hostname: iptv.sizindomain.com
    service: http://localhost:3000
  - service: http_status:404
```

**Örnek:**
```yaml
tunnel: 5f4e3d2c-1b2a-3c4d-5e6f-7a8b9c0d1e2f
credentials-file: /home/pi/.cloudflared/5f4e3d2c-1b2a-3c4d-5e6f-7a8b9c0d1e2f.json

ingress:
  - hostname: iptv.teslatv.tk
    service: http://localhost:3000
  - service: http_status:404
```

Kaydet: `Ctrl+X` → `Y` → `Enter`

---

## 🌐 Adım 5: DNS Kaydı Oluşturma

```bash
# Cloudflare'da otomatik DNS kaydı oluştur
cloudflared tunnel route dns tesla-iptv iptv.sizindomain.com

# Örnek:
# cloudflared tunnel route dns tesla-iptv iptv.teslatv.tk
```

---

## 🚀 Adım 6: Servis Olarak Kurma

```bash
# Systemd servisi oluştur
sudo cloudflared service install

# Servisi başlat
sudo systemctl start cloudflared

# Her açılışta otomatik başlasın
sudo systemctl enable cloudflared

# Durum kontrol
sudo systemctl status cloudflared
```

---

## ✅ Adım 7: Test

```bash
# Tunnel durumunu kontrol et
cloudflared tunnel info tesla-iptv

# URL'nizi test edin
# https://iptv.sizindomain.com
```

---

## 🎯 Sonuç

Artık kalıcı URL'niz var:
```
https://iptv.sizindomain.com
```

**Avantajlar:**
- ✅ Değişmiyor (kalıcı)
- ✅ Kısa ve akılda kalıcı
- ✅ Kendi domaininiz
- ✅ Cloudflare SSL/HTTPS

---

## 🔄 Yönetim Komutları

```bash
# Tunnel durdur
sudo systemctl stop cloudflared

# Tunnel başlat
sudo systemctl start cloudflared

# Logları gör
sudo journalctl -u cloudflared -f

# Tunnel listesi
cloudflared tunnel list

# Tunnel silme (gerekirse)
cloudflared tunnel delete tesla-iptv
```

---

## 🆘 Sorun Giderme

### "Failed to fetch tunnel" hatası
```bash
# Credentials dosyasını kontrol et
ls -la ~/.cloudflared/

# Config dosyasını kontrol et
cat ~/.cloudflared/config.yml
```

### DNS kaydı oluşmamış
Cloudflare Dashboard → DNS → Manuel CNAME kaydı ekle:
- **Type:** CNAME
- **Name:** iptv
- **Target:** `<TUNNEL_ID>.cfargotunnel.com`

### Servis başlamıyor
```bash
# Logları kontrol et
sudo journalctl -u cloudflared --no-pager -n 50
```

---

## 🎉 Tebrikler!

Artık Tesla'nızda `https://iptv.sizindomain.com` adresini kullanabilirsiniz!
