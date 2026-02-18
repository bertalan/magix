"""Settings per sviluppo in Docker (PostgreSQL + Redis, senza debug_toolbar)."""
from .base import *  # noqa: F401,F403

DEBUG = True
ALLOWED_HOSTS = ["*"]
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-docker-insecure-key")  # noqa: F405

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# CORS per frontend dev (container separato)
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
]
