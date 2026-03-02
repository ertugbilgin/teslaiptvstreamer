# Raspberry Pi (ARM) uyumlu IPTV Sunucusu
FROM node:18-alpine

# Çalışma dizini
WORKDIR /app

# Paketleri kopyala ve yükle
COPY package*.json ./
RUN npm install --production 2>/dev/null || echo "No package.json, continuing..."

# Uygulama dosyalarını kopyala
COPY proxy-server.js ./
COPY index.html ./

# Railway otomatik PORT atar (3000 veya 8080)
# Uygulama process.env.PORT kullanır

# Sunucuyu başlat
CMD ["node", "proxy-server.js"]
