# TASK 22 — Performance, Caching & Immagini

> **Agente:** Backend  
> **Fase:** 5 — Qualità & Ottimizzazione  
> **Dipendenze:** Task 03, Task 04, Task 10  
> **Stima:** 20 min  

---

## OBIETTIVO

Ottimizzare le performance del sito con:
1. Template fragment caching per widget/snippets
2. Wagtail image renditions (WebP, responsive srcset)
3. Cache headers su API responses
4. Django cache framework configurato
5. Frontend: lazy loading, image optimization

---

## FILES_IN_SCOPE (da leggere)

- `idea/4-dev-guidelines.md` — Sezione caching e immagini

---

## OUTPUT_ATTESO

```
core/
├── cache.py               # Cache helper e decorators
├── middleware.py           # Cache middleware per API
config/settings/
├── base.py                # Cache backend configuration
artists/
├── models.py              # Aggiunta rendition specs
```

---

## SPECIFICHE

### 1. Cache Backend Configuration

```python
# config/settings/base.py

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": env("REDIS_URL", default="redis://127.0.0.1:6379/1"),
        "TIMEOUT": 300,  # 5 minuti default
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        },
    }
}

# Wagtail-specific cache
WAGTAIL_CACHE = True
WAGTAIL_CACHE_BACKEND = "default"
```

### 2. Wagtail Image Renditions

```python
# artists/models.py — Aggiungere proprietà per renditions
class ArtistPage(Page):
    # ... campi esistenti ...

    @property
    def card_image_renditions(self) -> dict[str, str]:
        """Genera rendition set per la card artista."""
        if not self.card_image:
            return {}
        return {
            "thumbnail": self.card_image.get_rendition("fill-400x533|format-webp").url,
            "card": self.card_image.get_rendition("fill-600x800|format-webp").url,
            "card_2x": self.card_image.get_rendition("fill-1200x1600|format-webp").url,
            "og": self.card_image.get_rendition("fill-1200x630|format-webp").url,
        }

    @property
    def hero_image_renditions(self) -> dict[str, str]:
        """Rendition set per l'hero image nel detail."""
        img = self.hero_image or self.card_image
        if not img:
            return {}
        return {
            "mobile": img.get_rendition("fill-800x1000|format-webp").url,
            "desktop": img.get_rendition("fill-1200x1600|format-webp").url,
            "desktop_2x": img.get_rendition("fill-2400x3200|format-webp").url,
        }
```

### 3. API Serializer con Renditions

```python
# artists/api.py — Aggiornare il serializzatore
class ArtistImageField(Field):
    """Serializza le rendition immagini artista."""

    def to_representation(self, page):
        return {
            "card": page.card_image_renditions,
            "hero": page.hero_image_renditions,
        }
```

### 4. Cache Middleware per API

```python
# core/middleware.py
"""Middleware per cache headers su risposte API."""
from django.utils.cache import patch_cache_control


class APICacheMiddleware:
    """Aggiunge Cache-Control headers alle risposte API."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Solo per richieste API GET
        if request.path.startswith("/api/") and request.method == "GET":
            # Cache pubblica per 5 minuti, stale-while-revalidate per 1 ora
            patch_cache_control(
                response,
                public=True,
                max_age=300,
                s_maxage=600,
                stale_while_revalidate=3600,
            )

        return response
```

Aggiungere al middleware:
```python
# config/settings/base.py
MIDDLEWARE += [
    "core.middleware.APICacheMiddleware",
]
```

### 5. Template Fragment Caching

```python
# core/cache.py
"""Utility per cache fragments."""
from django.core.cache import cache
from functools import wraps


def cached_property_ttl(ttl: int = 300):
    """Decorator per proprietà cacheable con TTL."""
    def decorator(func):
        @wraps(func)
        def wrapper(self):
            cache_key = f"{self.__class__.__name__}:{self.pk}:{func.__name__}"
            result = cache.get(cache_key)
            if result is None:
                result = func(self)
                cache.set(cache_key, result, ttl)
            return result
        return property(wrapper)
    return decorator
```

Uso:
```python
class ArtistPage(Page):
    @cached_property_ttl(ttl=600)
    def upcoming_events_count(self) -> int:
        """Numero eventi futuri (cached 10 min)."""
        return self.events.filter(is_archived=False).count()
```

### 6. Cache Invalidation su Save

```python
# artists/models.py — Aggiungere metodo save
class ArtistPage(Page):
    def save(self, *args, **kwargs):
        # Invalida cache renditions e proprietà
        from django.core.cache import cache
        cache.delete_pattern(f"ArtistPage:{self.pk}:*")
        super().save(*args, **kwargs)
```

### 7. Frontend — Lazy Loading & Image Optimization

```tsx
// frontend/src/components/OptimizedImage.tsx
import React from "react";

interface OptimizedImageProps {
  renditions: {
    thumbnail?: string;
    card?: string;
    card_2x?: string;
    mobile?: string;
    desktop?: string;
  };
  alt: string;
  className?: string;
  sizes?: string;
  loading?: "lazy" | "eager";
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  renditions,
  alt,
  className = "",
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  loading = "lazy",
}) => {
  const srcSet = [
    renditions.thumbnail && `${renditions.thumbnail} 400w`,
    renditions.card && `${renditions.card} 600w`,
    renditions.card_2x && `${renditions.card_2x} 1200w`,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <img
      src={renditions.card || renditions.thumbnail || ""}
      srcSet={srcSet || undefined}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      loading={loading}
      decoding="async"
      className={className}
    />
  );
};

export default OptimizedImage;
```

---

## NOTE IMPLEMENTATIVE

1. **WebP:** Wagtail genera rendition WebP nativamente con `|format-webp`. Il browser fallback è gestito automaticamente.
2. **Redis cache:** Stesso Redis di Celery ma database diverso (`/1` vs `/0`).
3. **stale-while-revalidate:** Permette di servire contenuto stale mentre il backend rigenera la cache.
4. **Cache invalidation:** `save()` override pulisce la cache per l'artista specifico.
5. **Rendition lazy:** Le renditions Wagtail sono generate on-demand al primo accesso. Poi servite da file system.
6. **srcSet responsive:** 3 breakpoint (400w, 600w, 1200w) per card artista. L'immagine corretta viene scelta dal browser.

---

## CRITERI DI ACCETTAZIONE

- [ ] Redis cache configurato in settings
- [ ] API responses hanno `Cache-Control: public, max-age=300`
- [ ] Immagini artista servite in WebP
- [ ] Rendition card in 3 dimensioni (400, 600, 1200)
- [ ] Rendition hero in 3 dimensioni (800, 1200, 2400)
- [ ] `OptimizedImage` usa srcSet e sizes
- [ ] Tutte le immagini hanno `loading="lazy"` (tranne hero above-the-fold)
- [ ] Cache invalidata su salvataggio pagina
- [ ] Proprietà cached con TTL funzionanti
- [ ] Lighthouse Performance score ≥ 90
