# 🐳 Portainer ile Docker Kurulum Rehberi

Portainer kurulu Pi 2'nizde **Docker container** olarak çalıştırmak en kolay yöntem!

## 🎯 Avantajları

- ✅ Portainer arayüzünden yönetim
- ✅ Tek tıkla başlat/durdur
- ✅ Logları web'den görüntüleme
- ✅ Otomatik yeniden başlatma
- ✅ Home Assistant'a sıfır etki (ayrı container)

---

## 📦 Yöntem 1: Portainer Stack ile Kurulum (Önerilen)

### Adım 1: Portainer'a Giriş
1. Pi 2'nizin IP adresini öğrenin (örn: `192.168.1.50`)
2. Browser'da `http://192.168.1.50:9000` açın (Portainer portu farklıysa değiştirin)
3. Giriş yapın

### Adım 2: Stack Oluşturma
1. Sol menüden **Stacks** → **Add stack**
2. **Name**: `tesla-iptv`
3. **Web editor** seçeneğini seçin
4. Aşağıdaki yapıştırın:

```yaml
version: '3.8'

services:
  tesla-iptv:
    image: node:18-alpine
    container_name: tesla-iptv-server
    restart: unless-stopped
    ports:
      - "3000:3000"
    working_dir: /app
    volumes:
      - /opt/tesla-iptv:/app
    environment:
      - NODE_ENV=production
      - PORT=3000
    command: >
      sh -c "
        if [ ! -f /app/proxy-server.js ]; then
          echo 'Dosyalar yükleniyor...' &&
          wget -q https://raw.githubusercontent.com/KULLANICI/REPO/main/proxy-server.js -O /app/proxy-server.js &&
          wget -q https://raw.githubusercontent.com/KULLANICI/REPO/main/index.html -O /app/index.html;
        fi &&
        node /app/proxy-server.js
      "
    networks:
      - tesla-network

  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: tesla-iptv-tunnel
    restart: unless-stopped
    command: tunnel --url http://tesla-iptv:3000
    depends_on:
      - tesla-iptv
    networks:
      - tesla-network

networks:
  tesla-network:
    driver: bridge
```

5. **Deploy the stack** butonuna tıklayın

---

## 📁 Yöntem 2: Manuel Dosya Yükleme (Daha Güvenilir)

### Adım 1: Pi 2'ye Dosya Yükleme
SSH ile bağlanın:
```bash
ssh pi@192.168.1.50  # Pi'nizin IP'si

# Klasör oluştur
sudo mkdir -p /opt/tesla-iptv
sudo chown -R pi:pi /opt/tesla-iptv

# Dosyaları yükle (bilgisayarınızdan)
exit
```

**Bilgisayarınızdan**:
```bash
scp /Users/ertugbilgin/PROJECTS/iptv/proxy-server.js pi@192.168.1.50:/opt/tesla-iptv/
scp /Users/ertugbilgin/PROJECTS/iptv/index.html pi@192.168.1.50:/opt/tesla-iptv/
```

### Adım 2: Portainer'da Stack Oluşturma
Portainer'da yeni stack oluşturun (Yöntem 1'deki gibi):

```yaml
version: '3.8'

services:
  tesla-iptv:
    image: node:18-alpine
    container_name: tesla-iptv-server
    restart: unless-stopped
    ports:
      - "3000:3000"
    working_dir: /app
    volumes:
      - /opt/tesla-iptv:/app  # Yerel dosyaları mount et
    environment:
      - NODE_ENV=production
      - PORT=3000
    command: node /app/proxy-server.js
    networks:
      - tesla-network

  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: tesla-iptv-tunnel
    restart: unless-stopped
    command: tunnel --url http://tesla-iptv:3000
    depends_on:
      - tesla-iptv
    networks:
      - tesla-network

networks:
  tesla-network:
    driver: bridge
```

---

## 🐳 Yöntem 3: Docker Compose ile (Komut Satırı)

Portainer'a girmeden direkt SSH ile:

```bash
# Pi 2'ye bağlan
ssh pi@192.168.1.50

# Proje klasörü
cd /opt
sudo mkdir -p tesla-iptv
cd tesla-iptv

# Dosyaları buraya atın (SCP ile)
# proxy-server.js ve index.html

# Docker Compose dosyası oluştur
nano docker-compose.yml
```

İçeriği yapıştırın (Yöntem 2'deki gibi), kaydedin.

```bash
# Çalıştır
docker-compose up -d

# Logları gör
docker-compose logs -f
```

Portainer otomatik olarak container'ları gösterecektir.

---

## 🔍 Portainer'dan URL'yi Bulma

### 1. Container Logları
1. Portainer'a girin
2. **Containers** → **tesla-iptv-tunnel** tıklayın
3. **Logs** sekmesi
4. Şuna benzer satırı arayın:
   ```
   INF |  https://xxxxx.trycloudflare.com
   ```

### 2. Terminalden Kontrol
```bash
ssh pi@192.168.1.50
docker logs tesla-iptv-tunnel | grep trycloudflare
```

---

## 🔄 Portainer'dan Yönetim

| İşlem | Portainer'da Nasıl Yapılır |
|-------|---------------------------|
| **Başlat** | Containers → Start |
| **Durdur** | Containers → Stop |
| **Yeniden başlat** | Containers → Restart |
| **Log görüntüle** | Container → Logs sekmesi |
| **Sil** | Containers → Remove |
| **Güncelle** | Stack → Editor → Update |

---

## 🛠️ Sorun Giderme

### Container başlamıyor
Portainer'dan **Logs** sekmesine bakın.

### Port çakışması
Eğer 3000 portu kullanımdaysa:
```yaml
ports:
  - "3001:3000"  # Dışarıdan 3001, içeride 3000
```

### Cloudflared çalışmıyor
```bash
# SSH ile
docker logs tesla-iptv-tunnel

# Manuel test
docker run --rm cloudflare/cloudflared:latest tunnel --url http://192.168.1.50:3000
```

### Dosyalar güncellenecekse
```bash
# Yeni dosyaları yükle
scp yeni-proxy-server.js pi@192.168.1.50:/opt/tesla-iptv/

# Container'ı yeniden başlat (Portainer'dan veya)
docker restart tesla-iptv-server
```

---

## 📊 Portainer İstatistikleri

Portainer'dan görebilirsiniz:
- CPU kullanımı (genelde %1-5)
- RAM kullanımı (~50-100 MB)
- Ağ trafiği
- Container durumu

---

## ⚡ Otomatik Başlatma Ayarları

Docker Compose'ta zaten ayarlı:
```yaml
restart: unless-stopped
```

Bu sayede:
- ✅ Pi yeniden başlayınca otomatik çalışır
- ✅ Container çökerse otomatik yeniden başlar
- ✅ Elle durdurmadığınız sürece çalışmaya devam eder

---

## 🎯 Özet

Portainer + Docker ile:
1. ✅ Web arayüzünden yönetim
2. ✅ Kolay başlatma/durdurma
3. ✅ Logları görüntüleme
4. ✅ Otomatik yeniden başlatma
5. ✅ Home Assistant'a sıfır etki

**Adım adım**:
1. Dosyaları `/opt/tesla-iptv/` yükleyin
2. Portainer'da stack oluşturun
3. Docker Compose yapılandırmasını yapıştırın
4. Deploy edin
5. Loglardan URL'yi bulun
6. Tesla'da açın!

Artık Pi 2'niz hem Home Assistant hem IPTV sunucusu olarak çalışıyor! 🎉
