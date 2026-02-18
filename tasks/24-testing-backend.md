# TASK 24 — Testing Backend (pytest + factory_boy)

> **Agente:** Backend  
> **Fase:** 6 — Testing & Deploy  
> **Dipendenze:** Task 01-12 (backend completato)  
> **Stima:** 35 min  

---

## OBIETTIVO

Creare una test suite completa per il backend Django/Wagtail coprendo:
1. Models (snippet + page) — unit test
2. API endpoints — integration test
3. Form booking — form validation test
4. Management command CSV import — test con fixture
5. Celery tasks — test con mock

---

## FILES_IN_SCOPE (da leggere)

- `idea/4-dev-guidelines.md` — Sezione testing

---

## OUTPUT_ATTESO

```
config/settings/
├── test.py                    # Settings per test
tests/
├── conftest.py                # Fixture globali (pytest + factory_boy)
├── factories.py               # Factory per modelli
├── test_models.py             # Test modelli snippet + page
├── test_api.py                # Test API endpoints
├── test_booking.py            # Test form booking
├── test_csv_import.py         # Test management command
├── test_tasks.py              # Test Celery tasks
├── fixtures/
│   └── test_bands.csv         # CSV di test
pytest.ini                     # Configurazione pytest
```

---

## SPECIFICHE

### 1. requirements-test.txt

```
pytest==8.3.0
pytest-django==4.9.0
factory-boy==3.3.0
wagtail-factories==4.2.0
pytest-cov==6.0.0
freezegun==1.4.0
```

### 2. pytest.ini

```ini
[pytest]
DJANGO_SETTINGS_MODULE = config.settings.test
python_files = tests/test_*.py
python_classes = Test*
python_functions = test_*
addopts = --reuse-db --tb=short -q
markers =
    slow: marks tests as slow
```

### 3. config/settings/test.py

```python
"""Settings per test — database SQLite, niente Redis."""
from .base import *  # noqa

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# Disabilita cache in test
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

# Disabilita Celery in test
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Password hasher veloce per test
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

# Email backend test
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# Wagtail search backend semplice
WAGTAILSEARCH_BACKENDS = {
    "default": {
        "BACKEND": "wagtail.search.backends.database",
    }
}
```

### 4. conftest.py — Fixture globali

```python
"""Fixture globali pytest per il progetto Magix Promotion."""
import pytest
from wagtail.models import Page, Site
from tests.factories import (
    GenreFactory,
    VenueFactory,
    ArtistPageFactory,
    EventPageFactory,
    HomePageFactory,
)


@pytest.fixture
def home_page(db):
    """Crea una HomePage come root del sito."""
    root = Page.objects.get(depth=1)
    home = HomePageFactory(parent=root)
    Site.objects.update_or_create(
        is_default_site=True,
        defaults={"root_page": home, "hostname": "localhost"},
    )
    return home


@pytest.fixture
def genres(db):
    """Crea i generi standard."""
    return [
        GenreFactory(name="Dance Show Band"),
        GenreFactory(name="Tributo Italiano"),
        GenreFactory(name="Tributo Internazionale"),
        GenreFactory(name="Rock Band"),
    ]


@pytest.fixture
def venue(db):
    """Crea un venue di test."""
    return VenueFactory(
        name="Blackhorse Pub",
        city="Termenate",
        region="Lombardia",
        country="IT",
    )


@pytest.fixture
def artist_listing(home_page):
    """Crea una ArtistListingPage sotto la home."""
    from tests.factories import ArtistListingPageFactory
    return ArtistListingPageFactory(parent=home_page)


@pytest.fixture
def artist(artist_listing, genres):
    """Crea un ArtistPage di test."""
    page = ArtistPageFactory(
        parent=artist_listing,
        title="Red Moon",
        artist_type="band",
    )
    page.genres.add(genres[0])
    page.save()
    return page
```

### 5. factories.py

```python
"""Factory Boy factories per modelli Wagtail."""
import factory
import wagtail_factories
from core.models import HomePage
from artists.models import ArtistListingPage, ArtistPage
from events.models import EventListingPage, EventPage
from core.models import Genre, Venue


class GenreFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Genre
        django_get_or_create = ("name",)

    name = factory.Sequence(lambda n: f"Genre {n}")
    slug = factory.LazyAttribute(lambda o: o.name.lower().replace(" ", "-"))


class VenueFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Venue

    name = factory.Sequence(lambda n: f"Venue {n}")
    city = "Milano"
    region = "Lombardia"
    country = "IT"
    zip_code = "20100"


class HomePageFactory(wagtail_factories.PageFactory):
    class Meta:
        model = HomePage

    title = "Home"
    slug = "home"


class ArtistListingPageFactory(wagtail_factories.PageFactory):
    class Meta:
        model = ArtistListingPage

    title = "Artisti"
    slug = "artisti"


class ArtistPageFactory(wagtail_factories.PageFactory):
    class Meta:
        model = ArtistPage

    title = factory.Sequence(lambda n: f"Band {n}")
    slug = factory.LazyAttribute(lambda o: o.title.lower().replace(" ", "-"))
    bio = "Test bio for the artist."
    artist_type = "band"
    # ⚠️ T27 (§L482–600): aggiungere managing_group come parametro opzionale
    # per i test di isolamento per-band. Default None (solo staff).
    managing_group = None


class EventListingPageFactory(wagtail_factories.PageFactory):
    class Meta:
        model = EventListingPage

    title = "Eventi"
    slug = "eventi"


class EventPageFactory(wagtail_factories.PageFactory):
    class Meta:
        model = EventPage

    title = factory.Sequence(lambda n: f"Evento {n}")
    slug = factory.LazyAttribute(lambda o: o.title.lower().replace(" ", "-"))
    date_start = factory.LazyFunction(lambda: __import__("datetime").date.today())
    status = "confirmed"
```

### 6. test_models.py

```python
"""Test unitari per modelli snippet e page."""
import pytest
from tests.factories import GenreFactory, ArtistPageFactory, VenueFactory


@pytest.mark.django_db
class TestGenre:
    def test_str(self):
        genre = GenreFactory(name="Rock Band")
        assert str(genre) == "Rock Band"

    def test_slug_auto(self):
        genre = GenreFactory(name="Dance Show Band")
        assert genre.slug == "dance-show-band"


@pytest.mark.django_db
class TestVenue:
    def test_str(self, venue):
        assert "Blackhorse" in str(venue)

    def test_country_default_it(self, venue):
        assert str(venue.country) == "IT"

    def test_full_address(self, venue):
        addr = venue.full_address
        assert "Termenate" in addr

    def test_international_venue(self):
        v = VenueFactory(name="Club Zürich", city="Zürich", country="CH", region="Zürich")
        assert str(v.country) == "CH"
        assert v.region == "Zürich"


@pytest.mark.django_db
class TestArtistPage:
    def test_creation(self, artist):
        assert artist.title == "Red Moon"
        assert artist.artist_type == "band"

    def test_genres(self, artist):
        assert artist.genres.count() == 1
        assert artist.genres.first().name == "Dance Show Band"

    def test_bio_not_empty(self, artist):
        assert len(artist.bio) > 0
```

### 7. test_api.py

```python
"""Test integrazione per API endpoints."""
import pytest
from django.test import Client


@pytest.mark.django_db
class TestArtistAPI:
    def test_list_artists(self, artist):
        client = Client()
        response = client.get("/api/v2/pages/?type=artists.ArtistPage&fields=*")
        assert response.status_code == 200
        data = response.json()
        assert data["meta"]["total_count"] >= 1

    def test_filter_by_type(self, artist):
        client = Client()
        response = client.get("/api/v2/pages/?type=artists.ArtistPage&artist_type=band")
        assert response.status_code == 200


@pytest.mark.django_db
class TestMenuAPI:
    def test_menu_empty(self):
        client = Client()
        response = client.get("/api/v2/menu/header/")
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []


@pytest.mark.django_db
class TestSearchAPI:
    def test_search_empty_query(self):
        client = Client()
        response = client.get("/api/v2/search/?q=")
        assert response.status_code == 200
        data = response.json()
        assert data["results"] == []

    def test_search_min_length(self):
        client = Client()
        response = client.get("/api/v2/search/?q=a")
        data = response.json()
        assert data["results"] == []
```

### 8. test_booking.py

```python
"""Test per il form di booking."""
import pytest
from django.core import mail
from django.test import Client


@pytest.mark.django_db
class TestBookingForm:
    def test_submit_valid(self, home_page):
        client = Client()
        data = {
            "nome": "Mario Rossi",
            "email": "mario@test.com",
            "artista": "Red Moon",
            "tipo_evento": "matrimonio",
            "data_evento": "2025-09-15",
            "luogo": "Como",
            "privacy": True,
        }
        response = client.post("/api/v2/booking/submit/", data, content_type="application/json")
        assert response.status_code in (200, 201)

    def test_submit_missing_email(self, home_page):
        client = Client()
        data = {
            "nome": "Mario Rossi",
            "artista": "Red Moon",
            "tipo_evento": "matrimonio",
            "data_evento": "2025-09-15",
            "luogo": "Como",
            "privacy": True,
        }
        response = client.post("/api/v2/booking/submit/", data, content_type="application/json")
        assert response.status_code == 400

    def test_submit_no_privacy(self, home_page):
        client = Client()
        data = {
            "nome": "Mario Rossi",
            "email": "mario@test.com",
            "artista": "Red Moon",
            "tipo_evento": "matrimonio",
            "data_evento": "2025-09-15",
            "luogo": "Como",
            "privacy": False,
        }
        response = client.post("/api/v2/booking/submit/", data, content_type="application/json")
        assert response.status_code == 400
```

### 9. test_csv_import.py

```python
"""Test per il management command di import CSV."""
import pytest
from io import StringIO
from django.core.management import call_command


@pytest.fixture
def csv_content():
    return (
        "Band Name,Musical genre,Bio,Video Promo Youtube,Tour,Richiesta Preventivo\n"
        'Red Moon,Dance Show Band,Una band energica.,https://www.youtube.com/watch?v=abc,,\n'
        'iPop,Dance Show Band,"iPop è la festa definitiva.",ttps://www.youtube.com/watch?v=def,,\n'
    )


@pytest.mark.django_db
class TestCSVImport:
    def test_dry_run(self, home_page, artist_listing, csv_content, tmp_path):
        csv_file = tmp_path / "test.csv"
        csv_file.write_text(csv_content)

        out = StringIO()
        call_command("import_artists_csv", str(csv_file), "--dry-run", stdout=out)
        output = out.getvalue()
        assert "DRY RUN" in output or "Red Moon" in output

    def test_import_creates_artists(self, home_page, artist_listing, csv_content, tmp_path):
        from artists.models import ArtistPage

        csv_file = tmp_path / "test.csv"
        csv_file.write_text(csv_content)
        
        initial_count = ArtistPage.objects.count()
        call_command("import_artists_csv", str(csv_file))
        assert ArtistPage.objects.count() == initial_count + 2

    def test_youtube_url_fix(self, home_page, artist_listing, csv_content, tmp_path):
        from artists.models import ArtistPage

        csv_file = tmp_path / "test.csv"
        csv_file.write_text(csv_content)

        call_command("import_artists_csv", str(csv_file))
        ipop = ArtistPage.objects.get(title="iPop")
        assert ipop.hero_video_url.startswith("https://")
```

### 10. test_tasks.py

```python
"""Test per i task Celery."""
import pytest
from datetime import date, timedelta
from freezegun import freeze_time


@pytest.mark.django_db
class TestArchiveTask:
    @freeze_time("2025-07-15")
    def test_archive_past_events(self, home_page):
        from tests.factories import EventListingPageFactory, EventPageFactory
        from events.tasks import archive_past_events

        listing = EventListingPageFactory(parent=home_page)
        # Evento passato
        past = EventPageFactory(
            parent=listing,
            date_start=date(2025, 7, 10),
            is_archived=False,
        )
        # Evento futuro
        future = EventPageFactory(
            parent=listing,
            date_start=date(2025, 7, 20),
            is_archived=False,
        )

        archive_past_events()

        past.refresh_from_db()
        future.refresh_from_db()
        assert past.is_archived is True
        assert future.is_archived is False
```

### 11. Test fixture CSV

```csv
# tests/fixtures/test_bands.csv
Band Name,Musical genre,Bio,Video Promo Youtube,Tour,Richiesta Preventivo
Test Band 1,Dance Show Band,Bio test 1.,https://youtube.com/watch?v=test1,,
Test Band 2,Tributo Italiano,Bio test 2.,ttps://youtube.com/watch?v=test2,,
Test Band 3,Rock Band,Bio test 3.,,,
```

---

## CRITERI DI ACCETTAZIONE

- [ ] `pytest` esegue tutti i test senza errori
- [ ] Test models: Genre, Venue (con country), ArtistPage, EventPage
- [ ] Test Venue internazionale (country CH, DE, etc.)
- [ ] Test API: list artisti, filtri, menu, search, site-settings
- [ ] Test booking: valid, invalid, missing fields
- [ ] Test CSV import: dry-run, creazione, URL fix
- [ ] Test Celery: archiviazione eventi passati
- [ ] `pytest --cov` mostra coverage ≥ 70%
- [ ] Test settings usano SQLite in-memory
- [ ] Factory Boy configurato per tutti i modelli
- [ ] `freezegun` usato per test time-dependent
- [ ] T27: Fixture `band_group`, `collaborator`, `staff_user` integrate in `conftest.py` (T27 §L482–600)
- [ ] T27: Test isolamento per-band (`_user_can_edit_page`) e workflow approvazione (T27 §L600–722)
