# =============================================================================
# Gunicorn — Configurazione produzione MagixPromotion
# =============================================================================
# Usato da: systemd magix-gunicorn.service
# Alternativa: gunicorn -c deploy/live/gunicorn.conf.py config.wsgi:application
# =============================================================================

import multiprocessing
import os

# ─── Server socket ───────────────────────────────────────────────────────────
bind = "unix:/run/magix-gunicorn.sock"

# ─── Workers ─────────────────────────────────────────────────────────────────
# Formula: 2 * CPU + 1 (per CPU-bound). Per I/O-bound Django, 3 è un buon default.
workers = int(os.environ.get("GUNICORN_WORKERS", min(2 * multiprocessing.cpu_count() + 1, 5)))
worker_class = "gthread"        # Thread-based per compatibilità Django ORM
threads = 2                     # Thread per worker
worker_tmp_dir = "/dev/shm"     # tmpfs per heartbeat (evita I/O disco)

# ─── Timeout ─────────────────────────────────────────────────────────────────
timeout = 120                   # Secondi prima di kill worker
graceful_timeout = 30           # Secondi per chiusura graceful
keepalive = 5                   # Keep-alive per connessioni dal reverse proxy

# ─── Restart preventivo (memory leak prevention) ─────────────────────────────
max_requests = 1000             # Restart worker dopo N request
max_requests_jitter = 50        # Jitter per evitare restart simultanei

# ─── Logging ─────────────────────────────────────────────────────────────────
accesslog = "/var/log/magix/gunicorn-access.log"
errorlog = "/var/log/magix/gunicorn-error.log"
loglevel = "warning"
capture_output = True           # Cattura stdout/stderr Django
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# ─── Security ────────────────────────────────────────────────────────────────
limit_request_line = 8190       # Max URL length
limit_request_fields = 100      # Max header fields
limit_request_field_size = 8190 # Max header field size

# ─── Process naming ─────────────────────────────────────────────────────────
proc_name = "magixpromotion"

# ─── Server hooks ────────────────────────────────────────────────────────────
def on_starting(server):
    """Chiamato all'avvio del master process."""
    pass

def post_fork(server, worker):
    """Chiamato dopo il fork di ogni worker."""
    server.log.info("Worker spawned (pid: %s)", worker.pid)

def pre_exec(server):
    """Chiamato prima di exec() del nuovo master."""
    server.log.info("Forked child, re-executing.")

def when_ready(server):
    """Chiamato quando il server è pronto."""
    server.log.info("Server is ready. Spawning workers")
