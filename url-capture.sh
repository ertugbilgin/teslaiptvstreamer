#!/bin/bash
# Cloudflared URL'sini yakalayıp dosyaya yazan script

LOG_FILE="/tmp/cloudflared-url.log"
JSON_FILE="/opt/tesla-iptv/public-url.json"

# Log dosyasını izle ve URL'yi yakala
tail -f /var/log/cloudflared-tesla.log 2>/dev/null | while read line; do
    if echo "$line" | grep -q "trycloudflare.com"; then
        URL=$(echo "$line" | grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com')
        if [ ! -z "$URL" ]; then
            echo "$(date '+%Y-%m-%d %H:%M:%S') - $URL" >> "$LOG_FILE"
            echo "{\"url\": \"$URL\", \"updated\": \"$(date -Iseconds)\"}" > "$JSON_FILE"
            echo "Yeni URL yakalandı: $URL"
        fi
    fi
done
