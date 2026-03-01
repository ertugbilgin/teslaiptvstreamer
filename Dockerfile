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

# Port expose et
EXPOSE 3000

# Sunucuyu başlat
CMD ["node", "proxy-server.js"]
