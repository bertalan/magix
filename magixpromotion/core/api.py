"""API endpoint per dati aziendali pubblici (MagixSiteSettings)."""
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
    }
    return JsonResponse(data)
