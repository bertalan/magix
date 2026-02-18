# TASK 02 — Snippet Models (Genre, Venue, Promoter)

> **Agente:** Backend  
> **Fase:** 1 — Data Models  
> **Dipendenze:** Task 01  
> **Stima:** 25 min  

---

## OBIETTIVO

Creare le entità riutilizzabili (Snippet) che servono come tassonomie trasversali per Artisti e Eventi. Questi non hanno URL propri e vengono gestiti nel pannello Snippets di Wagtail.

---

## FILES_IN_SCOPE (da leggere)

- `idea/1-architettura-dati-wagtail.md` — sezione 1.2 (Snippets vs Tags)
- `idea/7-note-strategiche-progetto.md` — sezione 2 (Modifiche al Data Model: Venue.region)
- `dati-band-Magixpromotion.csv` — per estrarre i generi reali

---

## OUTPUT_ATTESO

```
artists/
├── models.py          # Genre snippet + relazione
events/
├── models.py          # Venue, Promoter snippets
core/
├── models.py          # MagixSiteSettings (wagtail.contrib.settings)
├── geocoding.py       # Helper Nominatim per geocoding indirizzi
```

---

## SPECIFICHE MODELLI

### 1. Genre (app: `artists`)

```python
"""Genere musicale — Snippet riutilizzabile."""
from django.db import models
from wagtail.snippets.models import register_snippet
from wagtail.admin.panels import FieldPanel


@register_snippet
class Genre(models.Model):
    """Genere musicale usato per classificare gli artisti."""

    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="Nome genere",
    )
    slug = models.SlugField(
        max_length=100,
        unique=True,
        help_text="Generato automaticamente dal nome.",
    )
    description = models.TextField(
        blank=True,
        verbose_name="Descrizione",
        help_text="Breve descrizione del genere (opzionale).",
    )

    panels = [
        FieldPanel("name"),
        FieldPanel("slug"),
        FieldPanel("description"),
    ]

    class Meta:
        verbose_name = "Genere musicale"
        verbose_name_plural = "Generi musicali"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name
```

**Generi da pre-popolare (dal CSV):**
- Dance Show Band
- Beat Show Party Band
- Glam Rock Night
- Rock Band
- Folk Band
- Tributo Italiano
- Tributo Internazionale
- Dee-Jay

---

### 2. Venue (app: `events`)

```python
"""Venue — Snippet per locali/teatri/piazze. Supporta venue internazionali."""
from django.db import models
from django_countries.fields import CountryField
from wagtail.snippets.models import register_snippet
from wagtail.admin.panels import FieldPanel, MultiFieldPanel


@register_snippet
class Venue(models.Model):
    """Locale, teatro, piazza o venue per eventi. Supporta indirizzi internazionali."""

    name = models.CharField(max_length=200, verbose_name="Nome venue")
    city = models.CharField(max_length=100, verbose_name="Città")
    province = models.CharField(
        max_length=10,
        blank=True,
        verbose_name="Provincia / Stato",
        help_text="Es: AL, MI, TO oppure Bayern, Île-de-France",
    )
    region = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Regione",
        help_text="Testo libero. Es: Piemonte, Lombardia, Bavaria, Catalonia",
    )
    country = CountryField(
        default="IT",
        verbose_name="Paese",
        help_text="Codice ISO 3166-1 alpha-2",
    )
    address = models.CharField(
        max_length=300,
        blank=True,
        verbose_name="Indirizzo completo",
    )
    zip_code = models.CharField(
        max_length=20,
        blank=True,
        verbose_name="CAP / Codice postale",
    )
    capacity = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="Capienza",
    )
    website = models.URLField(blank=True, verbose_name="Sito web")
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name="Latitudine",
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name="Longitudine",
    )

    panels = [
        FieldPanel("name"),
        MultiFieldPanel(
            [
                FieldPanel("address"),
                FieldPanel("city"),
                FieldPanel("province"),
                FieldPanel("region"),
                FieldPanel("zip_code"),
                FieldPanel("country"),
            ],
            heading="Localizzazione",
        ),
        FieldPanel("capacity"),
        FieldPanel("website"),
        MultiFieldPanel(
            [
                FieldPanel("latitude"),
                FieldPanel("longitude"),
            ],
            heading="Coordinate GPS (auto-compilabili via Nominatim)",
        ),
    ]

    class Meta:
        verbose_name = "Venue"
        verbose_name_plural = "Venues"
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} — {self.city} ({self.country.code})"

    @property
    def full_address(self) -> str:
        """Indirizzo completo formattato per visualization e deep link."""
        parts = [self.address, self.zip_code, self.city, self.province, str(self.country.name)]
        return ", ".join(p for p in parts if p)

    @property
    def navigation_url(self) -> str:
        """URL deep link per navigazione mobile (Google Maps / Apple Maps)."""
        addr = self.full_address
        if self.latitude and self.longitude:
            # Formato universale: funziona su Android (Google Maps) e web
            return f"https://www.google.com/maps/dir/?api=1&destination={self.latitude},{self.longitude}&travelmode=driving"
        # Fallback su indirizzo testuale
        from urllib.parse import quote
        return f"https://www.google.com/maps/dir/?api=1&destination={quote(addr)}&travelmode=driving"

    def geocode_with_nominatim(self) -> bool:
        """Geocodifica indirizzo con Nominatim (OpenStreetMap). Ritorna True se successo."""
        from core.geocoding import nominatim_geocode
        coords = nominatim_geocode(self.full_address)
        if coords:
            self.latitude, self.longitude = coords
            return True
        return False
```

---

### 3. Promoter (app: `events`)

```python
"""Promoter — Snippet per organizzatori/promoter."""

@register_snippet
class Promoter(models.Model):
    """Promoter o organizzatore eventi. Dati riservati (non pubblici)."""

    company_name = models.CharField(max_length=200, verbose_name="Ragione sociale")
    contact_name = models.CharField(
        max_length=150,
        blank=True,
        verbose_name="Referente",
    )
    email = models.EmailField(blank=True, verbose_name="Email")
    phone = models.CharField(max_length=30, blank=True, verbose_name="Telefono")
    notes = models.TextField(
        blank=True,
        verbose_name="Note interne",
        help_text="Visibili solo agli admin.",
    )

    panels = [
        FieldPanel("company_name"),
        FieldPanel("contact_name"),
        FieldPanel("email"),
        FieldPanel("phone"),
        FieldPanel("notes"),
    ]

    class Meta:
        verbose_name = "Promoter"
        verbose_name_plural = "Promoters"
        ordering = ["company_name"]

    def __str__(self) -> str:
        return self.company_name
```

---

## NOTE IMPLEMENTATIVE

1. **Genre + Artist relazione:** La relazione `ParentalManyToManyField` verrà creata nel Task 03 (ArtistPage). Qui si definisce solo lo Snippet.
2. **Venue internazionale:** Il campo `country` usa `django-countries` (CountryField). Il campo `region` è testo libero per supportare regioni di qualsiasi paese. Non usare piu `REGION_CHOICES`.
3. **Promoter:** I dati sono riservati. Non esporre via API pubblica (configurare in Task 10).
4. **Auto-slug:** Implementare `save()` override o segnale per auto-generare lo slug di Genre dal name.
5. **Geocoding Nominatim:** Helper in `core/geocoding.py` per geocodificare indirizzi via API Nominatim (OpenStreetMap). Rispettare rate limit 1 req/sec.
6. **Deep link navigazione:** Il metodo `Venue.navigation_url` genera URL universali per navigazione mobile.

---

### 4. MagixSiteSettings (app: `core`)

```python
# core/models.py
"""SiteSettings per dati aziendali configurabili dal CMS."""
from django.db import models
from django_countries.fields import CountryField
from wagtail.contrib.settings.models import BaseSiteSetting, register_setting
from wagtail.admin.panels import FieldPanel, MultiFieldPanel


@register_setting(icon="cog")
class MagixSiteSettings(BaseSiteSetting):
    """Configurazioni globali del sito, gestite dal CMS.
    
    Contiene dati NON traducibili (telefono, email, indirizzi, API keys).
    Le stringhe UI traducibili vanno nei file .po (gettext).
    """

    # --- Dati aziendali ---
    company_name = models.CharField(
        max_length=200,
        default="Magix Promotion",
        verbose_name="Ragione sociale",
    )
    vat_number = models.CharField(
        max_length=30,
        blank=True,
        verbose_name="Partita IVA",
    )
    phone = models.CharField(
        max_length=30,
        default="+39 335 523 0855",
        verbose_name="Telefono",
    )
    email = models.EmailField(
        default="info@magixpromotion.it",
        verbose_name="Email principale",
    )

    # --- Indirizzo sede ---
    address = models.CharField(
        max_length=300,
        default="Via dello Scabiolo",
        verbose_name="Indirizzo",
    )
    city = models.CharField(
        max_length=100,
        default="Novi Ligure",
        verbose_name="Città",
    )
    province = models.CharField(
        max_length=10,
        default="AL",
        verbose_name="Provincia",
    )
    zip_code = models.CharField(
        max_length=20,
        default="15067",
        verbose_name="CAP",
    )
    country = CountryField(
        default="IT",
        verbose_name="Paese",
    )
    hq_latitude = models.DecimalField(
        max_digits=9, decimal_places=6,
        default=44.7631,
        verbose_name="Latitudine sede",
    )
    hq_longitude = models.DecimalField(
        max_digits=9, decimal_places=6,
        default=8.7873,
        verbose_name="Longitudine sede",
    )

    # --- Social URLs ---
    facebook_url = models.URLField(blank=True, verbose_name="Facebook")
    instagram_url = models.URLField(blank=True, verbose_name="Instagram")
    youtube_url = models.URLField(blank=True, verbose_name="YouTube")
    spotify_url = models.URLField(blank=True, verbose_name="Spotify")

    # --- API Keys e configurazioni tecniche ---
    gemini_api_key = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="Gemini API Key",
        help_text="Chiave API Google Gemini per traduzioni automatiche e BandFinder.",
    )
    nominatim_user_agent = models.CharField(
        max_length=100,
        default="magixpromotion",
        verbose_name="Nominatim User-Agent",
        help_text="User agent per le richieste a Nominatim/OSM.",
    )

    # --- Pannelli Admin ---
    panels = [
        MultiFieldPanel(
            [
                FieldPanel("company_name"),
                FieldPanel("vat_number"),
                FieldPanel("phone"),
                FieldPanel("email"),
            ],
            heading="Dati aziendali",
        ),
        MultiFieldPanel(
            [
                FieldPanel("address"),
                FieldPanel("city"),
                FieldPanel("province"),
                FieldPanel("zip_code"),
                FieldPanel("country"),
                FieldPanel("hq_latitude"),
                FieldPanel("hq_longitude"),
            ],
            heading="Sede legale",
        ),
        MultiFieldPanel(
            [
                FieldPanel("facebook_url"),
                FieldPanel("instagram_url"),
                FieldPanel("youtube_url"),
                FieldPanel("spotify_url"),
            ],
            heading="Social media",
        ),
        MultiFieldPanel(
            [
                FieldPanel("gemini_api_key"),
                FieldPanel("nominatim_user_agent"),
            ],
            heading="Configurazioni tecniche (non traducibili)",
        ),
    ]

    class Meta:
        verbose_name = "Impostazioni Magix Promotion"
```

### 5. Geocoding Helper (core/geocoding.py)

```python
# core/geocoding.py
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
            logger.info(f"Geocodificato: {address} -> ({location.latitude}, {location.longitude})")
            return (location.latitude, location.longitude)
        
        logger.warning(f"Indirizzo non trovato: {address}")
        return None
    except (GeocoderTimedOut, GeocoderServiceError) as e:
        logger.error(f"Errore geocoding Nominatim: {e}")
        return None
```

---

## CRITERI DI ACCETTAZIONE

- [ ] `python manage.py makemigrations artists events core` genera migrazioni
- [ ] `python manage.py migrate` applica senza errori
- [ ] Genre visibile nel pannello Snippets → "Generi musicali"
- [ ] Venue visibile nel pannello Snippets → "Venues"
- [ ] Venue supporta paesi internazionali (campo `country` con CountryField)
- [ ] Venue.region è testo libero (no REGION_CHOICES)
- [ ] Promoter visibile nel pannello Snippets → "Promoters"
- [ ] Genre.slug auto-generato se vuoto
- [ ] Venue mostra pannello "Localizzazione" raggruppato
- [ ] MagixSiteSettings visibile in Wagtail Settings
- [ ] MagixSiteSettings mostra dati default (Novi Ligure, telefono, email)
- [ ] Geocoding Nominatim funziona (`Venue.geocode_with_nominatim()`)
- [ ] `Venue.navigation_url` genera URL valido per Google Maps / Apple Maps

---

## SEZIONE TDD

> **Prima di implementare**, scrivere i test seguenti:

```python
# tests/test_snippets.py
import pytest
from unittest.mock import patch, MagicMock

@pytest.mark.django_db
class TestVenueInternational:
    def test_venue_default_country_IT(self):
        from events.models import Venue
        v = Venue(name="Test", city="Milano")
        assert v.country.code == "IT"

    def test_venue_foreign_country(self):
        from events.models import Venue
        v = Venue(name="Berghain", city="Berlin", country="DE", region="Brandenburg")
        v.save()
        assert v.country.code == "DE"
        assert "DE" in str(v)

    def test_venue_full_address(self):
        from events.models import Venue
        v = Venue(name="Test", address="Via Roma 1", city="Milano", province="MI", zip_code="20100", country="IT")
        assert "Via Roma 1" in v.full_address
        assert "Italy" in v.full_address or "Italia" in v.full_address

    def test_venue_navigation_url_with_coords(self):
        from events.models import Venue
        v = Venue(name="Test", city="Milano", latitude=45.46, longitude=9.19)
        url = v.navigation_url
        assert "google.com/maps" in url
        assert "45.46" in url

    @patch("core.geocoding.Nominatim")
    def test_geocode_nominatim(self, mock_nominatim):
        mock_geolocator = MagicMock()
        mock_location = MagicMock()
        mock_location.latitude = 44.7631
        mock_location.longitude = 8.7873
        mock_geolocator.geocode.return_value = mock_location
        mock_nominatim.return_value = mock_geolocator

        from core.geocoding import nominatim_geocode
        coords = nominatim_geocode("Via dello Scabiolo, Novi Ligure")
        assert coords is not None
        assert abs(coords[0] - 44.7631) < 0.01

@pytest.mark.django_db
class TestMagixSiteSettings:
    def test_default_phone(self):
        from core.models import MagixSiteSettings
        s = MagixSiteSettings()
        assert s.phone == "+39 335 523 0855"

    def test_default_city(self):
        from core.models import MagixSiteSettings
        s = MagixSiteSettings()
        assert s.city == "Novi Ligure"
```

---

## SECURITY CHECKLIST

- [ ] Nominatim user-agent configurabile (non hardcodare)
- [ ] Rate limit Nominatim rispettato (1 req/sec)
- [ ] `gemini_api_key` nel SiteSettings non esposto via API pubblica
- [ ] Promoter dati riservati: verificare che NON siano esposti via API
- [ ] Input validazione su campi CharField (max_length rispettati)
