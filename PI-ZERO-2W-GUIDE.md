# 🍓 Raspberry Pi Zero 2 W Kurulum Rehberi

Home Assistant'ınızı karıştırmadan, sadece Pi Zero 2 W kullanarak 7/24 çalışan IPTV sunucusu!

## 📦 Gereksinimler

- Raspberry Pi Zero 2 W
- MicroSD Kart (8GB+ yeterli)
- USB-C güç kablosu (telefon şarjı olur)
- (Opsiyonel) GPIO header + fan (ısınma olmaz ama yine de iyi olur)

---

## 📝 Adım 1: SD Kart Hazırlama

### Raspberry Pi Imager Kullanımı

1. **Raspberry Pi Imager** indir: https://www.raspberrypi.com/software/

2. **OS Seçimi**:
   - `Raspberry Pi OS (64-bit)` veya
   - `Raspberry Pi OS Lite (64-bit)` (daha hafif, önerilir)

3. **Gelişmiş Ayarlar** (Ctrl+Shift+X ile açılır):
   ```
   ☑️ SSH aktif et
      Şifre: guclu_bir_sifre_belirle
   
   ☑️ WiFi yapılandır
      SSID: Ev_Wifi_Adiniz
      Şifre: Wifi_Sifreniz
      Ülke: TR
   
   ☑️ Kullanıcı adı/şifre ayarla
      Kullanıcı: pi
      Şifre: tesla123! (örnek)
   ```

4. **Yazdır** ve SD kartı Pi Zero'ya tak

---

## 🔌 Adım 2: İlk Başlatma

### Güç Verme
1. SD kartı takın
2. USB-C kablosunu takın
3. Kırmızı LED yanacak, yeşil LED SD kart aktivitesi gösterecek
4. ~2-3 dakika içinde açılacak

### IP Adresini Bulma
Router'ınızdan veya şu komutla:
```bash
# Mac/Linux terminal'den
ping raspberrypi.local

# VEYA
nmap -sn 192.168.1.0/24 | grep raspberry
```

### SSH ile Bağlanma
```bash
ssh pi@raspberrypi.local
# Şifre: belirlediğiniz şifre
```

---

## ⚙️ Adım 3: Temel Kurulum

```bash
# Sistemi güncelle
sudo apt update && sudo apt upgrade -y

# Zaman dilimi ayarla
sudo timedatectl set-timezone Europe/Istanbul

# Node.js kontrol et (genelde kurulu gelmez)
node --version

# Node.js kur (ARMv6/ARMv7/ARM64 uyumlu)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Doğrula
node --version  # v18.x.x görmelisiniz
npm --version
```

---

## 📂 Adım 4: IPTV Sunucusunu Kurma

### Git ile İndirme
```bash
# Git kur
sudo apt install -y git

# Projeyi indir
cd ~
git clone https://github.com/kullaniciadi/tesla-iptv.git
# Eğer kendi GitHub repo'nuz yoksa:
```

### Manuel Dosya Yükleme (GitHub yoksa)
**Bilgisayarınızdan** şu komutu çalıştırın:
```bash
# Bilgisayar terminal'inden
scp -r /Users/ertugbilgin/PROJECTS/iptv/* pi@raspberrypi.local:/home/pi/tesla-iptv/
```

### Test Etme
```bash
cd ~/tesla-iptv

# Test amaçlı çalıştır
node proxy-server.js

# Çalışıyorsa Ctrl+C ile durdur
```

---

## 🌐 Adım 5: Cloudflared Kurulumu (ARM)

```bash
cd /tmp

# Pi Zero 2 W için (ARM 64-bit)
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64

# İndirme başarısız olursa ARMv7 dene:
# wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm

# Kur
sudo mv cloudflared-linux-arm64 /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared

# Test
cloudflared --version
```

---

## 🤖 Adım 6: Otomatik Başlatma (Systemd)

### 1. IPTV Sunucu Servisi
```bash
sudo nano /etc/systemd/system/tesla-iptv.service
```

**İçerik**:
```ini
[Unit]
Description=Tesla IPTV Server
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/tesla-iptv
ExecStart=/usr/bin/node proxy-server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### 2. Cloudflare Tunnel Servisi
```bash
sudo nano /etc/systemd/system/cloudflared-tesla.service
```

**İçerik**:
```ini
[Unit]
Description=Cloudflare Tunnel for Tesla IPTV
After=network-online.target tesla-iptv.service
Wants=network-online.target
Requires=tesla-iptv.service

[Service]
Type=simple
User=pi
ExecStart=/usr/local/bin/cloudflared tunnel --url http://localhost:3000
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### 3. Servisleri Aktif Et
```bash
# Yenile
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

## 🔍 Adım 7: URL'yi Öğrenme

### Yöntem 1: Loglardan Bulma
```bash
# Tunnel loglarından URL'yi gör
sudo journalctl -u cloudflared-tesla.service -f

# Çıktıda şu satırı bulun:
# "Your quick Tunnel has been created! Visit it at: https://xxxxx.trycloudflare.com"
```

### Yöntem 2: Manuel Test
```bash
# Tunnel'ı durdur
sudo systemctl stop cloudflared-tesla.service

# Manuel çalıştır (URL'yi görmek için)
cloudflared tunnel --url http://localhost:3000

# URL'yi not al, sonra Ctrl+C
# Tekrar servisi başlat
sudo systemctl start cloudflared-tesla.service
```

### Yöntem 3: Script ile Otomatik Kaydetme
```bash
# URL'yi dosyaya kaydeden script
cat << 'EOF' | sudo tee /usr/local/bin/save-tunnel-url.sh
#!/bin/bash
sleep 30  # Tunnel'ın açılmasını bekle
URL=$(sudo journalctl -u cloudflared-tesla.service --since "1 minute ago" | grep -oP "https://[a-z0-9-]+\.trycloudflare\.com" | tail -1)
if [ ! -z "$URL" ]; then
    echo "$(date): $URL" >> /home/pi/tunnel-urls.log
    echo "Tunnel URL: $URL"
fi
EOF

sudo chmod +x /usr/local/bin/save-tunnel-url.sh

# Her açılışta çalıştır
echo "@reboot /usr/local/bin/save-tunnel-url.sh" | crontab -
```

---

## 📱 Telegram Bildirim (Opsiyonel ama Çok Kullanışlı)

Her açılışta URL'yi Telegram'dan alabilirsiniz:

### 1. Telegram Bot Oluşturma
1. [@BotFather](https://t.me/botfather) yazın
2. `/newbot` → İsim verin → **Token** alın
3. Bot'a mesaj atın
4. `https://api.telegram.org/bot<TOKEN>/getUpdates` ile **chat_id** öğrenin

### 2. Bildirim Script'i
```bash
cat << 'EOF' | sudo tee /usr/local/bin/telegram-notify.sh
#!/bin/bash
TOKEN="YOUR_BOT_TOKEN_HERE"
CHAT_ID="YOUR_CHAT_ID_HERE"

sleep 30
URL=$(sudo journalctl -u cloudflared-tesla.service --since "1 minute ago" | grep -oP "https://[a-z0-9-]+\.trycloudflare\.com" | tail -1)

if [ ! -z "$URL" ]; then
    MESSAGE="🚗 Tesla IPTV aktif!%0A%0A🔗 URL: $URL%0A%0A📺 Tesla browser'da açabilirsiniz."
    curl -s -X POST "https://api.telegram.org/bot$TOKEN/sendMessage" \
        -d "chat_id=$CHAT_ID" \
        -d "text=$MESSAGE" \
        -d "parse_mode=HTML"
fi
EOF

sudo chmod +x /usr/local/bin/telegram-notify.sh
```

### 3. Servise Ekleme
```bash
sudo systemctl edit cloudflared-tesla.service
```

Aşağıdakini ekle:
```ini
[Service]
ExecStartPost=/bin/sh -c 'sleep 35 && /usr/local/bin/telegram-notify.sh'
```

---

## 🔧 Bakım Komutları

```bash
# Log görüntüleme
sudo journalctl -u tesla-iptv.service -f
sudo journalctl -u cloudflared-tesla.service -f

# Yeniden başlatma
sudo systemctl restart tesla-iptv.service
sudo systemctl restart cloudflared-tesla.service

# Durum kontrol
sudo systemctl status tesla-iptv.service

# Son URL'yi gör
tail -1 /home/pi/tunnel-urls.log
```

---

## ⚡ Güç Optimizasyonu (Opsiyonel)

Pi Zero 2 W zaten çok az güç harcar ama optimize etmek isterseniz:

```bash
# HDMI'yi kapat (headless kullanım için)
sudo nano /boot/config.txt
# Sonuna ekle:
hdmi_blanking=2
hdmi_ignore_hotplug=1
hdmi_ignore_edid=0xa5000080

# Bluetooth kapat (gerekirse)
sudo systemctl disable bluetooth
sudo systemctl stop bluetooth

# LED'leri kapat
echo 'dtparam=act_led_trigger=none' | sudo tee -a /boot/config.txt
echo 'dtparam=act_led_activelow=on' | sudo tee -a /boot/config.txt

# Yeniden başlat
sudo reboot
```

---

## 🌡️ Isı Yönetimi

Pi Zero 2 W genelde ısınmaz ama kontrol etmek isterseniz:

```bash
# Sıcaklık görme
vcgencmd measure_temp

# Sürekli izleme
watch -n 2 vcgencmd measure_temp
```

**Normal sıcaklık**: 40-60°C
**Yüksek sıcaklık**: 70°C+ (soğutma önerilir)

Pasif soğutma için küçük bir heatsink yeterli.

---

## ✅ Kurulum Tamamlandığında

1. ✅ Pi Zero fişe takılı kalsın (güç adaptörüne)
2. ✅ Her açılışta otomatik başlar
3. ✅ Yeni Cloudflare URL'si alır
4. ✅ (Opsiyonel) Telegram'dan bildirim gelir
5. ✅ Tesla'da URL'yi açıp izleyin!

**Tahmini aylık maliyet**: ~50 kuruş - 1 TL (elektrik)

Artık evinizde 7/24 çalışan, sesiz, ucuz bir IPTV sunucunuz var! 🎉
