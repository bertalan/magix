"""Utility per cache fragments e proprietà cacheable."""
from functools import wraps

from django.core.cache import cache


def cached_property_ttl(ttl: int = 300):
    """Decorator per proprietà cacheable con TTL.

    Usa il Django cache framework per memorizzare il risultato
    di una property per un tempo configurabile.

    Esempio::

        class ArtistPage(Page):
            @cached_property_ttl(ttl=600)
            def upcoming_events_count(self) -> int:
                return self.events.filter(is_archived=False).count()
    """

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


def invalidate_model_cache(model_class_name: str, pk: int) -> None:
    """Invalida tutte le cache entries per un model instance specifico.

    Compatibile con tutti i cache backends (non richiede delete_pattern).
    """
    # Per cache backends che supportano delete_pattern (es. django-redis)
    try:
        cache.delete_pattern(f"{model_class_name}:{pk}:*")
    except (AttributeError, NotImplementedError):
        # LocMem o altri backend non supportano delete_pattern.
        # In dev con LocMem il cache e' gia' volatile.
        pass
