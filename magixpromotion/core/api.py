"""API endpoint per dati aziendali pubblici (MagixSiteSettings) e Press Area."""
from django.conf import settings as django_settings
from django.http import JsonResponse
from wagtail.models import Site


def site_settings_view(request):
    """Ritorna i dati aziendali pubblici dal CMS.

    NOTA: Non esporre campi sensibili (gemini_api_key, nominatim_user_agent).
    """
    from core.models import MagixSiteSettings

    site = Site.find_for_request(request)
    settings_obj = MagixSiteSettings.for_site(site)

    data = {
        "company_name": settings_obj.company_name,
        "phone": settings_obj.phone,
        "email": settings_obj.email,
        "vat_number": settings_obj.vat_number,
        "address": {
            "street": settings_obj.address,
            "city": settings_obj.city,
            "province": settings_obj.province,
            "zip_code": settings_obj.zip_code,
            "country": str(settings_obj.country.code),
            "country_name": str(settings_obj.country.name),
            "latitude": float(settings_obj.hq_latitude) if settings_obj.hq_latitude else None,
            "longitude": float(settings_obj.hq_longitude) if settings_obj.hq_longitude else None,
        },
        "social": {
            "facebook": settings_obj.facebook_url or None,
            "instagram": settings_obj.instagram_url or None,
            "youtube": settings_obj.youtube_url or None,
            "spotify": settings_obj.spotify_url or None,
        },
        "analytics": {
            "matomo_url": settings_obj.matomo_url or getattr(django_settings, "MATOMO_URL", ""),
            "matomo_site_id": settings_obj.matomo_site_id or getattr(django_settings, "MATOMO_SITE_ID", ""),
            "google_analytics_id": (
                settings_obj.google_analytics_id
                or getattr(django_settings, "GOOGLE_ANALYTICS_ID", "")
            ),
        },
    }
    return JsonResponse(data)


def epk_list_view(request):
    """Lista tutti gli EPK pubblici per la Press Area.

    Ritorna un JSON con intro della press area (da PressAreaPage)
    e la lista di tutti i press kit disponibili con link all'artista.
    """
    from core.models import EPKPackage, PressAreaPage

    locale = request.GET.get("locale", "it")

    # Cerca la PressAreaPage per intro + EPK aziendale
    press_page = (
        PressAreaPage.objects.live()
        .filter(locale__language_code=locale)
        .first()
    )
    if not press_page:
        # Fallback alla lingua principale
        press_page = PressAreaPage.objects.live().first()

    intro = None
    if press_page:
        intro = {
            "title": press_page.title,
            "subtitle": press_page.subtitle,
            "intro_text": press_page.intro_text,
            "company_epk_id": press_page.company_epk_id,
        }

    # Tutti gli EPK pubblici
    epks = (
        EPKPackage.objects.filter(is_public=True)
        .select_related("artist", "press_photo_hires", "technical_rider", "biography_pdf", "logo_vector")
        .order_by("-updated_at")
    )

    items = []
    for epk in epks:
        artist = epk.artist
        # Contare gli asset disponibili
        assets = {}
        if epk.press_photo_hires:
            assets["photo"] = epk.press_photo_hires.file.url
        if epk.technical_rider:
            assets["rider"] = epk.technical_rider.url
        if epk.biography_pdf:
            assets["bio"] = epk.biography_pdf.url
        if epk.logo_vector:
            assets["logo"] = epk.logo_vector.url

        items.append({
            "id": epk.pk,
            "title": epk.title,
            "description": epk.description or "",
            "updated_at": epk.updated_at.isoformat(),
            "is_company": epk.pk == getattr(press_page, "company_epk_id", None),
            "assets": assets,
            "artist": {
                "id": artist.pk if artist else None,
                "title": artist.title if artist else None,
                "slug": artist.slug if artist else None,
            } if artist else None,
        })

    return JsonResponse({"intro": intro, "items": items})
