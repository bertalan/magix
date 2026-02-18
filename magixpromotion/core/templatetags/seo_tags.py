"""Template tags per inserire JSON-LD nelle pagine Django/Wagtail."""
from django import template
from django.utils.safestring import mark_safe

from core.seo import homepage_jsonld

register = template.Library()


@register.simple_tag(takes_context=True)
def page_jsonld(context):
    """Inserisce JSON-LD Schema.org appropriato per la pagina corrente.

    Uso nel template::

        {% load seo_tags %}
        {% page_jsonld %}

    Genera automaticamente:
    - MusicGroup per ArtistPage
    - MusicEvent per EventPage
    - EntertainmentBusiness per HomePage
    """
    page = context.get("page") or context.get("self")
    if not page:
        return ""

    page_class = page.specific_class.__name__

    if page_class == "ArtistPage":
        from artists.seo import artist_jsonld

        script = artist_jsonld(page.specific)
    elif page_class == "EventPage":
        from events.seo import event_jsonld

        script = event_jsonld(page.specific)
    elif page_class == "HomePage":
        script = homepage_jsonld()
    else:
        return ""

    return mark_safe(f'<script type="application/ld+json">{script}</script>')
