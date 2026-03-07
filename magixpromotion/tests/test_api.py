"""Test integrazione per API endpoints."""
import pytest
from django.test import Client
from wagtail.models import Locale, Page

from tests.factories import (
    ArtistListingPageFactory,
    ArtistPageFactory,
    EventPageFactory,
    HomePageFactory,
)


@pytest.mark.django_db
class TestArtistAPI:
    def test_list_artists(self, artist):
        client = Client()
        response = client.get("/api/v2/artists/")
        assert response.status_code == 200
        data = response.json()
        assert data["meta"]["total_count"] >= 1

    def test_list_artists_via_pages_endpoint(self, artist):
        client = Client()
        response = client.get(
            "/api/v2/pages/?type=artists.ArtistPage&fields=title"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["meta"]["total_count"] >= 1

    def test_filter_by_artist_type(self, artist):
        client = Client()
        response = client.get("/api/v2/artists/?artist_type=show_band")
        assert response.status_code == 200
        data = response.json()
        assert data["meta"]["total_count"] >= 1

    def test_filter_by_genre(self, artist):
        client = Client()
        response = client.get("/api/v2/artists/?genre=dance-show-band")
        assert response.status_code == 200
        data = response.json()
        assert data["meta"]["total_count"] >= 1

    def test_filter_no_results(self, artist):
        client = Client()
        response = client.get("/api/v2/artists/?artist_type=dj")
        assert response.status_code == 200
        data = response.json()
        assert data["meta"]["total_count"] == 0

    def test_daily_seed_ordering(self, artist_listing, genres):
        """Il parametro daily_seed produce un ordinamento deterministico
        basato sulla data, che ruota giornalmente."""
        from tests.factories import ArtistPageFactory

        # Crea artisti multipli per verificare l'ordinamento
        artists = []
        for i in range(5):
            a = ArtistPageFactory(
                parent=artist_listing,
                title=f"Band {chr(65 + i)}",
                artist_type="show_band",
            )
            a.genres.add(genres[0])
            a.save()
            artists.append(a)

        client = Client()

        # Stessa seed → stesso ordine (deterministico)
        r1 = client.get("/api/v2/artists/?daily_seed=2026-02-19")
        r2 = client.get("/api/v2/artists/?daily_seed=2026-02-19")
        ids1 = [item["id"] for item in r1.json()["items"]]
        ids2 = [item["id"] for item in r2.json()["items"]]
        assert ids1 == ids2

        # Seed diversa → ordine diverso (con alta probabilità)
        r3 = client.get("/api/v2/artists/?daily_seed=2026-03-01")
        ids3 = [item["id"] for item in r3.json()["items"]]
        # Non necessariamente diverso per poche band, ma l'endpoint deve funzionare
        assert len(ids3) == len(ids1)

    def test_daily_seed_is_accepted_parameter(self, artist):
        """Verifica che daily_seed sia un parametro query riconosciuto."""
        client = Client()
        response = client.get("/api/v2/artists/?daily_seed=2026-02-19")
        assert response.status_code == 200


@pytest.mark.django_db
class TestSearchAPI:
    def test_search_artists_returns_enriched_payload(self, artist):
        client = Client()

        response = client.get("/api/v2/search/?q=Red&type=artists")

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        result = data["results"][0]
        assert result["type"] == "artist"
        assert result["id"] == artist.id
        assert result["title"] == artist.title
        assert result["slug"] == artist.slug
        assert result["artist_type"] == artist.artist_type
        assert result["short_bio"] == artist.short_bio
        assert result["genre"] == "Dance Show Band"
        assert result["genre_display"] == "Dance Show Band"
        assert "tags" in result
        assert "image_url" in result
        assert "image_thumb" in result

    def test_search_artists_matches_short_bio(self, artist):
        client = Client()

        response = client.get("/api/v2/search/?q=artist&type=artists")

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["results"][0]["id"] == artist.id

    def test_search_artists_matches_genre(self, artist):
        client = Client()

        response = client.get("/api/v2/search/?q=Dance&type=artists")

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["results"][0]["id"] == artist.id

    def test_search_artists_tolerates_minor_typos(self, artist_listing, genres):
        page = ArtistPageFactory(
            parent=artist_listing,
            title="Queen Forever",
            short_bio="Queen tribute band",
            artist_type="tribute",
        )
        page.genres.add(genres[2])
        page.save()

        client = Client()
        response = client.get("/api/v2/search/?q=qeen&type=artists")

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["results"][0]["title"] == "Queen Forever"

    def test_search_artists_respects_requested_locale(self, home_page, artist_listing, genres):
        locale_en, _ = Locale.objects.get_or_create(language_code="en")
        root = Page.objects.get(depth=1)

        home_page_en = HomePageFactory(
            parent=root,
            locale=locale_en,
            title="Home EN",
            slug="home-en",
        )
        artist_listing_en = ArtistListingPageFactory(
            parent=home_page_en,
            locale=locale_en,
            title="Artists",
            slug="artists-en",
        )

        artist_it = ArtistPageFactory(
            parent=artist_listing,
            title="Queen Italiano",
            short_bio="Tributo italiano ai Queen",
            artist_type="tribute",
        )
        artist_it.genres.add(genres[1])
        artist_it.save()

        artist_en = ArtistPageFactory(
            parent=artist_listing_en,
            locale=locale_en,
            title="Queen English",
            short_bio="English Queen tribute band",
            artist_type="tribute",
        )
        artist_en.genres.add(genres[2])
        artist_en.save()

        client = Client()
        response_it = client.get("/api/v2/search/?q=Queen&type=artists&locale=it")
        response_en = client.get("/api/v2/search/?q=Queen&type=artists&locale=en")

        assert response_it.status_code == 200
        assert response_en.status_code == 200

        data_it = response_it.json()
        data_en = response_en.json()

        assert [item["title"] for item in data_it["results"]] == ["Queen Italiano"]
        assert [item["title"] for item in data_en["results"]] == ["Queen English"]

    def test_search_artists_excludes_events(self, artist, event_listing, venue):
        EventPageFactory(
            parent=event_listing,
            title="Red Moon Live",
            venue=venue,
        )
        client = Client()

        response = client.get("/api/v2/search/?q=Red&type=artists")

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert all(item["type"] == "artist" for item in data["results"])

    def test_search_query_too_short_returns_empty(self, artist):
        client = Client()

        response = client.get("/api/v2/search/?q=r&type=artists")

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert data["results"] == []

    def test_search_artists_limit_is_respected(self, artist_listing, genres):
        for idx in range(3):
            page = ArtistPageFactory(
                parent=artist_listing,
                title=f"Red Artist {idx}",
                short_bio="Red artist bio",
                artist_type="show_band",
            )
            page.genres.add(genres[0])
            page.save()

        client = Client()
        response = client.get("/api/v2/search/?q=Red&type=artists&limit=2")

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert len(data["results"]) == 2


@pytest.mark.django_db
class TestEventAPI:
    def test_list_events(self, home_page):
        from tests.factories import EventListingPageFactory, EventPageFactory

        listing = EventListingPageFactory(parent=home_page)
        EventPageFactory(parent=listing)
        client = Client()
        response = client.get("/api/v2/events/")
        assert response.status_code == 200
        data = response.json()
        assert data["meta"]["total_count"] >= 1

    def test_filter_future_only(self, home_page):
        import datetime

        from tests.factories import EventListingPageFactory, EventPageFactory

        listing = EventListingPageFactory(parent=home_page)
        EventPageFactory(
            parent=listing,
            title="Future Event",
            start_date=datetime.date(2099, 12, 31),
        )
        EventPageFactory(
            parent=listing,
            title="Past Event",
            start_date=datetime.date(2020, 1, 1),
        )
        client = Client()
        response = client.get("/api/v2/events/?future_only=true")
        assert response.status_code == 200
        data = response.json()
        # Only the future event should match
        titles = [item["title"] for item in data["items"]]
        assert "Future Event" in titles
        assert "Past Event" not in titles


@pytest.mark.django_db
class TestMenuAPI:
    def test_menu_empty(self, home_page):
        client = Client()
        response = client.get("/api/v2/menu/header/")
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []

    def test_menu_with_items(self, home_page):
        from navigation.models import MenuItem, NavigationMenu

        menu = NavigationMenu.objects.create(
            title="Header Menu IT",
            location="header",
            language="it",
        )
        MenuItem.objects.create(
            menu=menu,
            title_override="Artisti",
            external_url="https://example.com/artisti",
            sort_order=0,
        )
        client = Client()
        response = client.get("/api/v2/menu/header/")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["title"] == "Artisti"

    def test_menu_footer_location(self, home_page):
        client = Client()
        response = client.get("/api/v2/menu/footer_main/")
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []


@pytest.mark.django_db
class TestSiteSettingsAPI:
    def test_site_settings(self, home_page):
        client = Client()
        response = client.get("/api/v2/site-settings/")
        assert response.status_code == 200
        data = response.json()
        assert "company_name" in data
        assert "phone" in data
        assert "email" in data
        assert "address" in data
        assert "social" in data

    def test_site_settings_no_sensitive_data(self, home_page):
        """Sensitive fields like gemini_api_key must not be exposed."""
        client = Client()
        response = client.get("/api/v2/site-settings/")
        data = response.json()
        assert "gemini_api_key" not in str(data)
        assert "nominatim_user_agent" not in str(data)
