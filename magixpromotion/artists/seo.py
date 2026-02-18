"""Generazione JSON-LD Schema.org per artisti."""
import json
from typing import Any


def artist_jsonld(page) -> str:
    """Genera JSON-LD Schema.org/MusicGroup per una ArtistPage.

    Adattato ai campi reali del modello ArtistPage:
    - main_image (non card_image)
    - short_bio (non bio)
    - instagram_url / facebook_url / spotify_url
    """
    data: dict[str, Any] = {
        "@context": "https://schema.org",
        "@type": "MusicGroup",
        "name": page.title,
        "description": page.short_bio[:200] if page.short_bio else "",
        "url": page.full_url,
        "genre": [g.name for g in page.genres.all()],
    }

    # Immagine principale
    if page.main_image:
        try:
            data["image"] = page.main_image.get_rendition("fill-800x600").url
        except Exception:
            pass

    # Video promo
    if page.hero_video_url:
        data["video"] = {
            "@type": "VideoObject",
            "url": page.hero_video_url,
            "name": f"Video promo {page.title}",
        }

    # Social profiles
    same_as: list[str] = []
    if page.instagram_url:
        same_as.append(page.instagram_url)
    if page.facebook_url:
        same_as.append(page.facebook_url)
    if page.spotify_url:
        same_as.append(page.spotify_url)
    if page.website_url:
        same_as.append(page.website_url)
    if same_as:
        data["sameAs"] = same_as

    # Prossimi eventi dell'artista
    from events.models import EventPage

    events = (
        EventPage.objects.live()
        .filter(related_artist=page, is_archived=False)
        .order_by("start_date")[:5]
    )
    if events.exists():
        data["event"] = [
            {
                "@type": "MusicEvent",
                "name": ev.title,
                "startDate": (
                    ev.start_date.isoformat() if ev.start_date else ""
                ),
                "location": {
                    "@type": "Place",
                    "name": ev.venue.name if ev.venue else "",
                },
            }
            for ev in events
        ]

    return json.dumps(data, ensure_ascii=False)
