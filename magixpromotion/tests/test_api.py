"""Test integrazione per API endpoints."""
import pytest
from django.test import Client


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
