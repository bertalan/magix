"""Test suite per la generazione JSON-LD SEO e vista robots.txt."""
import json

import pytest
from django.test import RequestFactory

from tests.factories import (
    ArtistPageFactory,
    EventListingPageFactory,
    EventPageFactory,
    VenueFactory,
)


# ---- Homepage JSON-LD ----


@pytest.mark.django_db
class TestHomepageJsonLD:
    """Verifica la generazione JSON-LD EntertainmentBusiness."""

    def test_returns_valid_json(self, home_page):
        from core.seo import homepage_jsonld

        data = json.loads(homepage_jsonld())
        assert data["@context"] == "https://schema.org"
        assert data["@type"] == "EntertainmentBusiness"

    def test_contains_company_name(self, home_page):
        from core.seo import homepage_jsonld

        data = json.loads(homepage_jsonld())
        assert len(data["name"]) > 0

    def test_contains_real_phone(self, home_page):
        from core.seo import homepage_jsonld

        data = json.loads(homepage_jsonld())
        assert "XXX" not in data.get("telephone", "")
        assert len(data.get("telephone", "")) > 5

    def test_contains_address_fields(self, home_page):
        from core.seo import homepage_jsonld

        data = json.loads(homepage_jsonld())
        addr = data["address"]
        assert addr["@type"] == "PostalAddress"
        assert addr["addressCountry"] in ("IT", "it")
        assert len(addr.get("streetAddress", "")) > 0
        assert len(addr.get("addressLocality", "")) > 0

    def test_no_api_keys_exposed(self, home_page):
        from core.seo import homepage_jsonld

        raw = homepage_jsonld()
        assert "gemini" not in raw.lower()
        assert "api_key" not in raw.lower()

    def test_url_uses_correct_domain(self, home_page):
        from core.seo import homepage_jsonld

        data = json.loads(homepage_jsonld())
        # Non deve usare il vecchio dominio .it
        assert ".it" not in data["url"] or "magixpromotion.it" not in data["url"]


# ---- Artist JSON-LD ----


@pytest.mark.django_db
class TestArtistJsonLD:
    """Verifica la generazione JSON-LD MusicGroup."""

    def test_returns_valid_json(self, artist):
        from artists.seo import artist_jsonld

        data = json.loads(artist_jsonld(artist))
        assert data["@context"] == "https://schema.org"
        assert data["@type"] == "MusicGroup"

    def test_contains_artist_name(self, artist):
        from artists.seo import artist_jsonld

        data = json.loads(artist_jsonld(artist))
        assert data["name"] == "Red Moon"

    def test_contains_genres(self, artist):
        from artists.seo import artist_jsonld

        data = json.loads(artist_jsonld(artist))
        assert isinstance(data["genre"], list)
        assert len(data["genre"]) > 0

    def test_description_truncated(self, artist):
        from artists.seo import artist_jsonld

        # Bio viene troncata a 200 caratteri
        artist.short_bio = "A" * 300
        artist.save()
        data = json.loads(artist_jsonld(artist))
        assert len(data["description"]) <= 200

    def test_social_urls_in_sameas(self, artist):
        from artists.seo import artist_jsonld

        artist.instagram_url = "https://instagram.com/test"
        artist.spotify_url = "https://open.spotify.com/test"
        artist.save()
        data = json.loads(artist_jsonld(artist))
        assert "https://instagram.com/test" in data["sameAs"]
        assert "https://open.spotify.com/test" in data["sameAs"]


# ---- Event JSON-LD ----


@pytest.mark.django_db
class TestEventJsonLD:
    """Verifica la generazione JSON-LD MusicEvent."""

    def test_returns_valid_json(self, event_listing):
        from events.seo import event_jsonld

        ev = EventPageFactory(parent=event_listing)
        data = json.loads(event_jsonld(ev))
        assert data["@context"] == "https://schema.org"
        assert data["@type"] == "MusicEvent"

    def test_venue_country_from_model(self, event_listing):
        """Il paese viene dal model, non hardcoded."""
        from events.seo import event_jsonld

        venue = VenueFactory(name="Zuri Stage", city="Zurigo", country="CH")
        ev = EventPageFactory(parent=event_listing, venue=venue)
        data = json.loads(event_jsonld(ev))
        assert data["location"]["address"]["addressCountry"] == "CH"

    def test_venue_geo_included(self, event_listing):
        from events.seo import event_jsonld

        venue = VenueFactory(
            name="Arena", city="Milano", latitude=45.46, longitude=9.19
        )
        ev = EventPageFactory(parent=event_listing, venue=venue)
        data = json.loads(event_jsonld(ev))
        assert data["location"]["geo"]["latitude"] == 45.46

    def test_cancelled_event_status(self, event_listing):
        from events.seo import event_jsonld

        ev = EventPageFactory(parent=event_listing, status="cancelled")
        data = json.loads(event_jsonld(ev))
        assert data["eventStatus"] == "https://schema.org/EventCancelled"

    def test_postponed_event_status(self, event_listing):
        from events.seo import event_jsonld

        ev = EventPageFactory(parent=event_listing, status="postponed")
        data = json.loads(event_jsonld(ev))
        assert data["eventStatus"] == "https://schema.org/EventPostponed"

    def test_sold_out_offers_availability(self, event_listing):
        from events.seo import event_jsonld

        ev = EventPageFactory(
            parent=event_listing,
            status="sold_out",
            ticket_url="https://tickets.example.com",
        )
        data = json.loads(event_jsonld(ev))
        assert data["offers"]["availability"] == "https://schema.org/SoldOut"

    def test_performer_included(self, event_listing, artist):
        from events.seo import event_jsonld

        ev = EventPageFactory(parent=event_listing, related_artist=artist)
        data = json.loads(event_jsonld(ev))
        assert data["performer"]["name"] == "Red Moon"
        assert data["performer"]["@type"] == "MusicGroup"

    def test_organizer_url_not_hardcoded_it(self, event_listing):
        """L'URL organizer non deve puntare al vecchio dominio .it."""
        from events.seo import event_jsonld

        ev = EventPageFactory(parent=event_listing)
        data = json.loads(event_jsonld(ev))
        assert "magixpromotion.it" not in data["organizer"]["url"]


# ---- Template Tag ----


@pytest.mark.django_db
class TestPageJsonLdTag:
    """Verifica il template tag page_jsonld."""

    def test_artist_page_generates_script(self, artist):
        from core.templatetags.seo_tags import page_jsonld

        result = page_jsonld({"page": artist})
        assert '<script type="application/ld+json">' in result
        assert "MusicGroup" in result

    def test_event_page_generates_script(self, event_listing):
        from core.templatetags.seo_tags import page_jsonld

        ev = EventPageFactory(parent=event_listing)
        result = page_jsonld({"page": ev})
        assert '<script type="application/ld+json">' in result
        assert "MusicEvent" in result

    def test_homepage_generates_script(self, home_page):
        from core.templatetags.seo_tags import page_jsonld

        result = page_jsonld({"page": home_page})
        assert '<script type="application/ld+json">' in result
        assert "EntertainmentBusiness" in result

    def test_unknown_page_returns_empty(self, home_page):
        """Pagine non mappate non generano JSON-LD."""
        from core.templatetags.seo_tags import page_jsonld

        result = page_jsonld({"page": None})
        assert result == ""


# ---- robots.txt ----


@pytest.mark.django_db
class TestRobotsTxt:
    """Verifica la vista robots.txt."""

    def test_robots_txt_returns_200(self, home_page, client):
        response = client.get("/robots.txt")
        assert response.status_code == 200
        assert response["Content-Type"] == "text/plain"

    def test_robots_txt_contains_sitemap(self, home_page, client):
        response = client.get("/robots.txt")
        content = response.content.decode()
        assert "Sitemap:" in content
        assert "sitemap.xml" in content

    def test_robots_txt_disallows_admin(self, home_page, client):
        response = client.get("/robots.txt")
        content = response.content.decode()
        assert "Disallow: /admin/" in content
        assert "Disallow: /api/" in content

    def test_robots_txt_allows_root(self, home_page, client):
        response = client.get("/robots.txt")
        content = response.content.decode()
        assert "Allow: /" in content
