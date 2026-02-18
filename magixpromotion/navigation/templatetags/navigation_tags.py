"""Template tag per renderizzare menu dinamici."""
from django import template
from django.utils.translation import get_language

from navigation.models import NavigationMenu

register = template.Library()


@register.inclusion_tag("navigation/menu.html", takes_context=True)
def render_menu(context, location: str):
    """
    Renderizza un menu per posizione e lingua corrente.

    Uso: {% render_menu "header" %}
    """
    request = context.get("request")
    language = get_language() or "it"

    try:
        menu = NavigationMenu.objects.prefetch_related("items__page_link").get(
            location=location,
            language=language,
        )
        items = menu.items.all()
    except NavigationMenu.DoesNotExist:
        items = []

    return {"menu_items": items, "request": request}
