"""
Settings base per MagixPromotion.
Segue le best practice Wagtail 7.x (LTS).
"""
import os
from pathlib import Path
from dotenv import read_dotenv

# Carica variabili dal file .env se presente
_env_file = Path(__file__).resolve().parent.parent.parent / ".env"
if _env_file.exists():
    read_dotenv(str(_env_file))

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "")
DEBUG = False
ALLOWED_HOSTS: list[str] = []

INSTALLED_APPS = [
    # Wagtail
    "wagtail.contrib.forms",
    "wagtail.contrib.redirects",
    "wagtail.contrib.settings",
    "wagtail.contrib.sitemaps",
    "wagtail.embeds",
    "wagtail.sites",
    "wagtail.users",
    "wagtail.snippets",
    "wagtail.documents",
    "wagtail.images",
    "wagtail.search",
    "wagtail.admin",
    "wagtail",
    # Wagtail Localize
    "wagtail_localize",
    "wagtail_localize.locales",
    # Third-party
    "django_countries",
    "modelcluster",
    "taggit",
    # Django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Progetto
    "core",
    "artists",
    "events",
    "booking",
    "navigation",
]

MIDDLEWARE = [
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "wagtail.contrib.redirects.middleware.RedirectMiddleware",
    "core.middleware.APICacheMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("DB_NAME", "magixpromotion"),
        "USER": os.environ.get("DB_USER", "postgres"),
        "PASSWORD": os.environ.get("DB_PASSWORD", ""),
        "HOST": os.environ.get("DB_HOST", "localhost"),
        "PORT": os.environ.get("DB_PORT", "5432"),
    }
}

# Internazionalizzazione
LANGUAGE_CODE = "it"
WAGTAIL_I18N_ENABLED = True
WAGTAIL_CONTENT_LANGUAGES = LANGUAGES = [
    ("it", "Italiano"),
    ("en", "English"),
]
TIME_ZONE = "Europe/Rome"
USE_I18N = True
USE_TZ = True

# Percorsi file di traduzione gettext
LOCALE_PATHS = [BASE_DIR / "locale"]

# Static & Media
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Wagtail
WAGTAIL_SITE_NAME = "MagixPromotion"
WAGTAILADMIN_BASE_URL = os.environ.get("WAGTAILADMIN_BASE_URL", "http://localhost:8000")
WAGTAILIMAGES_MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB
WAGTAIL_ALLOW_UNICODE_SLUGS = True

# Cache — Redis (prod), LocMem in dev override
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": os.environ.get("REDIS_URL", "redis://127.0.0.1:6379/1"),
        "TIMEOUT": 300,  # 5 minuti default
    }
}

# Wagtail cache
WAGTAIL_CACHE = True
WAGTAIL_CACHE_BACKEND = "default"

# Wagtail Search — PostgreSQL full-text search con stemmer italiano
WAGTAILSEARCH_BACKENDS = {
    "default": {
        "BACKEND": "wagtail.search.backends.database",
        "SEARCH_CONFIG": "italian",
        "AUTO_UPDATE": True,
    }
}

# Celery
CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = CELERY_BROKER_URL

# Celery Beat Schedule
from celery.schedules import crontab  # noqa: E402

CELERY_BEAT_SCHEDULE = {
    "archive-past-events": {
        "task": "booking.tasks.archive_past_events",
        "schedule": crontab(hour=3, minute=0),  # Ogni notte alle 03:00
        "options": {"expires": 3600},
    },
}

# wagtail-localize machine translator
WAGTAILLOCALIZE_MACHINE_TRANSLATOR = {
    "CLASS": "core.gemini_translator.GeminiTranslator",
    "OPTIONS": {},
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
