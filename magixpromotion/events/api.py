"""API endpoint custom per EventPage."""
from django.utils import timezone
from rest_framework.fields import Field
from wagtail.api.v2.serializers import PageSerializer
from wagtail.api.v2.views import PagesAPIViewSet

from .models import EventPage


class VenueField(Field):
    """Campo custom: oggetto venue serializzato."""

    def get_attribute(self, instance):
        return instance

    def to_representation(self, page):
        venue = page.venue
        if not venue:
            return None
        return {
            "id": venue.pk,
            "name": venue.name,
            "city": venue.city,
            "region": venue.region,
            "country": str(venue.country.code) if venue.country else None,
            "address": venue.address,
            "latitude": float(venue.latitude) if venue.latitude else None,
            "longitude": float(venue.longitude) if venue.longitude else None,
            "navigation_url": venue.navigation_url,
        }


class ArtistField(Field):
    """Campo custom: oggetto artista correlato serializzato."""

    def get_attribute(self, instance):
        return instance

    def to_representation(self, page):
        artist = page.related_artist
        if not artist:
            return None

        # Immagine principale (full-res + LQIP thumb)
        image_url = None
        image_thumb = None
        if artist.main_image:
            try:
                rendition = artist.main_image.get_rendition("fill-800x1200|format-webp")
                image_url = rendition.full_url
            except Exception:
                pass
            try:
                thumb = artist.main_image.get_rendition("fill-40x60|format-webp")
                image_thumb = thumb.full_url
            except Exception:
                pass

        # Gallery immagini (full-res + LQIP thumbs) per rotazione
        gallery_images: list[str] = []
        gallery_thumbs: list[str] = []
        for item in artist.gallery_images.all():
            try:
                g_rendition = item.image.get_rendition("fill-800x1200|format-webp")
                gallery_images.append(g_rendition.full_url)
            except Exception:
                continue
            try:
                g_thumb = item.image.get_rendition("fill-40x60|format-webp")
                gallery_thumbs.append(g_thumb.full_url)
            except Exception:
                gallery_thumbs.append(g_rendition.full_url)

        return {
            "id": artist.pk,
            "name": artist.title,
            "slug": artist.slug,
            "image_url": image_url,
            "image_thumb": image_thumb,
            "gallery_images": gallery_images,
            "gallery_thumbs": gallery_thumbs,
        }


class FeaturedImageField(Field):
    """Campo custom: URL rendition immagine in evidenza."""

    def get_attribute(self, instance):
        return instance

    def to_representation(self, page):
        if not page.featured_image:
            return None
        try:
            rendition = page.featured_image.get_rendition("fill-1200x1600|format-webp")
            return rendition.full_url
        except Exception:
            return None


class EventAPIViewSet(PagesAPIViewSet):
    """Endpoint API per gli eventi."""

    base_serializer_class = PageSerializer
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
        "venue",
        "artist",
        "featured_image_url",
    ]

    listing_default_fields = PagesAPIViewSet.listing_default_fields + [
        "start_date",
        "status",
        "ticket_url",
        "ticket_price",
        "venue",
        "artist",
        "featured_image_url",
    ]

    known_query_parameters = PagesAPIViewSet.known_query_parameters.union(
        {"artist", "venue", "region", "country", "future_only", "date_from", "date_to", "city"}
    )

    def get_serializer_class(self):
        """Aggiunge campi custom al serializer."""
        base = super().get_serializer_class()

        class CustomSerializer(base):
            venue = VenueField(read_only=True)
            artist = ArtistField(read_only=True)
            featured_image_url = FeaturedImageField(read_only=True)

        return CustomSerializer

    def get_queryset(self):
        qs = super().get_queryset()

        # Ordinamento per data (prossimi in ordine cronologico, archivio decrescente)
        date_to = self.request.query_params.get("date_to")
        if date_to:
            # Tab ARCHIVIO: dal più recente al più lontano
            qs = qs.order_by("-start_date")
        else:
            # Tab PROSSIMI (o default): dal più vicino al più lontano
            qs = qs.order_by("start_date")

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
            qs = qs.filter(start_date__gte=timezone.now().date())

        date_from = self.request.query_params.get("date_from")
        if date_from:
            qs = qs.filter(start_date__gte=date_from)

        if date_to:
            qs = qs.filter(start_date__lte=date_to)

        city = self.request.query_params.get("city")
        if city:
            qs = qs.filter(venue__city__iexact=city)

        return qs.select_related("venue", "related_artist", "featured_image")
