"""Routing email di notifica in base all'artista selezionato.

Lookup dinamico: recupera l'email del primo utente con email
presente nel ``managing_group`` dell'ArtistPage corrispondente.
Il risultato viene cachato brevemente per evitare query ripetute.
"""
from __future__ import annotations

import logging

from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

DEFAULT_BOOKING_EMAIL: str = getattr(
    settings, "BOOKING_DEFAULT_EMAIL", "booking@magixpromotion.it"
)

_CACHE_PREFIX = "booking_manager_email_"
_CACHE_TTL = 300  # secondi


def get_manager_email(artist_name: str) -> str:
    """Ritorna l'email del manager per l'artista, o il default.

    Strategia:
    1. Cerca ``ArtistPage`` live con titolo corrispondente (case-insensitive).
    2. Se la pagina ha un ``managing_group``, itera gli utenti del gruppo
       e restituisce la prima email non vuota trovata.
    3. Se nessun match o nessuna email disponibile, ritorna
       ``DEFAULT_BOOKING_EMAIL``.

    I risultati vengono cachati per ``_CACHE_TTL`` secondi.
    """
    if not artist_name:
        logger.debug("artist_name vuoto, uso email di default.")
        return DEFAULT_BOOKING_EMAIL

    cache_key = f"{_CACHE_PREFIX}{artist_name.lower()}"
    cached = cache.get(cache_key)
    if cached is not None:
        logger.debug("Cache hit per '%s': %s", artist_name, cached)
        return cached

    email = _lookup_manager_email(artist_name)
    cache.set(cache_key, email, _CACHE_TTL)
    return email


def _lookup_manager_email(artist_name: str) -> str:
    """Esegue la query DB per trovare l'email del manager."""
    # Import locale per evitare import circolari all'avvio
    from artists.models import ArtistPage  # noqa: WPS433

    try:
        artist_page = (
            ArtistPage.objects.filter(title__iexact=artist_name)
            .live()
            .select_related("managing_group")
            .first()
        )
    except Exception:
        logger.exception(
            "Errore durante il lookup dell'artista '%s'.", artist_name
        )
        return DEFAULT_BOOKING_EMAIL

    if artist_page is None:
        logger.info(
            "Nessuna ArtistPage trovata per '%s', uso email default.",
            artist_name,
        )
        return DEFAULT_BOOKING_EMAIL

    group = artist_page.managing_group
    if group is None:
        logger.info(
            "ArtistPage '%s' senza managing_group, uso email default.",
            artist_name,
        )
        return DEFAULT_BOOKING_EMAIL

    # Cerca il primo utente del gruppo con email non vuota
    manager_user = (
        group.user_set.filter(email__gt="")
        .only("email")
        .order_by("pk")
        .first()
    )

    if manager_user is None:
        logger.warning(
            "Nessun utente con email nel gruppo '%s' per l'artista '%s'.",
            group.name,
            artist_name,
        )
        return DEFAULT_BOOKING_EMAIL

    logger.debug(
        "Email manager per '%s': %s (gruppo '%s').",
        artist_name,
        manager_user.email,
        group.name,
    )
    return manager_user.email
