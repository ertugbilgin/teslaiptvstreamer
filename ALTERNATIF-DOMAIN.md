# 🆓 Freenom Alternatifleri (Erişim Yok)

Freenom kapandı/engellendi. İşte alternatifler:

---

## 🥇 Seçenek 1: No-IP (Önerilen - En Kolay)

**Ücretsiz:** `xxx.ddns.net`

### Kurulum:
```bash
# Pi'de No-IP client kur
sudo apt update
sudo apt install noip2

# Konfigürasyon
sudo noip2 -C
# E-posta: sizin@email.com
# Şifre: şifreniz
# Domain: ev-iptv.ddns.net (örnek)

# Başlat
sudo noip2
```

**Avantaj:**
- ✅ Tamamen ücretsiz
- ✅ Kurulumu çok kolay
- ✅ Her 30 günde bir e-posta onayı yeterli

---

## 🥈 Seçenek 2: DuckDNS

**Ücretsiz:** `xxx.duckdns.org`

### Kurulum:
```bash
# DuckDNS token al (https://www.duckdns.org)
# Domain: tesla-tv.duckdns.org

# Pi'de kur
cd ~
mkdir duckdns
cd duckdns

# Script oluştur
cat > duck.sh << 'EOF'
echo url="https://www.duckdns.org/update?domains=DOMAIN&token=TOKEN&ip=" | curl -k -o ~/duckdns/duck.log -K -
EOF

# Cron job ekle
crontab -e
# Şunu ekle:
*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1
```

---

## 🥉 Seçenek 3: Ucuz Domain (1$/Yıl)

**Namecheap** - `.xyz` domain:
- Fiyat: ~$0.99 / yıl (ilk yıl)
- Sonraki yıllar: ~$10

**Porkbun** - `.shop` domain:
- Fiyat: ~$2 / yıl

---

## 🚀 Seçenek 4: Cloudflare Tunnel (Mevcut Devam)

Eğer kalıcı domain alamazsanız, **random URL** yerine **kalıcı isim** oluşturabilirsiniz:

### Cloudflare Tunnel + QR Kod
```bash
# URL'nizi QR koda çevirin
echo "https://xxx.trycloudflare.com" | qrencode -o qr.png
```

Tesla'da QR kodu okutarak hızlı erişim.

---

## 🎯 ÖNERİM

### En Pratik Çözüm: **No-IP**

1. https://www.noip.com adresine gidin
2. Ücretsiz hesap oluşturun
3. Bir domain seçin (örn: `evimiz-iptv.ddns.net`)
4. Pi'ye client kurun
5. Cloudflare Tunnel yerine No-IP adresini kullanın

Veya

### En Kalıcı Çözüm: **Ucuz Domain**

Namecheap'ten `.xyz` domain alın (~$1):
1. https://www.namecheap.com
2. Domain arayın (örn: `teslatv.xyz`)
3. Sepete ekleyin (~$0.99)
4. Cloudflare'e nameserver olarak ekleyin
5. Tunnel oluşturun

---

## ❓ Ne Yapmalı?

| Bütçe | Öneri | Domain |
|-------|-------|--------|
| $0 | No-IP | `xxx.ddns.net` |
| $1 | Namecheap | `xxx.xyz` |
| $10 | Namecheap | `xxx.com` |

Hangi seçeneği tercih edersiniz? 🤔
