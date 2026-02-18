"""API per menu navigazione (consumato dal frontend React)."""
from django.http import JsonResponse
from django.utils.translation import get_language

from .models import NavigationMenu


def menu_api(request, location: str):
    """
    GET /api/v2/menu/<location>/
    Ritorna JSON con le voci di menu per la posizione data.
    """
    language = request.GET.get("lang", get_language() or "it")

    try:
        menu = NavigationMenu.objects.prefetch_related("items__page_link").get(
            location=location,
            language=language,
        )
    except NavigationMenu.DoesNotExist:
        return JsonResponse({"items": []})

    items = [
        {
            "title": item.display_title,
            "url": item.url,
            "openInNewTab": item.open_in_new_tab,
            "icon": item.icon,
        }
        for item in menu.items.all()
    ]

    return JsonResponse({"location": location, "language": language, "items": items})
