#!/bin/bash
# TATKO PI Envanter — uzak sunucuya deploy
# Kullanım: ./remote-deploy.sh
# Çalıştırma yeri: bu proje klasörü (yerel makine)

set -e

# ── Yapılandırma ────────────────────────────────────────────
SSH_USER="root"
SSH_HOST="supertakimlar.com"
SSH_PORT="22"
REMOTE_DIR="/opt/tatko-pi4"
# SSH key kullanıyorsanız: SSH_KEY="$HOME/.ssh/id_rsa"
# Kullanmıyorsanız boş bırakın (şifre sorulur)
SSH_KEY=""
# ────────────────────────────────────────────────────────────

SSH_OPTS="-p $SSH_PORT -o StrictHostKeyChecking=no"
[ -n "$SSH_KEY" ] && SSH_OPTS="$SSH_OPTS -i $SSH_KEY"

echo "🚀 TATKO PI uzak deploy başlıyor..."
echo "   Hedef: $SSH_USER@$SSH_HOST:$REMOTE_DIR"
echo ""

# 1. Uzak dizini oluştur (yoksa)
ssh $SSH_OPTS "$SSH_USER@$SSH_HOST" "mkdir -p $REMOTE_DIR"

# 2. Dosyaları tar + ssh ile aktar
# .env dahil edilmiyor — sunucuda ayrı oluşturulur
echo "📦 Dosyalar aktarılıyor..."
tar czf - \
  --exclude='./.env' \
  --exclude='./__pycache__' \
  --exclude='./*.pyc' \
  --exclude='./node_modules' \
  --exclude='./frontend/dist' \
  --exclude='./backend/*.db' \
  --exclude='./backend/emails' \
  --exclude='./.git' \
  . | ssh $SSH_OPTS "$SSH_USER@$SSH_HOST" "tar xzf - -C $REMOTE_DIR"

echo "✅ Dosyalar aktarıldı"

# 3. Sunucuda .env var mı kontrol et
ENV_MEVCUT=$(ssh $SSH_OPTS "$SSH_USER@$SSH_HOST" \
  "[ -f $REMOTE_DIR/.env ] && echo 'VAR' || echo 'YOK'")

if [ "$ENV_MEVCUT" = "YOK" ]; then
  echo ""
  echo "⚠️  Sunucuda .env dosyası bulunamadı."
  echo "   Şimdi oluşturmak ister misiniz? [e/h]"
  read -r CEVAP
  if [ "$CEVAP" = "e" ]; then
    echo "   .env.example sunucuya kopyalanıyor (değerleri doldurun)..."
    ssh $SSH_OPTS "$SSH_USER@$SSH_HOST" "cat > $REMOTE_DIR/.env" < .env.example
    echo "   Lütfen sunucuda .env'i düzenleyin:"
    echo "   ssh $SSH_USER@$SSH_HOST \"nano $REMOTE_DIR/.env\""
    echo ""
    echo "   Düzenledikten sonra tekrar çalıştırın: ./remote-deploy.sh"
    exit 0
  else
    echo "   Deploy iptal edildi. .env'i oluşturup tekrar deneyin."
    exit 1
  fi
fi

# 4. deploy.sh'ı çalıştırılabilir yap ve çalıştır
echo ""
echo "🔧 Sunucuda deploy başlatılıyor..."
ssh $SSH_OPTS "$SSH_USER@$SSH_HOST" \
  "chmod +x $REMOTE_DIR/deploy.sh && $REMOTE_DIR/deploy.sh"

echo ""
echo "🎉 Remote deploy tamamlandı!"
echo "   → https://supertakimlar.com/pi4/"
