# 🚀 Canlıya Taşıma Rehberi

## Seçenek 1: Railway (Önerilen - Ücretsiz)

Railway, Node.js sunucularını ücretsiz barındırır ve proxy özelliği çalışır.

### Adımlar:

1. **GitHub repo'su oluşturun**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   gh repo create tesla-iptv --public --source=. --push
   ```

2. **Railway hesabı oluşturun**: https://railway.app

3. **Yeni proje oluşturun**:
   - "Deploy from GitHub repo" seçin
   - Repo'nuzu seçin
   - Otomatik deploy başlayacak

4. **Domain**: Railway otomatik URL verir (örn: `https://tesla-iptv.up.railway.app`)

### Sınırlamalar:
- Ücretsiz tier: 500 saat/ay (yeterli)
- Uyku modu: 15 dk kullanım yoksa uykuya geçer (ilk istekte 5-10 sn gecikme)

---

## Seçenek 2: Render (Ücretsiz)

Render da benzer şekilde çalışır.

### Adımlar:

1. https://render.com adresine gidin

2. "New Web Service" → GitHub repo'nuzu bağlayın

3. Ayarlar:
   - **Name**: tesla-iptv
   - **Environment**: Node
   - **Build Command**: `npm install` (veya boş bırakın)
   - **Start Command**: `node proxy-server.js`

4. "Create Web Service"

### Sınırlamalar:
- Ücretsiz instance 15 dk idle sonra kapanır
- Bant genişliği: 100 GB/ay

---

## Seçenek 3: VPS (DigitalOcean, AWS, vb.)

En güçlü ama ücretli seçenek (~$5/ay).

### Adımlar:

1. Ubuntu sunucu oluşturun

2. Kurulum:
   ```bash
   # Node.js kur
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Projeyi klonla
   git clone <repo-url>
   cd tesla-iptv
   
   # PM2 ile çalıştır
   sudo npm install -g pm2
   pm2 start proxy-server.js --name "iptv"
   pm2 startup
   pm2 save
   ```

3. Nginx reverse proxy (opsiyonel):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## ⚠️ Önemli Uyarılar

### 1. Bant Genişliği Maliyeti
Canlı proxy kullanımında **TÜM video trafiği** sunucunuzdan geçer:
- 1 saat HD stream ≈ 1-2 GB
- 10 kullanıcı × 2 saat/gün ≈ 600 GB/ay

**Railway/Render ücretsiz tier bu trafiği kaldıramayabilir!**

### 2. IP Ban Riski
Bazı IPTV sağlayıcıları:
- Datacenter IP'lerini engeller (Railway/Render IP'leri)
- Çoklu istekleri tespit edip banlar

### 3. Yasal Uyarı
- Sadece yasal IPTV kaynaklarını kullanın
- Proxy kullanımı bazı servislerin ToS'una aykırı olabilir

---

## 🎯 Önerilen Kullanım

### Kişisel Kullanım (Tesla'da)
En iyi yöntem: **Kendi bilgisayarınızda çalıştırın**

1. Bilgisayarınız evde açık kalsın
2. Ngrok veya Cloudflare Tunnel ile dışarıya açın:
   ```bash
   # Ngrok
   ngrok http 3000
   
   # Cloudflare Tunnel (ücretsiz, daha stabil)
   cloudflared tunnel --url http://localhost:3000
   ```

3. Tesla'da ngrok/Cloudflare URL'sini kullanın

Bu şekilde:
- ✅ Bant genişliği sizin internetinizden gider (genelde limitsiz)
- ✅ IP ban riski düşük (ev IP'si)
- ✅ Ücretsiz

---

## 🔧 Environment Variables

`.env` dosyası oluşturabilirsiniz:
```bash
PORT=3000
NODE_ENV=production
```

Railway/Render'da dashboard üzerinden ekleyin.
