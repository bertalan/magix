# TASK 26 — Deploy Config (DEMO Docker + LIVE Bare-Metal + CI/CD)

> **Agente:** DevOps  
> **Fase:** 6 — Testing & Deploy  
> **Dipendenze:** Tutti i task precedenti  
> **Stima:** 55 min  

---

## OBIETTIVO

Creare la configurazione completa di deployment per **due ambienti** (vedi `00-indice-master.md` §Ambienti di Deploy):

### Ambiente DEMO (Docker Compose)
1. Dockerfile multi-stage (Django backend + Vite build frontend)
2. docker-compose.yml (Django, PostgreSQL, Redis — sviluppo locale e CI)
3. Nginx config Docker (serve SPA + proxy API + cache static)

### Ambiente LIVE (server remoto bare-metal)
4. Gunicorn systemd service + socket
5. Nginx vhost bare-metal (reverse proxy → Gunicorn socket)
6. Script deploy via SSH (porta **100**)

### Comune
7. GitHub Actions CI/CD pipeline
8. Environment variables template (.env)

### Domini
| Fase | Dominio | Note |
|------|---------|------|
| LIVE definitivo | `magixpromotion.com` + `www.magixpromotion.com` | Configurazione principale |
| Staging/go-live | `new.magixpromotion.com` | Alias `server_name` sullo stesso vhost |

La configurazione Nginx è unica, con `new.magixpromotion.com` come alias. Quando il sito è definitivamente LIVE, il DNS di `magixpromotion.com` viene puntato al server; `new.` resta come alias e può essere rimosso in seguito.

---

## FILES_IN_SCOPE (da leggere)

- `idea/4-dev-guidelines.md` — Sezione deploy
- `idea/7-note-strategiche-progetto.md` — Note infra

---

## OUTPUT_ATTESO

```
deploy/
├── Dockerfile
├── Dockerfile.frontend
├── docker-compose.yml              # DEMO: sviluppo locale + CI
├── docker-compose.prod.yml         # DEMO: test production-like in Docker
├── nginx/                          # DEMO: config Nginx per Docker
│   ├── nginx.conf
│   └── conf.d/
│       └── magix.conf
├── live/                           # LIVE: config bare-metal
│   ├── gunicorn.service            # systemd unit
│   ├── gunicorn.socket             # systemd socket activation
│   ├── magix-nginx.conf            # Nginx vhost (reverse proxy → socket)
│   └── deploy-live.sh              # Script deploy SSH porta 100
├── scripts/
│   ├── entrypoint.sh               # Django entrypoint (Docker)
│   └── wait-for-it.sh              # Wait for DB/Redis
├── .env.example                    # Sviluppo locale
├── .env.prod.example               # Produzione (Docker o LIVE)
.github/
└── workflows/
    ├── ci.yml                      # Test + Lint su PR
    └── deploy.yml                  # Deploy LIVE su push main
.dockerignore
```

---

## SPECIFICHE

### 1. Dockerfile (Django backend)

```dockerfile
# === Stage 1: Python dependencies ===
FROM python:3.12-slim AS python-deps

WORKDIR /deps
COPY requirements/production.txt ./
RUN pip install --no-cache-dir --prefix=/install -r production.txt

# === Stage 2: Frontend build ===
FROM node:22-alpine AS frontend-build

WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --production=false

COPY frontend/ ./
RUN npm run build

# === Stage 3: Final image ===
FROM python:3.12-slim AS runtime

# Security: non-root user
RUN groupadd -r magix && useradd -r -g magix -d /app magix

# System deps per PostgreSQL + Pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    libjpeg62-turbo \
    libwebp7 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Python packages
COPY --from=python-deps /install /usr/local

# Copy application code
COPY . .

# Copy frontend build
COPY --from=frontend-build /frontend/dist /app/frontend/dist

# Collect static files
RUN DJANGO_SETTINGS_MODULE=config.settings.production \
    SECRET_KEY=build-placeholder \
    DATABASE_URL=sqlite:///tmp/db.sqlite3 \
    python manage.py collectstatic --noinput

# Switch to non-root
USER magix

EXPOSE 8000

ENTRYPOINT ["./deploy/scripts/entrypoint.sh"]
CMD ["gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "3", \
     "--timeout", "120", \
     "--access-logfile", "-"]
```

### 2. docker-compose.yml (Sviluppo locale)

```yaml
version: "3.9"

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: magix
      POSTGRES_USER: magix
      POSTGRES_PASSWORD: magix_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  django:
    build:
      context: .
      dockerfile: deploy/Dockerfile
      target: runtime
    command: >
      python manage.py runserver 0.0.0.0:8000
    environment:
      - DJANGO_SETTINGS_MODULE=config.settings.local
      - DATABASE_URL=postgres://magix:magix_dev@db:5432/magix
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=dev-secret-key-not-for-production
    ports:
      - "8000:8000"
    volumes:
      - .:/app
      - static_files:/app/staticfiles
      - media_files:/app/media
    depends_on:
      - db
      - redis

  celery:
    build:
      context: .
      dockerfile: deploy/Dockerfile
      target: runtime
    command: >
      celery -A config worker -l info -B
    environment:
      - DJANGO_SETTINGS_MODULE=config.settings.local
      - DATABASE_URL=postgres://magix:magix_dev@db:5432/magix
      - REDIS_URL=redis://redis:6379/0
      - CELERY_BROKER_URL=redis://redis:6379/1
      - SECRET_KEY=dev-secret-key-not-for-production
    volumes:
      - .:/app
    depends_on:
      - db
      - redis

  frontend:
    image: node:22-alpine
    working_dir: /app
    command: npm run dev -- --host 0.0.0.0
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
    environment:
      - VITE_API_URL=http://localhost:8000

volumes:
  postgres_data:
  static_files:
  media_files:
```

### 3. docker-compose.prod.yml (DEMO production-like)

> Usato per testare in locale una configurazione simile a produzione con Docker.
> L'ambiente **LIVE reale** usa bare-metal (§12–15).

```yaml
version: "3.9"

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 128mb --maxmemory-policy allkeys-lru
    restart: unless-stopped

  django:
    build:
      context: .
      dockerfile: deploy/Dockerfile
    env_file: .env.prod
    volumes:
      - static_files:/app/staticfiles
      - media_files:/app/media
    depends_on:
      - db
      - redis
    restart: unless-stopped

  celery:
    build:
      context: .
      dockerfile: deploy/Dockerfile
    command: celery -A config worker -l warning -B --scheduler django_celery_beat.schedulers:DatabaseScheduler
    env_file: .env.prod
    depends_on:
      - db
      - redis
    restart: unless-stopped

  nginx:
    image: nginx:1.27-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./deploy/nginx/conf.d:/etc/nginx/conf.d:ro
      - ./deploy/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - static_files:/var/www/static:ro
      - media_files:/var/www/media:ro
      - ./frontend/dist:/var/www/frontend:ro
      - certbot_certs:/etc/letsencrypt:ro
    depends_on:
      - django
    restart: unless-stopped

  certbot:
    image: certbot/certbot
    volumes:
      - certbot_certs:/etc/letsencrypt
      - static_files:/var/www/static
    entrypoint: /bin/sh -c "trap exit TERM; while :; do sleep 12h & wait $!; certbot renew; done"

volumes:
  postgres_data:
  static_files:
  media_files:
  certbot_certs:
```

### 4. nginx/nginx.conf

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent"';
    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript
               text/xml application/xml application/xml+rss text/javascript
               image/svg+xml;
    gzip_min_length 256;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    # Rate limiting — login Wagtail admin (T27 §L735)
    limit_req_zone $binary_remote_addr zone=admin_login:10m rate=5r/m;

    include /etc/nginx/conf.d/*.conf;
}
```

### 5. nginx/conf.d/magix.conf (DEMO Docker)

```nginx
upstream django {
    server django:8000;
}

server {
    listen 80;
    server_name magixpromotion.com www.magixpromotion.com new.magixpromotion.com;

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/static;
    }

    # Redirect to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name magixpromotion.com www.magixpromotion.com new.magixpromotion.com;

    # SSL
    ssl_certificate /etc/letsencrypt/live/magixpromotion.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/magixpromotion.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    client_max_body_size 20M;

    # === Django API ===
    location /api/ {
        proxy_pass http://django;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Cache API responses (stale-while-revalidate)
        proxy_cache_valid 200 5m;
        add_header X-Cache-Status $upstream_cache_status;
    }

    # === Wagtail Admin ===
    # ⚠️ T27 (§L735 Security Checklist): rate limiting sul login admin
    # per proteggere gli account collaboratori esterni.
    location /admin/login/ {
        limit_req zone=admin_login burst=3 nodelay;
        proxy_pass http://django;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin/ {
        proxy_pass http://django;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # === Django static files ===
    location /static/ {
        alias /var/www/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # === Media files ===
    location /media/ {
        alias /var/www/media/;
        expires 30d;
        add_header Cache-Control "public";
        access_log off;
    }

    # === Frontend SPA ===
    location / {
        root /var/www/frontend;
        try_files $uri $uri/ /index.html;

        # Cache assets con hash nel nome
        location ~* \.(js|css|webp|avif|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
        }
    }
}
```

### 6. deploy/scripts/entrypoint.sh

```bash
#!/bin/bash
set -e

echo "⏳ Waiting for database..."
python << END
import sys
import time
import psycopg2
for i in range(30):
    try:
        conn = psycopg2.connect("$DATABASE_URL")
        conn.close()
        print("✅ Database ready!")
        sys.exit(0)
    except Exception:
        time.sleep(1)
print("❌ Database not available")
sys.exit(1)
END

echo "🔄 Running migrations..."
python manage.py migrate --noinput

echo "📦 Collecting static files..."
python manage.py collectstatic --noinput

echo "🚀 Starting application..."
exec "$@"
```

### 7. .env.example (sviluppo)

```bash
# === Django ===
DJANGO_SETTINGS_MODULE=config.settings.local
SECRET_KEY=change-me-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# === Database ===
DATABASE_URL=postgres://magix:magix_dev@localhost:5432/magix

# === Redis ===
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1

# === Wagtail ===
WAGTAILADMIN_BASE_URL=http://localhost:8000

# === Frontend ===
VITE_API_URL=http://localhost:8000

# === Gemini AI ===
GEMINI_API_KEY=your-gemini-api-key

# === Geocoding (OSM Nominatim) ===
NOMINATIM_USER_AGENT=magix-promotion-dev

# === Email (dev: console) ===
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

### 8. .env.prod.example (produzione — Docker o LIVE)

```bash
# === Django ===
DJANGO_SETTINGS_MODULE=config.settings.production
SECRET_KEY=generate-a-strong-secret-key-here
DEBUG=False
ALLOWED_HOSTS=magixpromotion.com,www.magixpromotion.com,new.magixpromotion.com

# === Database ===
POSTGRES_DB=magix_prod
POSTGRES_USER=magix
POSTGRES_PASSWORD=strong-password-here
# DEMO Docker: host=db | LIVE bare-metal: host=localhost
DATABASE_URL=postgres://magix:strong-password-here@localhost:5432/magix_prod

# === Redis ===
# DEMO Docker: host=redis | LIVE bare-metal: host=localhost
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1

# === Wagtail ===
WAGTAILADMIN_BASE_URL=https://magixpromotion.com

# === Gemini AI ===
GEMINI_API_KEY=your-production-gemini-key

# === Geocoding (OSM Nominatim) ===
NOMINATIM_USER_AGENT=magix-promotion-prod

# === Email (SMTP) ===
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=info@magixpromotion.com
EMAIL_HOST_PASSWORD=app-password-here
DEFAULT_FROM_EMAIL=Magix Promotion <info@magixpromotion.com>

# === Sentry (opzionale) ===
SENTRY_DSN=

# === LIVE bare-metal (non usati in Docker) ===
# SERVER_HOST=xxx.xxx.xxx.xxx
# SERVER_SSH_PORT=100
# APP_DIR=/opt/magix-promotion
```

### 9. .dockerignore

```
# Python
__pycache__
*.pyc
*.pyo
.pytest_cache
.mypy_cache
.venv
venv

# Node
frontend/node_modules
frontend/.vite

# IDE
.vscode
.idea
*.swp

# Git
.git
.gitignore

# Docker
deploy/
docker-compose*.yml
Dockerfile*

# Docs
*.md
docs/
idea/
tasks/
materiale/

# Media (in produzione monta un volume)
media/

# Tests
tests/
frontend/src/test/

# Env
.env*
!.env.example
```

### 10. .github/workflows/ci.yml

```yaml
name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [develop]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: test_magix
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: pip

      - name: Install dependencies
        run: |
          pip install -r requirements/production.txt
          pip install -r requirements/test.txt

      - name: Run tests
        env:
          DJANGO_SETTINGS_MODULE: config.settings.test
          DATABASE_URL: postgres://test:test@localhost:5432/test_magix
          REDIS_URL: redis://localhost:6379/0
          SECRET_KEY: ci-secret-key
        run: |
          pytest --cov --cov-report=xml -q

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          file: coverage.xml
          fail_ci_if_error: false

  backend-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install ruff
      - run: ruff check .
      - run: ruff format --check .

  frontend-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: frontend/package-lock.json

      - run: npm ci
      - run: npm run test -- --coverage
      - run: npm run build

  frontend-lint:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
      - run: npx eslint src/ --max-warnings 0
      - run: npx tsc --noEmit
```

### 11. .github/workflows/deploy.yml (LIVE bare-metal)

```yaml
name: Deploy Production (LIVE)

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    needs: []  # Aggiungere CI job ref se richiesto
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to LIVE server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          port: 100
          script: |
            cd /opt/magix-promotion
            git pull origin main

            # Backend
            source venv/bin/activate
            pip install -r requirements/production.txt
            python manage.py migrate --noinput
            python manage.py collectstatic --noinput

            # Frontend
            cd frontend && npm ci && npm run build && cd ..

            # Restart services
            sudo systemctl restart gunicorn.socket
            sudo systemctl reload nginx
            echo "✅ Deploy LIVE completato: ${{ github.sha }}"
```

---

### 12. deploy/live/gunicorn.socket (LIVE bare-metal)

```ini
# /etc/systemd/system/gunicorn.socket
[Unit]
Description=Gunicorn socket for Magix Promotion

[Socket]
ListenStream=/run/gunicorn/magix.sock
SocketUser=www-data

[Install]
WantedBy=sockets.target
```

### 13. deploy/live/gunicorn.service (LIVE bare-metal)

```ini
# /etc/systemd/system/gunicorn.service
[Unit]
Description=Gunicorn daemon for Magix Promotion
Requires=gunicorn.socket
After=network.target postgresql.service redis.service

[Service]
User=magix
Group=www-data
WorkingDirectory=/opt/magix-promotion
EnvironmentFile=/opt/magix-promotion/.env.prod
ExecStart=/opt/magix-promotion/venv/bin/gunicorn config.wsgi:application \
    --bind unix:/run/gunicorn/magix.sock \
    --workers 3 \
    --timeout 120 \
    --access-logfile /var/log/gunicorn/access.log \
    --error-logfile /var/log/gunicorn/error.log
ExecReload=/bin/kill -s HUP $MAINPID
Restart=on-failure
RestartSec=5

# Hardening
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/opt/magix-promotion/media /opt/magix-promotion/staticfiles /var/log/gunicorn

[Install]
WantedBy=multi-user.target
```

**Setup iniziale sul server:**
```bash
# Creare utente, directory, virtualenv
sudo useradd -r -s /bin/false -d /opt/magix-promotion magix
sudo mkdir -p /opt/magix-promotion /run/gunicorn /var/log/gunicorn
sudo chown magix:www-data /opt/magix-promotion /var/log/gunicorn

cd /opt/magix-promotion
sudo -u magix git clone <repo> .
sudo -u magix python3.12 -m venv venv
sudo -u magix venv/bin/pip install -r requirements/production.txt

# Installare e attivare servizi
sudo cp deploy/live/gunicorn.socket /etc/systemd/system/
sudo cp deploy/live/gunicorn.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now gunicorn.socket
```

### 14. deploy/live/magix-nginx.conf (LIVE bare-metal)

```nginx
# /etc/nginx/sites-available/magix-promotion
# Reverse proxy verso Gunicorn socket (NO Docker upstream)

upstream gunicorn {
    server unix:/run/gunicorn/magix.sock fail_timeout=0;
}

# === HTTP → HTTPS redirect ===
server {
    listen 80;
    server_name magixpromotion.com www.magixpromotion.com new.magixpromotion.com;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# === HTTPS ===
server {
    listen 443 ssl http2;
    server_name magixpromotion.com www.magixpromotion.com new.magixpromotion.com;

    # SSL (Certbot / Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/magixpromotion.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/magixpromotion.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    client_max_body_size 20M;

    # Rate limiting — login Wagtail admin (T27 §L735)
    limit_req_zone $binary_remote_addr zone=admin_login:10m rate=5r/m;

    # === Django API ===
    location /api/ {
        proxy_pass http://gunicorn;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache_valid 200 5m;
        add_header X-Cache-Status $upstream_cache_status;
    }

    # === Wagtail Admin ===
    location /admin/login/ {
        limit_req zone=admin_login burst=3 nodelay;
        proxy_pass http://gunicorn;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin/ {
        proxy_pass http://gunicorn;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # === Django static files ===
    location /static/ {
        alias /opt/magix-promotion/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # === Media files ===
    location /media/ {
        alias /opt/magix-promotion/media/;
        expires 30d;
        add_header Cache-Control "public";
        access_log off;
    }

    # === Frontend SPA ===
    location / {
        root /opt/magix-promotion/frontend/dist;
        try_files $uri $uri/ /index.html;

        location ~* \.(js|css|webp|avif|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
        }
    }
}
```

**Attivazione:**
```bash
sudo ln -s /etc/nginx/sites-available/magix-promotion /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# SSL con Certbot (primo setup)
sudo certbot --nginx -d magixpromotion.com -d www.magixpromotion.com -d new.magixpromotion.com
```

### 15. deploy/live/deploy-live.sh (script deploy manuale)

```bash
#!/bin/bash
# Script per deploy manuale via SSH (porta 100)
# Uso: ./deploy/live/deploy-live.sh [user@host]
set -e

SERVER=${1:-"magix@magixpromotion.com"}
SSH_PORT=100
APP_DIR="/opt/magix-promotion"

echo "🚀 Deploy LIVE su $SERVER (porta $SSH_PORT)..."

# 1. Sync codice
ssh -p $SSH_PORT $SERVER "cd $APP_DIR && git pull origin main"

# 2. Backend: deps + migrate + static
ssh -p $SSH_PORT $SERVER "cd $APP_DIR && \
    source venv/bin/activate && \
    pip install -q -r requirements/production.txt && \
    python manage.py migrate --noinput && \
    python manage.py collectstatic --noinput"

# 3. Frontend: build
ssh -p $SSH_PORT $SERVER "cd $APP_DIR/frontend && npm ci && npm run build"

# 4. Restart servizi
ssh -p $SSH_PORT $SERVER "sudo systemctl restart gunicorn.socket && sudo systemctl reload nginx"

# 5. Verifica
ssh -p $SSH_PORT $SERVER "curl -sf https://magixpromotion.com/api/v2/pages/ > /dev/null && echo '✅ API OK' || echo '❌ API KO'"

echo "✅ Deploy completato."
```

---

## NOTE IMPLEMENTATIVE

### DEMO (Docker)
- **Multi-stage build:** Riduce l'immagine finale (~200MB vs ~800MB). Stage `python-deps` cached efficacemente
- **Non-root user:** Il container Django gira come `magix` user per sicurezza
- **Redis maxmemory:** 128MB con policy LRU per evitare OOM
- **Uso:** Test locale production-like con `docker compose -f docker-compose.prod.yml up`

### LIVE (Bare-metal)
- **Gunicorn socket activation:** systemd `.socket` + `.service` attivano Gunicorn solo a richiesta, riducono il footprint RAM a idle
- **Nginx reverse proxy al socket:** `proxy_pass http://unix:/run/gunicorn/magix.sock` — nessun container intermediario
- **Deploy via SSH porta 100:** sia CI/CD (GitHub Actions) sia script manuale `deploy-live.sh`
- **Utente `magix`:** Gunicorn gira come utente dedicato, non root. `sudoers` limitato a `systemctl restart gunicorn.socket`, `systemctl reload nginx`
- **`STATIC_ROOT`:** `/opt/magix-promotion/staticfiles/` — serviti da Nginx senza passare da Django
- **`MEDIA_ROOT`:** `/opt/magix-promotion/media/` — upload utenti, Nginx serve direttamente
- **`new.magixpromotion.com`:** alias transitorio; stesso vhost Nginx, rimovibile post go-live

### Comune
- **Nginx SPA fallback:** `try_files $uri $uri/ /index.html` serve la SPA per tutte le route non-API
- **Let's Encrypt:** Certbot per rinnovo automatico certificati SSL
- **HSTS:** Header strict transport security con max-age 1 anno
- **Secrets GitHub:** `SERVER_HOST`, `SERVER_USER`, `SERVER_SSH_KEY`, `SSH_PORT=100` da configurare in repository settings
- **Rate limiting admin login (T27 §L735):** `limit_req_zone` in `nginx.conf` + `limit_req` su `location /admin/login/` protegge gli account dei collaboratori esterni da brute-force. 5 req/min con burst=3.

---

## CRITERI DI ACCETTAZIONE

### DEMO (Docker)
- [ ] `docker compose up` avvia tutti i servizi senza errori
- [ ] Django raggiungibile su `localhost:8000`
- [ ] Frontend raggiungibile su `localhost:3000` (dev) o `localhost:80` (prod Docker)
- [ ] API proxy funzionante: `localhost/api/v2/pages/` risponde
- [ ] Entrypoint attende database prima di avviare Django
- [ ] `.dockerignore` esclude file non necessari (docs, tests, media)

### LIVE (Bare-metal)
- [ ] Deploy via SSH porta 22 completa senza errori (CI o `deploy-live.sh`)
- [ ] `gunicorn.socket` attivo: `systemctl is-active gunicorn.socket` → active
- [ ] Gunicorn risponde: `curl --unix-socket /run/gunicorn/magix.sock http://localhost/` → 200
- [ ] `https://magixpromotion.com` raggiungibile con certificato valido
- [ ] `https://new.magixpromotion.com` raggiungibile (alias durante staging)
- [ ] `https://www.magixpromotion.com` redirige/serve correttamente
- [ ] Nginx serve static files da `/opt/magix-promotion/staticfiles/`
- [ ] Nginx serve media files da `/opt/magix-promotion/media/`
- [ ] Frontend SPA servita da `/opt/magix-promotion/frontend/dist/`

### Comune
- [ ] Static files serviti da Nginx con cache 1y
- [ ] Media files serviti da Nginx con cache 30d
- [ ] SPA fallback: qualsiasi route non-API serve `index.html`
- [ ] Gzip attivo per JS/CSS/JSON/SVG
- [ ] Security headers presenti (X-Frame-Options, HSTS, etc.)
- [ ] CI pipeline: test backend + lint backend + test frontend + lint frontend
- [ ] `.env.example` documenta tutte le variabili necessarie
- [ ] `NOMINATIM_USER_AGENT` presente in tutti i file .env
- [ ] `GEMINI_API_KEY` presente in tutti i file .env

---

## SEZIONE TDD

### Test DEMO (locale Docker)
```bash
#!/bin/bash
# Script di verifica deploy DEMO (eseguire con container attivi)
set -e
echo "✔ Checking env vars..."
[[ -n "$SECRET_KEY" ]] || { echo "❌ SECRET_KEY mancante"; exit 1; }
[[ -n "$DATABASE_URL" ]] || { echo "❌ DATABASE_URL mancante"; exit 1; }
[[ -n "$GEMINI_API_KEY" ]] || { echo "❌ GEMINI_API_KEY mancante"; exit 1; }
[[ -n "$NOMINATIM_USER_AGENT" ]] || { echo "❌ NOMINATIM_USER_AGENT mancante"; exit 1; }
echo "✔ All env vars present."

echo "✔ Checking API health..."
curl -sf http://localhost:8000/api/v2/pages/ > /dev/null || { echo "❌ API non raggiungibile"; exit 1; }
echo "✔ API OK."

echo "✔ Checking SiteSettings API..."
curl -sf http://localhost:8000/api/v2/site-settings/ > /dev/null || { echo "❌ SiteSettings API non raggiungibile"; exit 1; }
echo "✔ SiteSettings OK."
```

### Test LIVE (bare-metal remoto)
```bash
#!/bin/bash
# Script di verifica deploy LIVE (eseguire dopo deploy su server)
set -e
SSH_PORT=100
SERVER=${1:-"magix@magixpromotion.com"}

echo "✔ Checking SSH connectivity (port $SSH_PORT)..."
ssh -p $SSH_PORT -o ConnectTimeout=5 $SERVER "echo OK" || { echo "❌ SSH non raggiungibile"; exit 1; }

echo "✔ Checking Gunicorn socket..."
ssh -p $SSH_PORT $SERVER "systemctl is-active gunicorn.socket" || { echo "❌ gunicorn.socket non attivo"; exit 1; }

echo "✔ Checking Nginx..."
ssh -p $SSH_PORT $SERVER "systemctl is-active nginx" || { echo "❌ nginx non attivo"; exit 1; }

echo "✔ Checking HTTPS magixpromotion.com..."
curl -sf --max-time 10 https://magixpromotion.com/api/v2/pages/ > /dev/null || { echo "❌ API non raggiungibile via HTTPS"; exit 1; }
echo "✔ API HTTPS OK."

echo "✔ Checking alias new.magixpromotion.com..."
curl -sf --max-time 10 https://new.magixpromotion.com/api/v2/pages/ > /dev/null || { echo "❌ Alias new. non raggiungibile"; exit 1; }
echo "✔ Alias new. OK."

echo "✔ Checking SSL certificate validity..."
echo | openssl s_client -connect magixpromotion.com:443 -servername magixpromotion.com 2>/dev/null | openssl x509 -noout -dates || { echo "❌ Certificato SSL non valido"; exit 1; }
echo "✔ SSL OK."

echo "✅ Tutti i test LIVE superati."
```

---

## SECURITY CHECKLIST

### Applicazione
- [ ] `SECRET_KEY` univoco in produzione (non il default)
- [ ] `DEBUG=False` in produzione
- [ ] `ALLOWED_HOSTS` restrittivo: `magixpromotion.com,www.magixpromotion.com,new.magixpromotion.com`
- [ ] Password PostgreSQL forte (non default)
- [ ] HTTPS obbligatorio con HSTS
- [ ] `GEMINI_API_KEY` non esposto lato client backend (solo VITE_GEMINI_API_KEY nel frontend)
- [ ] `.env.prod` mai committato in git

### DEMO (Docker)
- [ ] Container Django gira come utente non-root (`magix`)

### LIVE (Server bare-metal)
- [ ] SSH porta 100 — autenticazione solo con chiave pubblica (no password)
- [ ] `PermitRootLogin no` in `sshd_config`
- [ ] Firewall (ufw/iptables): solo porte 100 (SSH), 80, 443 aperte
- [ ] Gunicorn gira come utente dedicato `magix` (non root)
- [ ] `sudoers` limitato: `magix ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart gunicorn.socket, /usr/bin/systemctl reload nginx`
- [ ] `/opt/magix-promotion/.env.prod` permessi `600`, owner `magix`
- [ ] Log rotation configurata per Gunicorn e Nginx
- [ ] fail2ban attivo su SSHD (porta 100)

### Comune
- [ ] Security headers Nginx: X-Frame-Options, CSP, nosniff
- [ ] Rate limiting su `/admin/login/` (5 req/min + burst 3) — T27
