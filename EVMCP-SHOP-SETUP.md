# 🚀 evmcp.shop Domain Kurulumu

Mevcut domaininizi Cloudflare Tunnel ile kullanın!

---

## 📋 Ön Kontrol

Domain `evmcp.shop` şu an nerede yönetiliyor?

**A) Cloudflare'e daha önce ekledim** → Adım 2'ye geç
**B) Başka yerde (GoDaddy, Namecheap vb.)** → Adım 1'e geç

---

## 🔧 Adım 1: Domain'i Cloudflare'e Ekleme (Eğer ekli değilse)

### 1.1 Cloudflare Dashboard
```
https://dash.cloudflare.com
```

### 1.2 "Add Site" Tıkla
- Domain: `evmcp.shop`
- Plan: **FREE** seçin

### 1.3 DNS Tarama
Cloudflare mevcut DNS kayıtlarını bulacak.

### 1.4 Nameserver Değiştirme
Cloudflare size 2 nameserver verecek:
```
lara.ns.cloudflare.com
greg.ns.cloudflare.com
```
(Bunlar örnek, size özel olacak)

### 1.5 Domain Yönetiminde Nameserver Güncelle
Domaininizin yönetim paneline (GoDaddy, Namecheap vb.) gidin:
- **Nameservers** bölümünü bulun
- **Custom Nameservers** seçin
- Cloudflare verdiği 2 nameserver'ı yazın
- Kaydedin

### 1.6 Aktivasyon Bekleyin
⏱️ **5-30 dakika** sürebilir

Cloudflare'de "Active" yazana kadar bekleyin.

---

## 🚀 Adım 2: Tunnel Oluşturma (Pi'de)

### 2.1 SSH ile Pi'ye Bağlan
```bash
ssh pi@192.168.2.153
```

### 2.2 Cloudflared Login
```bash
cloudflared tunnel login
```

**Çıkan URL'yi bilgisayarınızda açın**, yetkilendirin.

### 2.3 Tunnel Oluştur
```bash
cloudflared tunnel create tesla-iptv
```

**TUNNEL_ID'yi not edin!** (Örn: `5f4e3d2c-...`)

Çıktı örneği:
```
Tunnel credentials written to /home/pi/.cloudflared/5f4e3d2c-xxxx-xxxx-xxxx-7a8b9c0d1e2f.json
```

---

## ⚙️ Adım 3: Config Dosyası

### 3.1 Dizin Oluştur
```bash
mkdir -p ~/.cloudflared
```

### 3.2 Config Yaz
```bash
nano ~/.cloudflared/config.yml
```

**İçerik:**
```yaml
tunnel: TUNNEL_IDNIZI_BURAYA_YAZIN
credentials-file: /home/pi/.cloudflared/TUNNEL_IDNIZI_BURAYA_YAZIN.json

ingress:
  - hostname: iptv.evmcp.shop
    service: http://localhost:3000
  - service: http_status:404
```

**ÖRNEK:**
```yaml
tunnel: 5f4e3d2c-1b2a-3c4d-5e6f-7a8b9c0d1e2f
credentials-file: /home/pi/.cloudflared/5f4e3d2c-1b2a-3c4d-5e6f-7a8b9c0d1e2f.json

ingress:
  - hostname: iptv.evmcp.shop
    service: http://localhost:3000
  - service: http_status:404
```

Kaydet: `Ctrl+X` → `Y` → `Enter`

---

## 🌐 Adım 4: DNS Kaydı

### 4.1 DNS Otomatik Ekleme
```bash
cloudflared tunnel route dns tesla-iptv iptv.evmcp.shop
```

### 4.2 Veya Manuel Ekleme (Cloudflare Dashboard)
Eğer otomatik çalışmazsa:

Cloudflare Dashboard → DNS → Add Record:
- **Type:** CNAME
- **Name:** iptv
- **Target:** `<TUNNEL_ID>.cfargotunnel.com`
- **Proxy Status:** 🟠 Proxied (turuncu bulut)

---

## 🎯 Adım 5: Servis Olarak Kurma

### 5.1 Servis Kur
```bash
sudo cloudflared service install
```

### 5.2 Başlat ve Otomatik Başlatma Etkinleştir
```bash
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

### 5.3 Durum Kontrol
```bash
sudo systemctl status cloudflared
```

Yeşil ✓ görmelisiniz!

---

## ✅ Adım 6: Test

### 6.1 Tunnel Bilgisi
```bash
cloudflared tunnel info tesla-iptv
```

### 6.2 Tarayıcıda Aç
```
https://iptv.evmcp.shop
```

🎉 **Kalıcı URL'niz hazır!**

---

## 🔧 Yönetim Komutları

```bash
# Servis durdur
sudo systemctl stop cloudflared

# Servis başlat
sudo systemctl start cloudflared

# Yeniden başlat
sudo systemctl restart cloudflared

# Logları gör
sudo journalctl -u cloudflared -f

# Tunnel listesi
cloudflared tunnel list
```

---

## 🎉 Sonuç

Artık kalıcı URL'niz:
```
https://iptv.evmcp.shop
```

**Tesla'da kullanım:**
1. Tesla tarayıcısını açın
2. `iptv.evmcp.shop` yazın
3. IPTV linkinizi yapıştırın
4. İzlemeye başlayın!

**Artık URL değişmeyecek!** 🚗📺
