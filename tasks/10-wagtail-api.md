# TASK 10 — Wagtail API v2 Configuration

> **Agente:** Backend  
> **Fase:** 3 — API & Integration  
> **Dipendenze:** Task 03, Task 04  
> **Stima:** 30 min  

---

## OBIETTIVO

Configurare Wagtail API v2 per esporre i contenuti (Artisti, Eventi, Snippet) al frontend React. L'API alimenta la SPA basata sul template-strutturale, sostituendo i dati mock con dati reali dal CMS.

---

## FILES_IN_SCOPE (da leggere)

- `idea/4-dev-guidelines.md` — sezione 4.3 (API vs Templates)
- `template-strutturale/types.ts` — interfacce TypeScript da mappare
- `template-strutturale/data/mockTalent.ts` — struttura dati mock da sostituire

---

## OUTPUT_ATTESO

```
config/
├── urls.py            # Aggiungere route API
core/
├── api.py             # Configurazione API endpoints + SiteSettings endpoint
artists/
├── api.py             # Serializer custom per ArtistPage
events/
├── api.py             # Serializer custom per EventPage
```

---

## SPECIFICHE

### 1. Registrazione API in urls.py

```python
# Aggiungere in config/urls.py
from wagtail.api.v2.views import PagesAPIViewSet
from wagtail.api.v2.router import WagtailAPIRouter
from wagtail.images.api.v2.views import ImagesAPIViewSet
from wagtail.documents.api.v2.views import DocumentsAPIViewSet

api_router = WagtailAPIRouter("wagtailapi")
api_router.register_endpoint("pages", PagesAPIViewSet)
api_router.register_endpoint("images", ImagesAPIViewSet)
api_router.register_endpoint("documents", DocumentsAPIViewSet)

# Custom endpoints
from artists.api import ArtistAPIViewSet
from events.api import EventAPIViewSet

api_router.register_endpoint("artists", ArtistAPIViewSet)
api_router.register_endpoint("events", EventAPIViewSet)

urlpatterns += [
    path("api/v2/", api_router.urls),
    # SiteSettings endpoint (dati aziendali pubblici)
    path("api/v2/site-settings/", include("core.api_urls")),
]
```

### 2. Custom ArtistAPIViewSet

```python
# artists/api.py
"""API endpoint custom per ArtistPage."""
from wagtail.api.v2.views import PagesAPIViewSet
from wagtail.api.v2.serializers import PageSerializer
from rest_framework.fields import Field

from .models import ArtistPage


class ArtistPageSerializer(PageSerializer):
    """
    Serializer che mappa ArtistPage → interfaccia Artist del frontend.
    
    Target TypeScript:
    {
      id: string,
      name: string,
      genre: string,
      imageUrl: string,
      bio: string,
      youtubeUrl?: string,
      socials: { instagram?, spotify?, twitter? },
      tags: string[],
      events: MusicEvent[],
      artistType: string,
      tributeTo?: string,
      baseRegion: string,
    }
    """


class GenreListField(Field):
    """Campo custom: lista nomi genere come stringa."""
    def get_attribute(self, instance):
        return instance

    def to_representation(self, page):
        return ", ".join(g.name for g in page.genres.all())


class TagsListField(Field):
    """Campo custom: tag combinati da generi + target events."""
    def get_attribute(self, instance):
        return instance

    def to_representation(self, page):
        tags = [g.name for g in page.genres.all()]
        if hasattr(page, "target_events"):
            tags += [t.name for t in page.target_events.all()]
        return tags


class SocialsField(Field):
    """Campo custom: oggetto social links."""
    def get_attribute(self, instance):
        return instance

    def to_representation(self, page):
        return {
            "instagram": page.instagram_url or None,
            "spotify": page.spotify_url or None,
            "facebook": page.facebook_url or None,
            "website": page.website_url or None,
        }


class ArtistEventsField(Field):
    """Campo custom: prossimi eventi dell'artista."""
    def get_attribute(self, instance):
        return instance

    def to_representation(self, page):
        from events.models import EventPage
        from django.utils import timezone

        events = (
            EventPage.objects.live()
            .filter(related_artist=page, start_date__gte=timezone.now().date())
            .order_by("start_date")[:10]
        )
        return [
            {
                "id": str(e.pk),
                "date": e.start_date.strftime("%d %b").upper(),
                "venue": e.venue.name if e.venue else "TBA",
                "city": e.venue.city if e.venue else "",
                "status": e.display_status,
            }
            for e in events
        ]


class ImageUrlField(Field):
    """Campo custom: URL rendition immagine principale."""
    def __init__(self, rendition_spec="fill-800x1200|format-webp", **kwargs):
        self.rendition_spec = rendition_spec
        super().__init__(**kwargs)

    def get_attribute(self, instance):
        return instance

    def to_representation(self, page):
        if not page.main_image:
            return None
        try:
            rendition = page.main_image.get_rendition(self.rendition_spec)
            return rendition.full_url
        except Exception:
            return None


class ArtistAPIViewSet(PagesAPIViewSet):
    """Endpoint API per gli artisti."""

    base_serializer_class = PageSerializer
    model = ArtistPage

    # ⚠️ T27 (§L735 Security Checklist): managing_group NON deve
    # apparire in body_fields né listing_default_fields.
    body_fields = PagesAPIViewSet.body_fields + [
        "short_bio",
        "artist_type",
        "tribute_to",
        "hero_video_url",
        "base_country",
        "base_region",
        "base_city",
        # managing_group ESCLUSO — campo admin-only (T27)
    ]

    listing_default_fields = PagesAPIViewSet.listing_default_fields + [
        "short_bio",
        "artist_type",
        "image_url",
        "genre_display",
        "tags",
        "socials",
    ]

    # Registra campi custom
    meta_fields = PagesAPIViewSet.meta_fields + []

    known_query_parameters = PagesAPIViewSet.known_query_parameters.union(
        {"artist_type", "genre", "region", "country"}
    )

    def get_serializer_class(self):
        """Aggiunge campi custom al serializer."""
        base = super().get_serializer_class()

        class CustomSerializer(base):
            image_url = ImageUrlField(read_only=True)
            genre_display = GenreListField(read_only=True)
            tags = TagsListField(read_only=True)
            socials = SocialsField(read_only=True)
            events = ArtistEventsField(read_only=True)

        return CustomSerializer

    def get_queryset(self):
        """Aggiunge filtri custom."""
        qs = super().get_queryset()
        
        artist_type = self.request.query_params.get("artist_type")
        if artist_type:
            qs = qs.filter(artist_type=artist_type)

        genre = self.request.query_params.get("genre")
        if genre:
            qs = qs.filter(genres__slug=genre)

        region = self.request.query_params.get("region")
        if region:
            qs = qs.filter(base_region__icontains=region)

        country = self.request.query_params.get("country")
        if country:
            qs = qs.filter(base_country=country)

        return qs.select_related("main_image").prefetch_related("genres", "target_events")
```

### 4. SiteSettings API (core/api.py + core/api_urls.py)

```python
# core/api.py
"""API endpoint per dati aziendali pubblici (MagixSiteSettings)."""
from django.http import JsonResponse
from wagtail.models import Site


def site_settings_view(request):
    """Ritorna i dati aziendali pubblici dal CMS.
    
    NOTA: Non esporre campi sensibili (gemini_api_key, nominatim_user_agent).
    """
    from core.models import MagixSiteSettings
    site = Site.find_for_request(request)
    settings = MagixSiteSettings.for_site(site)
    
    data = {
        "company_name": settings.company_name,
        "phone": settings.phone,
        "email": settings.email,
        "vat_number": settings.vat_number,
        "address": {
            "street": settings.address,
            "city": settings.city,
            "province": settings.province,
            "zip_code": settings.zip_code,
            "country": str(settings.country.code),
            "country_name": str(settings.country.name),
            "latitude": float(settings.hq_latitude) if settings.hq_latitude else None,
            "longitude": float(settings.hq_longitude) if settings.hq_longitude else None,
        },
        "social": {
            "facebook": settings.facebook_url or None,
            "instagram": settings.instagram_url or None,
            "youtube": settings.youtube_url or None,
            "spotify": settings.spotify_url or None,
        },
    }
    return JsonResponse(data)
```

```python
# core/api_urls.py
from django.urls import path
from .api import site_settings_view

urlpatterns = [
    path("", site_settings_view, name="site-settings-api"),
]
```
```

### 3. Custom EventAPIViewSet

```python
# events/api.py
"""API endpoint custom per EventPage."""
from wagtail.api.v2.views import PagesAPIViewSet
from .models import EventPage


class EventAPIViewSet(PagesAPIViewSet):
    """Endpoint API per gli eventi."""

    model = EventPage

    body_fields = PagesAPIViewSet.body_fields + [
        "start_date",
        "end_date",
        "doors_time",
        "start_time",
        "status",
        "ticket_url",
        "ticket_price",
        "description",
    ]

    listing_default_fields = PagesAPIViewSet.listing_default_fields + [
        "start_date",
        "status",
        "ticket_url",
        "ticket_price",
    ]

    known_query_parameters = PagesAPIViewSet.known_query_parameters.union(
        {"artist", "venue", "region", "country", "future_only"}
    )

    def get_queryset(self):
        qs = super().get_queryset()

        artist = self.request.query_params.get("artist")
        if artist:
            qs = qs.filter(related_artist__slug=artist)

        venue = self.request.query_params.get("venue")
        if venue:
            qs = qs.filter(venue_id=venue)

        region = self.request.query_params.get("region")
        if region:
            qs = qs.filter(venue__region__icontains=region)

        country = self.request.query_params.get("country")
        if country:
            qs = qs.filter(venue__country=country)

        future_only = self.request.query_params.get("future_only")
        if future_only == "true":
            from django.utils import timezone
            qs = qs.filter(start_date__gte=timezone.now().date())

        return qs.select_related("venue", "related_artist", "featured_image")
```

---

## ENDPOINT RISULTANTI

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `GET /api/v2/artists/` | LIST | Lista artisti con filtri |
| `GET /api/v2/artists/<id>/` | DETAIL | Dettaglio singolo artista |
| `GET /api/v2/artists/?artist_type=tribute` | LIST | Filtra per tipologia |
| `GET /api/v2/artists/?genre=dance-show-band` | LIST | Filtra per genere (slug) |
| `GET /api/v2/artists/?region=lombardia` | LIST | Filtra per regione (icontains) |
| `GET /api/v2/artists/?country=IT` | LIST | Filtra per paese (ISO code) |
| `GET /api/v2/events/` | LIST | Lista eventi |
| `GET /api/v2/events/?future_only=true` | LIST | Solo eventi futuri |
| `GET /api/v2/events/?artist=red-moon` | LIST | Eventi di un artista |
| `GET /api/v2/events/?country=DE` | LIST | Eventi in un paese specifico |
| `GET /api/v2/site-settings/` | GET | Dati aziendali pubblici (MagixSiteSettings) |
| `GET /api/v2/images/` | LIST | Immagini (nativo Wagtail) |

---

## NOTE IMPLEMENTATIVE

1. **CORS:** Aggiungere `django-cors-headers` per permettere al frontend React (porta 3000) di chiamare l'API Django (porta 8000). Aggiungere `CORS_ALLOWED_ORIGINS = ["http://localhost:3000"]` in dev settings.
2. **Performance:** `select_related` e `prefetch_related` nel queryset per evitare N+1.
3. **Promoter NON esposto:** I dati Promoter sono riservati. Non creare endpoint API per Promoter.
4. **Paginazione:** Wagtail API v2 supporta `?limit=` e `?offset=` nativamente.
5. **ImageUrlField:** Genera rendition on-the-fly. In produzione, pre-generare le rendition comuni.
6. **`managing_group` escluso (T27 §L735):** Il campo `managing_group` di ArtistPage è riservato all'admin. NON esporlo via API (`body_fields` o `listing_default_fields`). Vedi `tasks/27-permissions-workflow.md` §Security Checklist.

---

## CRITERI DI ACCETTAZIONE

- [ ] `GET /api/v2/artists/` ritorna JSON con lista artisti
- [ ] Ogni artista include: `image_url`, `genre_display`, `tags`, `socials`, `events`
- [ ] Filtro `?artist_type=tribute` funzionale
- [ ] Filtro `?genre=dance-show-band` funzionale
- [ ] Filtro `?country=IT` funzionale
- [ ] Filtro `?region=lombardia` (icontains) funzionale
- [ ] `GET /api/v2/events/?future_only=true` ritorna solo eventi futuri
- [ ] `GET /api/v2/events/?artist=red-moon` filtra per artista
- [ ] `GET /api/v2/events/?country=DE` filtra eventi per paese venue
- [ ] `GET /api/v2/site-settings/` ritorna dati aziendali senza campi sensibili
- [ ] CORS configurato per frontend dev (localhost:3000)
- [ ] Promoter NON accessibile via API
- [ ] `gemini_api_key` NON esposto nell'endpoint site-settings
- [ ] Nessun N+1 query (verificare con django-debug-toolbar)

---

## SEZIONE TDD

```python
# tests/test_api.py (integrare con test esistenti)
import pytest
from django.test import Client

@pytest.mark.django_db
class TestSiteSettingsAPI:
    def test_site_settings_returns_200(self):
        client = Client()
        response = client.get("/api/v2/site-settings/")
        assert response.status_code == 200

    def test_site_settings_contains_company_name(self):
        client = Client()
        response = client.get("/api/v2/site-settings/")
        data = response.json()
        assert "company_name" in data

    def test_site_settings_hides_api_keys(self):
        client = Client()
        response = client.get("/api/v2/site-settings/")
        data = response.json()
        assert "gemini_api_key" not in str(data)
        assert "nominatim_user_agent" not in str(data)

@pytest.mark.django_db
class TestArtistAPICountryFilter:
    def test_filter_by_country(self, artist):
        client = Client()
        response = client.get("/api/v2/artists/?country=IT")
        assert response.status_code == 200
```

---

## SECURITY CHECKLIST

- [ ] SiteSettings API NON espone `gemini_api_key` e `nominatim_user_agent`
- [ ] Promoter data NON accessibile via API
- [ ] CORS restrittivo (solo origini consentite)
- [ ] Rate limiting consigliato su endpoint API pubblici
- [ ] Query params validati/sanitizzati prima del filtro queryset
