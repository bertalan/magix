#!/usr/bin/env bash
# =============================================================================
# MagixPromotion — Quick Update (pull + rebuild + restart)
# =============================================================================
# Uso: bash update.sh
# Per prima installazione completa: bash deploy.sh
# =============================================================================
set -euo pipefail

SITE_DIR="/www/wwwroot/magixpromotion.com"
APP_DIR="${SITE_DIR}/magixpromotion"
VENV_DIR="${SITE_DIR}/venv"
FRONTEND_DIR="${APP_DIR}/frontend"
BRANCH="main"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[✓]${NC} $*"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*"; }
err()   { echo -e "${RED}[✗]${NC} $*" >&2; }

if [[ $EUID -ne 0 ]]; then
    err "Questo script deve essere eseguito come root."
    exit 1
fi

echo -e "${GREEN}━━━ MagixPromotion — Aggiornamento rapido ━━━${NC}"

# 1. Git pull
cd "${SITE_DIR}"
info "Pull ultime modifiche da origin/${BRANCH}…"
git fetch origin "${BRANCH}"
CHANGES=$(git diff --stat "HEAD" "origin/${BRANCH}" 2>/dev/null || echo "")

if [[ -z "${CHANGES}" ]]; then
    warn "Nessuna modifica trovata su origin/${BRANCH}. Procedo comunque con rebuild."
fi

git reset --hard "origin/${BRANCH}"

# 2. Python deps (solo se requirements sono cambiati)
source "${VENV_DIR}/bin/activate"
if git diff HEAD~1 --name-only | grep -q "requirements/"; then
    info "Requirements modificati — aggiorno dipendenze…"
    pip install -r "${APP_DIR}/requirements/production.txt" -q
else
    info "Requirements invariati — skip installazione pip"
fi

# 3. Django migrate + collectstatic
cd "${APP_DIR}"
export DJANGO_SETTINGS_MODULE=config.settings.production

info "Migrazioni database…"
"${VENV_DIR}/bin/python" manage.py migrate --noinput

info "Collect static files…"
"${VENV_DIR}/bin/python" manage.py collectstatic --noinput 2>/dev/null

# 4. Frontend rebuild (solo se frontend è cambiato)
if git diff HEAD~1 --name-only | grep -q "frontend/"; then
    info "Frontend modificato — rebuild…"
    cd "${FRONTEND_DIR}"
    npm ci --production=false --silent 2>/dev/null || npm install --silent
    npm run build
else
    info "Frontend invariato — skip build"
fi

# 5. Restart servizi
info "Riavvio servizi…"
systemctl restart magix-gunicorn
systemctl restart magix-celery

# 6. Verifica
sleep 2
for svc in magix-gunicorn magix-celery; do
    if systemctl is-active --quiet "${svc}"; then
        info "${svc} — attivo ✓"
    else
        err "${svc} — NON attivo! Controlla: journalctl -u ${svc} -n 30"
    fi
done

echo ""
info "Aggiornamento completato! $(date '+%Y-%m-%d %H:%M:%S')"
