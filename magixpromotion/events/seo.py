"""Generazione JSON-LD Schema.org per eventi."""
import json
from typing import Any


# Mappa status interno → Schema.org eventStatus
_STATUS_MAP = {
    "confirmed": "https://schema.org/EventScheduled",
    "tentative": "https://schema.org/EventScheduled",
    "cancelled": "https://schema.org/EventCancelled",
    "postponed": "https://schema.org/EventPostponed",
    "sold_out": "https://schema.org/EventScheduled",
}


def event_jsonld(page) -> str:
    """Genera JSON-LD Schema.org/MusicEvent per una EventPage.

    Adattato ai campi reali del modello EventPage:
    - start_date / end_date (non date_start / date_end)
    - related_artist (non artist)
    - venue.country usa CountryField
    - eventStatus mappato da model status
    """
    from wagtail.models import Site

    data: dict[str, Any] = {
        "@context": "https://schema.org",
        "@type": "MusicEvent",
        "name": page.title,
        "startDate": page.start_date.isoformat() if page.start_date else "",
        "url": page.full_url,
        "eventStatus": _STATUS_MAP.get(
            page.status, "https://schema.org/EventScheduled"
        ),
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    }

    if page.end_date:
        data["endDate"] = page.end_date.isoformat()

    # Venue / Location
    if page.venue:
        location: dict[str, Any] = {
            "@type": "Place",
            "name": page.venue.name,
        }
        if page.venue.city:
            location["address"] = {
                "@type": "PostalAddress",
                "addressLocality": page.venue.city,
                "addressRegion": page.venue.region or "",
                "postalCode": page.venue.zip_code or "",
                "addressCountry": (
                    str(page.venue.country.code)
                    if page.venue.country
                    else "IT"
                ),
            }
        if page.venue.latitude and page.venue.longitude:
            location["geo"] = {
                "@type": "GeoCoordinates",
                "latitude": float(page.venue.latitude),
                "longitude": float(page.venue.longitude),
            }
        data["location"] = location

    # Artista / Performer
    if page.related_artist:
        data["performer"] = {
            "@type": "MusicGroup",
            "name": page.related_artist.title,
            "url": page.related_artist.full_url,
        }

    # Organizer — URL dinamico dal sito Wagtail
    try:
        site = Site.objects.get(is_default_site=True)
        org_url = site.root_url
    except Site.DoesNotExist:
        org_url = "https://www.magixpromotion.com"

    data["organizer"] = {
        "@type": "Organization",
        "name": "Magix Promotion",
        "url": org_url,
    }

    # Ticket info — con availability basata sullo status
    if page.ticket_url:
        availability = (
            "https://schema.org/SoldOut"
            if page.status == "sold_out"
            else "https://schema.org/InStock"
        )
        data["offers"] = {
            "@type": "Offer",
            "url": page.ticket_url,
            "availability": availability,
        }
        if page.ticket_price:
            data["offers"]["price"] = page.ticket_price

    return json.dumps(data, ensure_ascii=False)
