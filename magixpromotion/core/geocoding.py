"""Helper per geocoding via Nominatim (OpenStreetMap). NO Google Maps."""
import time
import logging
from typing import Optional

from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError

logger = logging.getLogger(__name__)

# Rate limit: max 1 richiesta/secondo per policy Nominatim
_last_request_time = 0.0


def nominatim_geocode(
    address: str,
    user_agent: str = "magixpromotion",
) -> Optional[tuple[float, float]]:
    """
    Geocodifica un indirizzo usando Nominatim (OSM).

    Returns:
        Tupla (latitude, longitude) o None se non trovato.
    """
    global _last_request_time

    # Rispetta rate limit Nominatim
    elapsed = time.time() - _last_request_time
    if elapsed < 1.0:
        time.sleep(1.0 - elapsed)

    try:
        geolocator = Nominatim(user_agent=user_agent, timeout=10)
        location = geolocator.geocode(address)
        _last_request_time = time.time()

        if location:
            logger.info("Geocodificato: %s -> (%s, %s)", address, location.latitude, location.longitude)
            return (location.latitude, location.longitude)

        logger.warning("Indirizzo non trovato: %s", address)
        return None
    except (GeocoderTimedOut, GeocoderServiceError) as e:
        logger.error("Errore geocoding Nominatim: %s", e)
        return None
