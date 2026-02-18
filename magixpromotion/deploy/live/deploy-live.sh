#!/bin/bash
# Script per deploy manuale via SSH (porta 100)
# Uso: ./deploy/live/deploy-live.sh [user@host]
set -e

SERVER=${1:-"magix@magixpromotion.com"}
SSH_PORT=100
APP_DIR="/opt/magix-promotion"

echo "Deploy LIVE su $SERVER (porta $SSH_PORT)..."

# 1. Sync codice
echo "[1/5] Pulling latest code..."
ssh -p $SSH_PORT $SERVER "cd $APP_DIR && git pull origin main"

# 2. Backend: deps + migrate + static
echo "[2/5] Installing Python dependencies and running migrations..."
ssh -p $SSH_PORT $SERVER "cd $APP_DIR && \
    source venv/bin/activate && \
    pip install -q -r requirements/production.txt && \
    python manage.py migrate --noinput && \
    python manage.py collectstatic --noinput"

# 3. Frontend: build
echo "[3/5] Building frontend..."
ssh -p $SSH_PORT $SERVER "cd $APP_DIR/frontend && npm ci && npm run build"

# 4. Restart servizi
echo "[4/5] Restarting services..."
ssh -p $SSH_PORT $SERVER "sudo systemctl restart gunicorn.socket && sudo systemctl reload nginx"

# 5. Verifica
echo "[5/5] Verifying deployment..."
ssh -p $SSH_PORT $SERVER "curl -sf https://magixpromotion.com/api/v2/pages/ > /dev/null && echo 'API OK' || echo 'API FAILED'"

echo "Deploy completato."
