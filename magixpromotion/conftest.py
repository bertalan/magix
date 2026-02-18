"""Fixture globali pytest per il progetto Magix Promotion."""
import pytest
from wagtail.models import Page, Site

from tests.factories import (
    ArtistListingPageFactory,
    ArtistPageFactory,
    EventListingPageFactory,
    GenreFactory,
    HomePageFactory,
    VenueFactory,
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
    return ArtistListingPageFactory(parent=home_page)


@pytest.fixture
def event_listing(home_page):
    """Crea una EventListingPage sotto la home."""
    return EventListingPageFactory(parent=home_page)


@pytest.fixture
def artist(artist_listing, genres):
    """Crea un ArtistPage di test."""
    page = ArtistPageFactory(
        parent=artist_listing,
        title="Red Moon",
        artist_type="show_band",
    )
    page.genres.add(genres[0])
    page.save()
    return page
