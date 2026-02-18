"""Settings di sviluppo locale."""
from .base import *  # noqa: F401,F403

DEBUG = True
ALLOWED_HOSTS = ["*"]
SECRET_KEY = "dev-insecure-key-change-in-prod"

# SQLite per sviluppo rapido
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

INSTALLED_APPS += ["debug_toolbar"]  # type: ignore[name-defined]
MIDDLEWARE.insert(0, "debug_toolbar.middleware.DebugToolbarMiddleware")  # type: ignore[name-defined]
INTERNAL_IPS = ["127.0.0.1"]

# Cache locale in memoria per dev (non serve Redis)
CACHES = {  # type: ignore[name-defined]  # noqa: F811
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "magixpromotion-dev",
    }
}

# Ricerca semplice per dev (SQLite, no config "italian")
WAGTAILSEARCH_BACKENDS = {
    "default": {
        "BACKEND": "wagtail.search.backends.database",
    }
}

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Celery: esecuzione sincrona in dev (senza Redis)
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# CORS per frontend dev
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
]
