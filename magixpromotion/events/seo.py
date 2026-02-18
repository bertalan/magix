"""Generazione JSON-LD Schema.org per eventi."""
import json
from typing import Any


def event_jsonld(page) -> str:
    """Genera JSON-LD Schema.org/MusicEvent per una EventPage.

    Adattato ai campi reali del modello EventPage:
    - start_date / end_date (non date_start / date_end)
    - related_artist (non artist)
    - venue.country usa CountryField
    """
    data: dict[str, Any] = {
        "@context": "https://schema.org",
        "@type": "MusicEvent",
        "name": page.title,
        "startDate": page.start_date.isoformat() if page.start_date else "",
        "url": page.full_url,
        "eventStatus": "https://schema.org/EventScheduled",
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

    # Organizer
    data["organizer"] = {
        "@type": "Organization",
        "name": "Magix Promotion",
        "url": "https://www.magixpromotion.it",
    }

    # Ticket info
    if page.ticket_url:
        data["offers"] = {
            "@type": "Offer",
            "url": page.ticket_url,
            "availability": "https://schema.org/InStock",
        }
        if page.ticket_price:
            data["offers"]["price"] = page.ticket_price

    return json.dumps(data, ensure_ascii=False)
