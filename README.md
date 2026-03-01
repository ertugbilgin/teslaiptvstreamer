# 🚗 Tesla IPTV Streamer

Tesla arabaların browser'ında çalışacak şekilde optimize edilmiş IPTV streamer uygulaması.

## Özellikler

- ✅ **M3U/M3U8 Link Desteği** - IPTV linklerini doğrudan yükleyin
- ✅ **Dosya Yükleme** - M3U dosyalarını bilgisayardan seçin
- ✅ **HLS.js Entegrasyonu** - HLS stream'leri için optimize edilmiş oynatma
- ✅ **Kanal Arama** - Kanal listesinde arama yapın
- ✅ **Responsive Tasarım** - Tesla'nın dokunmatik ekranına uygun
- ✅ **Büyük Dokunma Hedefleri** - Araç kullanırken kolay seçim
- ✅ **LocalStorage** - Son kullanılan URL'yi hatırlar

## Tesla'da Kullanım

### Yöntem 1: Yerel Dosya (Önerilen)

1. `index.html` dosyasını bilgisayarınıza indirin
2. Bir USB belleğe kopyalayın
3. Tesla'nızın USB portuna takın
4. Tesla browser'ında `file:///mnt/...` adresini açın

### Yöntem 2: GitHub Pages

1. Bu dosyaları GitHub'a yükleyin
2. GitHub Pages'i aktif edin
3. Tesla browser'ında GitHub Pages URL'sini açın

### Yöntem 3: Local Server

```bash
cd iptv
python3 -m http.server 8080
```

Sonra Tesla'da `http://[bilgisayar-ip]:8080` adresini açın.

## IPTV Linkleri Nasıl Bulunur?

⚠️ **Yasal Uyarı**: Sadece yasal ve lisanslı IPTV kaynaklarını kullanın.

IPTV linkleri için genellikle:
- Resmi IPTV sağlayıcılarınızın M3U linkleri
- Kendi oluşturduğunuz playlist'ler
- Açık kaynak/ücretsiz yayın linkleri

## M3U Formatı

Desteklenen format:
```m3u
#EXTM3U
#EXTINF:-1 tvg-name="Kanal 1" tvg-logo="https://logo.png",Kanal 1
https://stream-url.com/playlist.m3u8
#EXTINF:-1 tvg-name="Kanal 2" tvg-logo="https://logo2.png" group-title="Haber",Kanal 2
https://stream-url2.com/stream.m3u8
```

## Tesla Browser Özellikleri

- **Video Kontrolleri**: Dokunmatik ekrandan tam ekran, duraklatma, ses ayarı
- **Kaydırma**: Kanal listesinde dikey kaydırma desteği
- **Otomatik Oynatma**: Kanal seçildiğinde otomatik başlar

## Sık Karşılaşılan Sorunlar

### "Yükleme başarısız" hatası
- IPTV linkinizin çalıştığından emin olun
- Link public erişime açık olmalı
- Bazı linkler CORS kısıtlaması nedeniyle çalışmayabilir, dosya yüklemeyi deneyin

### Video oynamıyor
- Stream formatı HLS (m3u8) veya MP4 olmalı
- HTTPS gerektiren stream'ler çalışmayabilir
- Codec uyumsuzluğu olabilir

## Güvenlik Notları

- Sadece güvendiğiniz IPTV kaynaklarını kullanın
- Açık WiFi ağlarında dikkatli olun
- Kişisel M3U linklerinizi paylaşmayın

## Teknik Detaylar

- **HLS.js**: HLS stream'leri için
- **CORS Proxy**: AllOrigins ve CORSProxy.io
- **Tesla Browser**: WebKit tabanlı, HTML5 destekli

## Lisans

MIT License
