"""Settings per test --- database SQLite, niente Redis."""
from .base import *  # noqa: F401,F403

DEBUG = False
SECRET_KEY = "test-secret-key-not-for-production"
ALLOWED_HOSTS = ["*"]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# Disabilita cache in test
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

# Disabilita Celery in test
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Password hasher veloce per test
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

# Email backend test
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# Wagtail search backend semplice
WAGTAILSEARCH_BACKENDS = {
    "default": {
        "BACKEND": "wagtail.search.backends.database",
    }
}

# Disabilita machine translator in test
WAGTAILLOCALIZE_MACHINE_TRANSLATOR = None

# Rimuovi debug_toolbar se presente nelle INSTALLED_APPS
INSTALLED_APPS = [app for app in INSTALLED_APPS if app != "debug_toolbar"]  # type: ignore[name-defined]  # noqa: F405

# Rimuovi debug_toolbar middleware se presente
MIDDLEWARE = [mw for mw in MIDDLEWARE if "debug_toolbar" not in mw]  # type: ignore[name-defined]  # noqa: F405
