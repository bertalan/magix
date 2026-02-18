"""Routing email di notifica in base all'artista selezionato."""
from django.conf import settings

# Mappa artista -> email manager (configurabile da settings o DB)
ARTIST_MANAGER_MAP: dict[str, str] = {}

DEFAULT_BOOKING_EMAIL = getattr(
    settings, "BOOKING_DEFAULT_EMAIL", "booking@magixpromotion.it"
)


def get_manager_email(artist_name: str) -> str:
    """Ritorna l'email del manager per l'artista, o il default."""
    return ARTIST_MANAGER_MAP.get(artist_name, DEFAULT_BOOKING_EMAIL)
