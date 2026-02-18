# TASK 01 — Scaffolding Progetto Django/Wagtail

> **Agente:** Backend  
> **Fase:** 0 — Scaffolding  
> **Dipendenze:** Nessuna  
> **Stima:** 30 min  

---

## OBIETTIVO

Creare lo scheletro del progetto Django/Wagtail con struttura multi-app, settings splittati (dev/prod), e dipendenze Python installate. Il progetto deve essere avviabile con `runserver` e mostrare la Wagtail admin funzionante.

---

## FILES_IN_SCOPE (da leggere)

- `tasks/00-indice-master.md` — solo la sezione "Struttura App Django"
- `template-strutturale/package.json` — per capire la struttura frontend da integrare

---

## OUTPUT_ATTESO

```
magixpromotion/
├── manage.py
├── requirements/
│   ├── base.txt
│   └── dev.txt
├── config/
│   ├── __init__.py
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   └── dev.py
│   ├── urls.py
│   └── wsgi.py
├── core/
│   ├── __init__.py
│   ├── models.py          # HomePage (vuoto, solo struttura)
│   ├── migrations/        # ⚠️ T27 aggiunge qui 2 data-migration (gruppi + workflow)
│   └── wagtail_hooks.py   # ⚠️ T27 popola con 5 hook per isolamento per-band
├── artists/
│   ├── __init__.py
│   ├── models.py          # placeholder
│   └── migrations/
├── events/
│   ├── __init__.py
│   ├── models.py          # placeholder
│   └── migrations/
├── booking/
│   ├── __init__.py
│   ├── models.py          # placeholder
│   └── migrations/
├── navigation/
│   ├── __init__.py
│   ├── models.py          # placeholder
│   └── migrations/
├── templates/
│   └── base.html
├── static/
│   └── .gitkeep
└── .env.example
```

---

## SPECIFICHE TECNICHE

### 1. requirements/base.txt
```
Django>=5.2,<6.0
wagtail>=7.0,<8.0
wagtail-localize>=1.13
django-extensions
django-dotenv
psycopg[binary]>=3.1
Pillow>=10.0
celery[redis]>=5.3
django-celery-beat
django-countries>=8.0
geopy>=2.4
```

### 2. requirements/dev.txt
```
-r base.txt
pytest
pytest-django
factory-boy
black
flake8
mypy
django-debug-toolbar
```

### 3. config/settings/base.py
```python
"""
Settings base per MagixPromotion.
Segue le best practice Wagtail 7.x (LTS).
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "change-me-in-production")
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

# Celery
CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = CELERY_BROKER_URL

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
```

### 4. config/settings/dev.py
```python
"""Settings di sviluppo locale."""
from .base import *  # noqa: F401,F403

DEBUG = True
ALLOWED_HOSTS = ["*"]
SECRET_KEY = "dev-insecure-key-change-in-prod"

# SQLite per sviluppo rapido (opzionale, override su PostgreSQL)
# DATABASES = {
#     "default": {
#         "ENGINE": "django.db.backends.sqlite3",
#         "NAME": BASE_DIR / "db.sqlite3",
#     }
# }

INSTALLED_APPS += ["debug_toolbar"]  # type: ignore[name-defined]
MIDDLEWARE.insert(0, "debug_toolbar.middleware.DebugToolbarMiddleware")  # type: ignore[name-defined]
INTERNAL_IPS = ["127.0.0.1"]

# Ricerca semplice per dev
WAGTAILSEARCH_BACKENDS = {
    "default": {
        "BACKEND": "wagtail.search.backends.database",
    }
}

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
```

### 5. config/urls.py
```python
from django.conf import settings
from django.conf.urls.i18n import i18n_patterns
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from wagtail import urls as wagtail_urls
from wagtail.admin import urls as wagtailadmin_urls
from wagtail.documents import urls as wagtaildocs_urls

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("admin/", include(wagtailadmin_urls)),
    path("documents/", include(wagtaildocs_urls)),
]

# URL localizzate (le pagine Wagtail rispondono sotto prefisso lingua)
urlpatterns += i18n_patterns(
    path("", include(wagtail_urls)),
)

if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [path("__debug__/", include(debug_toolbar.urls))] + urlpatterns
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### 6. core/models.py (HomePage minima)
```python
"""HomePage — radice dell'albero Wagtail."""
from wagtail.models import Page


class HomePage(Page):
    """Pagina radice del sito. Funge da aggregatore."""

    max_count = 1  # Solo una HomePage
    subpage_types = [
        "artists.ArtistListingPage",
        "events.EventListingPage",
        "booking.BookingFormPage",
    ]

    class Meta:
        verbose_name = "Home Page"
```

### 7. .env.example
```
DJANGO_SECRET_KEY=your-secret-key
DJANGO_SETTINGS_MODULE=config.settings.dev
DB_NAME=magixpromotion
DB_USER=postgres
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=5432
CELERY_BROKER_URL=redis://localhost:6379/0
WAGTAILADMIN_BASE_URL=http://localhost:8000
GEMINI_API_KEY=your-gemini-key

# === Nominatim / Geocoding ===
NOMINATIM_USER_AGENT=magixpromotion-dev
```

---

## CRITERI DI ACCETTAZIONE

- [ ] `python manage.py check` passa senza errori
- [ ] `python manage.py migrate` crea le tabelle
- [ ] `python manage.py createsuperuser` funziona
- [ ] Wagtail admin raggiungibile su `/admin/`
- [ ] HomePage creabile dall'admin come root page
- [ ] Settings splittati: `DJANGO_SETTINGS_MODULE=config.settings.dev`
- [ ] Tutte le app (`core`, `artists`, `events`, `booking`, `navigation`) registrate
- [ ] `core/wagtail_hooks.py` creato (scaffold vuoto; T27 §L238–407 lo popola con hook permessi)
- [ ] `wagtail.contrib.settings` in INSTALLED_APPS
- [ ] `django-countries` installato e funzionante
- [ ] `LOCALE_PATHS` configurato per file `.po` gettext

---

## SEZIONE TDD

> **Prima di implementare**, scrivere i test seguenti:

```python
# tests/test_scaffolding.py
import pytest

@pytest.mark.django_db
def test_django_check():
    """manage.py check non deve dare errori."""
    from django.core.management import call_command
    call_command("check")

@pytest.mark.django_db
def test_installed_apps_contain_settings():
    from django.conf import settings
    assert "wagtail.contrib.settings" in settings.INSTALLED_APPS
    assert "django_countries" in settings.INSTALLED_APPS

@pytest.mark.django_db
def test_locale_paths_set():
    from django.conf import settings
    assert len(settings.LOCALE_PATHS) > 0
```

---

## SECURITY CHECKLIST

- [ ] `SECRET_KEY` letto da variabile ambiente, NON hardcodato in base.py
- [ ] `DEBUG = False` in base.py (override solo in dev.py)
- [ ] `ALLOWED_HOSTS` vuoto di default (deve essere configurato in produzione)
- [ ] CSRF middleware attivo
- [ ] SecurityMiddleware attivo
- [ ] XFrameOptionsMiddleware attivo
