# === Stage 1: Python dependencies ===
FROM python:3.12-slim AS python-deps

WORKDIR /deps
COPY requirements/production.txt requirements/base.txt ./
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

# System deps for PostgreSQL + Pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    libjpeg62-turbo \
    libwebp7 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Python packages
COPY --from=python-deps /install /usr/local

# Copy application code
COPY . .

# Copy frontend build
COPY --from=frontend-build /frontend/dist /app/frontend/dist

# Make entrypoint executable
RUN chmod +x /app/deploy/scripts/entrypoint.sh

# Collect static files
RUN DJANGO_SETTINGS_MODULE=config.settings.production \
    DJANGO_SECRET_KEY=build-placeholder \
    DATABASE_URL=sqlite:///tmp/db.sqlite3 \
    python manage.py collectstatic --noinput 2>/dev/null || true

# Create media directory
RUN mkdir -p /app/media /app/staticfiles && \
    chown -R magix:magix /app/media /app/staticfiles

# Switch to non-root
USER magix

EXPOSE 8000

ENTRYPOINT ["./deploy/scripts/entrypoint.sh"]
CMD ["gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "3", \
     "--timeout", "120", \
     "--access-logfile", "-"]
