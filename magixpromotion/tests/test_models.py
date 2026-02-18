"""Test unitari per modelli snippet e page."""
import datetime

import pytest

from tests.factories import (
    ArtistPageFactory,
    EventListingPageFactory,
    EventPageFactory,
    GenreFactory,
    PromoterFactory,
    TargetEventFactory,
    VenueFactory,
)


@pytest.mark.django_db
class TestGenre:
    def test_str(self):
        genre = GenreFactory(name="Rock Band")
        assert str(genre) == "Rock Band"

    def test_slug_auto(self):
        """Slug is auto-generated from name when not provided."""
        genre = GenreFactory.build(name="Dance Show Band", slug="")
        genre.save()
        assert genre.slug == "dance-show-band"

    def test_slug_unique(self):
        g1 = GenreFactory(name="Pop")
        g2 = GenreFactory(name="Jazz")
        assert g1.slug != g2.slug

    def test_ordering(self):
        GenreFactory(name="Zzz Genre")
        GenreFactory(name="Aaa Genre")
        from artists.models import Genre

        names = list(Genre.objects.values_list("name", flat=True))
        assert names == sorted(names)


@pytest.mark.django_db
class TestTargetEvent:
    def test_str(self):
        te = TargetEventFactory(name="Matrimonio")
        assert str(te) == "Matrimonio"

    def test_slug_auto(self):
        te = TargetEventFactory.build(name="Festa di Piazza", slug="")
        te.save()
        assert te.slug == "festa-di-piazza"


@pytest.mark.django_db
class TestVenue:
    def test_str(self, venue):
        assert "Blackhorse" in str(venue)
        assert "Termenate" in str(venue)

    def test_country_default_it(self, venue):
        assert str(venue.country) == "IT"

    def test_full_address(self, venue):
        addr = venue.full_address
        assert "Termenate" in addr

    def test_international_venue(self):
        v = VenueFactory(
            name="Club Zurich",
            city="Zurich",
            country="CH",
            region="Zurich",
        )
        assert str(v.country) == "CH"
        assert v.region == "Zurich"

    def test_navigation_url_without_coords(self, venue):
        url = venue.navigation_url
        assert "google.com/maps" in url

    def test_navigation_url_with_coords(self):
        v = VenueFactory(
            name="Venue GPS",
            city="Milano",
            latitude=45.4642,
            longitude=9.1900,
        )
        url = v.navigation_url
        assert "45.4642" in url
        assert "9.19" in url


@pytest.mark.django_db
class TestPromoter:
    def test_str(self):
        p = PromoterFactory(company_name="Live Nation IT")
        assert str(p) == "Live Nation IT"


@pytest.mark.django_db
class TestArtistPage:
    def test_creation(self, artist):
        assert artist.title == "Red Moon"
        assert artist.artist_type == "show_band"

    def test_genres(self, artist):
        assert artist.genres.count() == 1
        assert artist.genres.first().name == "Dance Show Band"

    def test_bio_not_empty(self, artist):
        assert len(artist.short_bio) > 0

    def test_str(self, artist):
        assert str(artist) == "Red Moon"

    def test_base_country_default(self, artist):
        assert str(artist.base_country) == "IT"


@pytest.mark.django_db
class TestEventPage:
    def test_creation(self, home_page, event_listing):
        event = EventPageFactory(
            parent=event_listing,
            title="Concerto Test",
            start_date=datetime.date(2026, 6, 15),
            status="confirmed",
        )
        assert event.title == "Concerto Test"
        assert event.status == "confirmed"

    def test_str(self, home_page, event_listing):
        event = EventPageFactory(
            parent=event_listing,
            start_date=datetime.date(2026, 1, 10),
        )
        result = str(event)
        assert "2026-01-10" in result

    def test_is_future(self, home_page, event_listing):
        future_event = EventPageFactory(
            parent=event_listing,
            start_date=datetime.date(2099, 12, 31),
        )
        assert future_event.is_future is True

    def test_is_past(self, home_page, event_listing):
        past_event = EventPageFactory(
            parent=event_listing,
            start_date=datetime.date(2020, 1, 1),
        )
        assert past_event.is_future is False

    def test_display_status_sold_out(self, home_page, event_listing):
        event = EventPageFactory(
            parent=event_listing,
            status="sold_out",
        )
        assert event.display_status == "SOLD OUT"

    def test_display_status_cancelled(self, home_page, event_listing):
        event = EventPageFactory(
            parent=event_listing,
            status="cancelled",
        )
        assert event.display_status == "CANCELLED"

    def test_display_status_free(self, home_page, event_listing):
        event = EventPageFactory(
            parent=event_listing,
            status="confirmed",
            ticket_price="Ingresso libero",
        )
        assert event.display_status == "FREE"

    def test_display_status_available(self, home_page, event_listing):
        event = EventPageFactory(
            parent=event_listing,
            status="confirmed",
            ticket_price="15 EUR",
        )
        assert event.display_status == "AVAILABLE"

    def test_with_venue(self, home_page, event_listing, venue):
        event = EventPageFactory(
            parent=event_listing,
            venue=venue,
        )
        assert event.venue.name == "Blackhorse Pub"

    def test_is_archived_default_false(self, home_page, event_listing):
        event = EventPageFactory(parent=event_listing)
        assert event.is_archived is False
