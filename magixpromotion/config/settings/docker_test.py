"""Settings per test in Docker — usa PostgreSQL del container."""
from .docker_dev import *  # noqa: F401,F403

DEBUG = False
SECRET_KEY = "test-secret-key-not-for-production"

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
