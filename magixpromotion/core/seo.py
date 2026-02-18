"""JSON-LD per homepage e pagine generiche.
Legge i dati aziendali da MagixSiteSettings (CMS)."""
import json

from wagtail.models import Site


def homepage_jsonld() -> str:
    """JSON-LD Schema.org/EntertainmentBusiness per Magix Promotion.

    Dati dinamici da MagixSiteSettings. Se il model non e' configurato,
    usa valori di default (hardcoded come fallback).
    """
    from core.models import MagixSiteSettings

    site = None
    try:
        site = Site.objects.get(is_default_site=True)
        settings = MagixSiteSettings.for_site(site)
    except Site.DoesNotExist:
        settings = None

    data = {
        "@context": "https://schema.org",
        "@type": "EntertainmentBusiness",
        "name": getattr(settings, "company_name", "Magix Promotion"),
        "description": (
            "Agenzia di band e artisti musicali per eventi "
            "in Italia e nel mondo."
        ),
        "url": site.root_url if site else "https://www.magixpromotion.it",
        "telephone": getattr(settings, "phone", "+39 335 523 0855"),
        "email": getattr(settings, "email", "info@magixpromotion.it"),
        "address": {
            "@type": "PostalAddress",
            "streetAddress": getattr(settings, "address", "Via dello Scabiolo"),
            "addressLocality": getattr(settings, "city", "Novi Ligure"),
            "postalCode": getattr(settings, "zip_code", "15067"),
            "addressRegion": getattr(settings, "province", "AL"),
            "addressCountry": (
                str(settings.country.code) if settings and settings.country else "IT"
            ),
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": (
                float(settings.hq_latitude)
                if settings and settings.hq_latitude
                else 44.7631
            ),
            "longitude": (
                float(settings.hq_longitude)
                if settings and settings.hq_longitude
                else 8.7873
            ),
        },
        "areaServed": {
            "@type": "GeoCircle",
            "geoMidpoint": {
                "@type": "GeoCoordinates",
                "latitude": (
                    float(settings.hq_latitude)
                    if settings and settings.hq_latitude
                    else 44.7631
                ),
                "longitude": (
                    float(settings.hq_longitude)
                    if settings and settings.hq_longitude
                    else 8.7873
                ),
            },
            "geoRadius": "500",
        },
        "priceRange": "$$",
        "knowsLanguage": ["it", "en"],
    }

    # Social profiles
    same_as = []
    if settings:
        for field in ("facebook_url", "instagram_url", "youtube_url", "spotify_url"):
            url = getattr(settings, field, "")
            if url:
                same_as.append(url)
    if same_as:
        data["sameAs"] = same_as

    return json.dumps(data, ensure_ascii=False)
