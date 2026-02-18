"""Middleware per cache headers su risposte API."""
from django.utils.cache import patch_cache_control


class APICacheMiddleware:
    """Aggiunge Cache-Control headers alle risposte API GET.

    - Cache pubblica per 5 minuti (max-age=300)
    - CDN / reverse proxy cache per 10 minuti (s-maxage=600)
    - Serve stale content per 1 ora durante revalidation
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Solo per richieste API GET
        if request.path.startswith("/api/") and request.method == "GET":
            patch_cache_control(
                response,
                public=True,
                max_age=300,
                s_maxage=600,
                stale_while_revalidate=3600,
            )

        return response
