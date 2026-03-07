#!/bin/bash
# Script per deploy manuale via SSH (porta 100)
# Uso: ./deploy/live/deploy-live.sh [user@host]
set -e

SERVER=${1:-"root@guzzi-days.net"}
SSH_PORT=100
SITE_DIR="/www/wwwroot/magixpromotion.com"
APP_DIR="${SITE_DIR}/magixpromotion"
VENV_DIR="${SITE_DIR}/venv"

echo "Deploy LIVE su $SERVER (porta $SSH_PORT)..."

# 1. Sync codice
echo "[1/5] Pulling latest code..."
ssh -p $SSH_PORT $SERVER "cd ${SITE_DIR} && git pull origin main"

# 2. Backend: deps + migrate + static
echo "[2/5] Installing Python dependencies and running migrations..."
ssh -p $SSH_PORT $SERVER "source ${VENV_DIR}/bin/activate && \
    pip install -q -r ${APP_DIR}/requirements/production.txt && \
    cd ${APP_DIR} && \
    DJANGO_SETTINGS_MODULE=config.settings.production \
    python manage.py migrate --noinput && \
    python manage.py collectstatic --noinput 2>/dev/null"

# 3. Frontend: build
echo "[3/5] Building frontend..."
ssh -p $SSH_PORT $SERVER "cd ${APP_DIR}/frontend && npm ci --production=false --silent && npm run build"

# 4. Nginx config
echo "[4/6] Updating Nginx config..."
ssh -p $SSH_PORT $SERVER "cp ${APP_DIR}/deploy/live/magixpromotion.com.conf /www/server/panel/vhost/nginx/magixpromotion.com.conf && /www/server/nginx/sbin/nginx -t"

# 5. Restart servizi
echo "[5/6] Restarting services..."
ssh -p $SSH_PORT $SERVER "systemctl restart gunicorn-magix celery-magix && /www/server/nginx/sbin/nginx -s reload"

# 6. Verifica
echo "[6/6] Verifying deployment..."
sleep 2
ssh -p $SSH_PORT $SERVER "curl -sf https://new.magixpromotion.com/api/v2/pages/ > /dev/null && echo 'API OK' || echo 'API FAILED'"

echo "Deploy completato."
