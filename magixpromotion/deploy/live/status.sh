#!/usr/bin/env bash
# =============================================================================
# MagixPromotion — Verifica stato servizi
# =============================================================================
# Uso: bash status.sh
# =============================================================================
set -uo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

check_service() {
    local svc="$1"
    local label="$2"
    if systemctl is-active --quiet "$svc" 2>/dev/null; then
        echo -e "  ${GREEN}●${NC} ${label}: attivo"
    else
        echo -e "  ${RED}●${NC} ${label}: INATTIVO"
    fi
}

check_port() {
    local port="$1"
    local label="$2"
    if ss -tlnp | grep -q ":${port} "; then
        echo -e "  ${GREEN}●${NC} ${label}: in ascolto su porta ${port}"
    else
        echo -e "  ${RED}●${NC} ${label}: NON in ascolto su porta ${port}"
    fi
}

echo ""
echo -e "${GREEN}━━━ MagixPromotion — Stato servizi ━━━${NC}"
echo ""

echo "Servizi applicazione:"
check_service "gunicorn-magix" "Gunicorn"
check_service "celery-magix"   "Celery Worker+Beat"

echo ""
echo "Infrastruttura (BT Panel):"
# BT Panel usa nginx custom, non il servizio systemd standard
if pgrep -x nginx > /dev/null 2>&1; then
    echo -e "  ${GREEN}●${NC} Nginx: in esecuzione (BT Panel)"
else
    echo -e "  ${RED}●${NC} Nginx: NON in esecuzione"
fi
check_service "postgresql"     "PostgreSQL"
check_service "redis-server"   "Redis"
check_port 80   "HTTP"
check_port 443  "HTTPS"
check_port 5432 "PostgreSQL"
check_port 6379 "Redis"

echo ""
SOCK_PATH="/www/wwwroot/magixpromotion.com/magixpromotion/magix.sock"
echo "Socket Gunicorn:"
if [[ -S "$SOCK_PATH" ]]; then
    echo -e "  ${GREEN}●${NC} ${SOCK_PATH} presente"
else
    echo -e "  ${RED}●${NC} ${SOCK_PATH} NON trovato"
fi

echo ""
echo "Disco:"
df -h /www/wwwroot/magixpromotion.com 2>/dev/null | tail -1 | awk '{printf "  Usato: %s / %s (%s)\n", $3, $2, $5}'

echo ""
echo "Ultimi errori Gunicorn:"
tail -3 /var/log/magix/gunicorn-error.log 2>/dev/null || echo "  (nessun log disponibile)"

echo ""
echo "Ultimi errori Celery:"
tail -3 /var/log/magix/celery-worker.log 2>/dev/null || echo "  (nessun log disponibile)"
echo ""
