"""Factory Boy factories per modelli Wagtail."""
import datetime

import factory
import wagtail_factories
from django.utils.text import slugify

from artists.models import ArtistListingPage, ArtistPage, Genre, TargetEvent
from core.models import HomePage
from events.models import EventListingPage, EventPage, Promoter, Venue


class GenreFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Genre
        django_get_or_create = ("name",)

    name = factory.Sequence(lambda n: f"Genre {n}")
    slug = factory.LazyAttribute(lambda o: slugify(o.name))


class TargetEventFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = TargetEvent
        django_get_or_create = ("name",)

    name = factory.Sequence(lambda n: f"Evento Target {n}")
    slug = factory.LazyAttribute(lambda o: slugify(o.name))


class VenueFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Venue

    name = factory.Sequence(lambda n: f"Venue {n}")
    city = "Milano"
    region = "Lombardia"
    country = "IT"
    zip_code = "20100"


class PromoterFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Promoter

    company_name = factory.Sequence(lambda n: f"Promoter {n}")
    contact_name = "Mario Rossi"
    email = factory.LazyAttribute(
        lambda o: f"{o.company_name.lower().replace(' ', '')}@test.com"
    )


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
    slug = factory.LazyAttribute(lambda o: slugify(o.title))
    short_bio = "Test bio for the artist."
    artist_type = "show_band"
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
    slug = factory.LazyAttribute(lambda o: slugify(o.title))
    start_date = factory.LazyFunction(lambda: datetime.date.today())
    status = "confirmed"
