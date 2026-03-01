# 🍓 Raspberry Pi Kurulum Rehberi

Evet! Raspberry Pi üzerinden çalıştırmak mükemmel bir fikir. Böylece bilgisayarınızı açık tutmak zorunda kalmazsınız.

## 📋 Gereksinimler

- Raspberry Pi 3, 4 veya 5 (Pi Zero da çalışır ama yavaş olur)
- Raspberry Pi OS (Lite veya Desktop)
- İnternet bağlantısı (Ethernet veya WiFi)
- 16GB+ SD Kart

---

## 🔧 Adım 1: Raspberry Pi OS Kurulumu

### SD Kart Hazırlama
1. [Raspberry Pi Imager](https://www.raspberrypi.com/software/) indirin
2. Raspberry Pi OS Lite (64-bit) seçin
3. SD kartı hazırlayın
   - SSH aktif edin (imager'da ayarlar bölümünde)
   - WiFi bilgilerinizi girin (opsiyonel)

---

## 💻 Adım 2: Bağlanma

### SSH ile bağlanma
```bash
# Terminal'den (Mac/Linux)
ssh pi@raspberrypi.local

# Şifre: raspberry (varsayılan)
```

### İlk kurulum
```bash
# Şifreyi değiştirin
passwd

# Sistemi güncelleyin
sudo apt update && sudo apt upgrade -y

# Node.js kurun
# Raspberry Pi OS'da Node.js önceden kurulu gelebilir, kontrol edin:
node --version

# Kurulu değilse veya eski sürümse:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## 📦 Adım 3: Projeyi Yükleme

### Git ile klonlama
```bash
# Git kurulu değilse
sudo apt install -y git

# Projeyi indir
cd ~
git clone https://github.com/kullaniciadi/tesla-iptv.git
# VEYA dosyaları scp ile atın:
# scp -r /yerel/dizin/ pi@raspberrypi.local:/home/pi/tesla-iptv
```

### Manuel dosya yükleme (GitHub yoksa)
Bilgisayarınızdan:
```bash
scp -r /Users/ertugbilgin/PROJECTS/iptv/* pi@raspberrypi.local:/home/pi/tesla-iptv/
```

---

## 🚀 Adım 4: Sunucuyu Kurma

```bash
cd ~/tesla-iptv

# Test amaçlı çalıştır
node proxy-server.js

# Çalışıyorsa Ctrl+C ile durdur
```

---

## 🌐 Adım 5: Cloudflared Kurulumu

```bash
# ARM64 için cloudflared indir (Pi 3/4/5)
cd /tmp
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64

# ARM (32-bit) için (Pi Zero, Pi 2):
# wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm

# Kurulum
sudo mv cloudflared-linux-arm64 /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared

# Test
cloudflared --version
```

---

## ⚙️ Adım 6: Otomatik Başlatma (Systemd Service)

### 1. Sunucu servisi oluşturma
```bash
sudo nano /etc/systemd/system/tesla-iptv.service
```

İçeriği yapıştırın:
```ini
[Unit]
Description=Tesla IPTV Server
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/tesla-iptv
ExecStart=/usr/bin/node proxy-server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 2. Cloudflare Tunnel servisi oluşturma
```bash
sudo nano /etc/systemd/system/cloudflared-tesla.service
```

İçeriği yapıştırın:
```ini
[Unit]
Description=Cloudflare Tunnel for Tesla IPTV
After=network.target tesla-iptv.service
Requires=tesla-iptv.service

[Service]
Type=simple
User=pi
ExecStart=/usr/local/bin/cloudflared tunnel --url http://localhost:3000
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 3. Servisleri aktif etme
```bash
# Servisleri yenile
sudo systemctl daemon-reload

# Sunucuyu aktif et
sudo systemctl enable tesla-iptv.service
sudo systemctl start tesla-iptv.service

# Tunnel'ı aktif et
sudo systemctl enable cloudflared-tesla.service
sudo systemctl start cloudflared-tesla.service

# Durum kontrol
sudo systemctl status tesla-iptv.service
sudo systemctl status cloudflared-tesla.service
```

---

## 📋 Adım 7: Logları İzleme

### URL'yi bulma
```bash
# Tunnel loglarından URL'yi gör
sudo journalctl -u cloudflared-tesla.service -f

# Çıktıda şuna benzer bir satır göreceksiniz:
# INF |  https://xxxxx.trycloudflare.com
```

### Log komutları
```bash
# Sunucu logları
sudo journalctl -u tesla-iptv.service -f

# Tunnel logları  
sudo journalctl -u cloudflared-tesla.service -f

# Tüm loglar
sudo journalctl -f
```

---

## 🔄 Servis Yönetimi

```bash
# Durdurma
sudo systemctl stop tesla-iptv.service
sudo systemctl stop cloudflared-tesla.service

# Başlatma
sudo systemctl start tesla-iptv.service
sudo systemctl start cloudflared-tesla.service

# Yeniden başlatma
sudo systemctl restart tesla-iptv.service

# Otomatik başlatmayı devre dışı bırakma
sudo systemctl disable tesla-iptv.service
sudo systemctl disable cloudflared-tesla.service
```

---

## ⚡ Güç Tüketimi

| Cihaz | Güç Tüketimi | Aylık Maliyet* |
|-------|-------------|----------------|
| Raspberry Pi 4 | ~5W | ~$1-2 |
| Raspberry Pi 3 | ~3W | ~$1 |
| Raspberry Pi Zero 2W | ~1.5W | ~$0.5 |
| Laptop | ~30-60W | ~$10-20 |

*Elektrik fiyatına göre değişir (Türkiye için yaklaşık)

---

## 🛠️ Sorun Giderme

### "Permission denied" hatası
```bash
# Dosya izinlerini düzelt
chmod +x /usr/local/bin/cloudflared

# Veya sudo ile çalıştır
sudo cloudflared tunnel --url http://localhost:3000
```

### "Port already in use" hatası
```bash
# Hangi process kullanıyor
sudo lsof -i :3000

# Process'i öldür
sudo kill -9 <PID>
```

### Servis başlamıyor
```bash
# Logları kontrol et
sudo journalctl -u tesla-iptv.service --no-pager -n 50

# Node.js kontrol
which node
node --version
```

### Tunnel URL'si gözükmüyor
```bash
# Manuel test
cloudflared tunnel --url http://localhost:3000

# Eğer çalışıyorsa servis dosyasını kontrol et
sudo systemctl status cloudflared-tesla.service
```

---

## 🔒 Güvenlik İpuçları

1. **Varsayılan şifreyi değiştirin**:
   ```bash
   passwd
   ```

2. **SSH anahtarı kullanın** (şifre yerine):
   ```bash
   ssh-copy-id pi@raspberrypi.local
   ```

3. **Firewall ayarlayın** (opsiyonel):
   ```bash
   sudo apt install ufw
   sudo ufw allow 22/tcp    # SSH
   sudo ufw allow 3000/tcp  # IPTV (sadece yerel ağ için)
   sudo ufw enable
   ```

---

## 📱 Telegram Bildirim (Opsiyonel)

Her açılışta URL'yi Telegram'dan almak isterseniz:

```bash
# Telegram bot oluşturun ve token alın
# Chat ID öğrenin

# Log script'i ekleme
echo '#!/bin/bash
URL=$(sudo journalctl -u cloudflared-tesla.service --since "1 minute ago" | grep -oP "https://\S+\.trycloudflare\.com" | tail -1)
if [ ! -z "$URL" ]; then
    curl -s -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" \
        -d "chat_id=<CHAT_ID>" \
        -d "text=Tesla IPTV URL: $URL"
fi' | sudo tee /usr/local/bin/notify-telegram.sh

chmod +x /usr/local/bin/notify-telegram.sh
```

---

## ✅ Özet

Kurulum tamamlandığında:

1. ✅ Raspberry Pi fişe takılı kaldığı sürece çalışır
2. ✅ Elektrik kesintisi sonrası otomatik başlar
3. ✅ Her açılışta yeni Cloudflare URL'si alır
4. ✅ Telefonunuzdan veya Tesla'dan erişebilirsiniz

**Avantajlar:**
- 7/24 açık kalabilir
- Çok az elektrik harcar (~$1-2/ay)
- Sesiz çalışır (fan yok)
- Uzaktan yönetilebilir (SSH)

Artık Tesla'nızda istediğiniz zaman IPTV izleyebilirsiniz! 🚗📺
