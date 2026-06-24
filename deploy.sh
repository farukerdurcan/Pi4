#!/bin/bash
# TATKO PI Envanter — deploy scripti
# Kullanım: ./deploy.sh
# Çalıştırma yeri: /opt/tatko-pi4/ (sunucu)

set -e

PI4_DIR="/opt/tatko-pi4"
RZ_NGINX_CONF_DIR="/opt/recruiterszone/nginx/conf.d"

echo "🚀 TATKO PI deploy başlıyor..."

# 1. Shared proxy ağını oluştur (zaten varsa hata vermez)
docker network create pi4-proxy 2>/dev/null || true
echo "✅ pi4-proxy ağı hazır"

# 2. Servisleri build et ve başlat
cd "$PI4_DIR"
docker compose pull --ignore-pull-failures 2>/dev/null || true
docker compose build --no-cache
docker compose up -d
echo "✅ Servisler başlatıldı"

# 3. Nginx config'ini RZ nginx klasörüne kopyala
if [ -d "$RZ_NGINX_CONF_DIR" ]; then
    cp "$PI4_DIR/nginx/pi4.conf" "$RZ_NGINX_CONF_DIR/pi4.conf"
    echo "✅ nginx/pi4.conf kopyalandı → $RZ_NGINX_CONF_DIR"
else
    echo "⚠️  RZ nginx conf.d dizini bulunamadı: $RZ_NGINX_CONF_DIR"
    echo "    pi4.conf'u manuel olarak kopyalayın."
fi

# 4. RZ nginx'in pi4-proxy ağına bağlı olduğunu kontrol et
RZ_NGINX_CONTAINER=$(docker ps --filter "name=nginx" --format "{{.Names}}" | head -1)
if [ -n "$RZ_NGINX_CONTAINER" ]; then
    docker network connect pi4-proxy "$RZ_NGINX_CONTAINER" 2>/dev/null || true
    echo "✅ $RZ_NGINX_CONTAINER → pi4-proxy ağına bağlandı"

    # Nginx'i yeniden yükle (reload, restart değil — aktif bağlantıları kesmez)
    docker exec "$RZ_NGINX_CONTAINER" nginx -t && \
    docker exec "$RZ_NGINX_CONTAINER" nginx -s reload
    echo "✅ nginx yeniden yüklendi"
else
    echo "⚠️  RZ nginx container'ı bulunamadı. Manuel reload gerekebilir."
fi

echo ""
echo "🎉 Deploy tamamlandı!"
echo "   → https://supertakimlar.com/pi4/"
