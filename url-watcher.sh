#!/bin/bash
# Bu script host üzerinde (Pi'de) çalışacak
# Cloudflared URL'sini yakalayıp dosyaya yazacak

OUTPUT_FILE="/opt/tesla-iptv/public-url.txt"
LOG_FILE="/var/log/cloudflared-tesla.log"

# Log dosyası yoksa oluştur
touch "$OUTPUT_FILE"
chmod 644 "$OUTPUT_FILE"

# Journalctl'i izle ve URL'yi yakala
sudo journalctl -u cloudflared-tesla -f --since "now" | while read line; do
    if echo "$line" | grep -q "trycloudflare.com"; then
        URL=$(echo "$line" | grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' | head -1)
        if [ ! -z "$URL" ]; then
            echo "$URL" > "$OUTPUT_FILE"
            echo "$(date): $URL" >> "$LOG_FILE"
            echo "[$(date)] Yeni URL: $URL"
        fi
    fi
done
