"""API endpoint custom per ArtistPage."""
import hashlib

from django.db.models import CharField, Value
from django.db.models.functions import MD5, Cast, Concat
from django.utils import timezone
from rest_framework.fields import Field
from wagtail.api.v2.serializers import PageSerializer
from wagtail.api.v2.views import PagesAPIViewSet

from .models import ArtistPage


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

        events = (
            EventPage.objects.live()
            .filter(related_artist=page, start_date__gte=timezone.now().date())
            .order_by("start_date")[:10]
        )
        return [
            {
                "id": str(e.pk),
                "slug": e.slug,
                "date": e.start_date.isoformat(),
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


class ImageThumbField(Field):
    """Campo custom: URL rendition LQIP tiny placeholder (40×60)."""

    THUMB_SPEC = "fill-40x60|format-webp"

    def get_attribute(self, instance):
        return instance

    def to_representation(self, page):
        if not page.main_image:
            return None
        try:
            rendition = page.main_image.get_rendition(self.THUMB_SPEC)
            return rendition.full_url
        except Exception:
            return None


class GalleryImagesField(Field):
    """Campo custom: lista URL rendition delle immagini gallery."""

    def __init__(self, rendition_spec="fill-800x1200|format-webp", **kwargs):
        self.rendition_spec = rendition_spec
        super().__init__(**kwargs)

    def get_attribute(self, instance):
        return instance

    def to_representation(self, page):
        urls: list[str] = []
        for item in page.gallery_images.all():
            try:
                rendition = item.image.get_rendition(self.rendition_spec)
                urls.append(rendition.full_url)
            except Exception:
                continue
        return urls


class GalleryThumbsField(Field):
    """Campo custom: lista URL rendition LQIP tiny placeholder gallery."""

    THUMB_SPEC = "fill-40x60|format-webp"

    def get_attribute(self, instance):
        return instance

    def to_representation(self, page):
        urls: list[str] = []
        for item in page.gallery_images.all():
            try:
                rendition = item.image.get_rendition(self.THUMB_SPEC)
                urls.append(rendition.full_url)
            except Exception:
                continue
        return urls


class ArtistAPIViewSet(PagesAPIViewSet):
    """Endpoint API per gli artisti."""

    base_serializer_class = PageSerializer
    model = ArtistPage

    body_fields = PagesAPIViewSet.body_fields + [
        "short_bio",
        "artist_type",
        "tribute_to",
        "hero_video_url",
        "base_country",
        "base_region",
        "base_city",
        "image_url",
        "image_thumb",
        "gallery_images",
        "gallery_thumbs",
        "genre_display",
        "tags",
        "socials",
        "events",
    ]

    listing_default_fields = PagesAPIViewSet.listing_default_fields + [
        "short_bio",
        "artist_type",
        "image_url",
        "image_thumb",
        "gallery_images",
        "gallery_thumbs",
        "genre_display",
        "tags",
        "socials",
        "events",
    ]

    known_query_parameters = PagesAPIViewSet.known_query_parameters.union(
        {"artist_type", "genre", "region", "country", "daily_seed"}
    )

    def get_serializer_class(self):
        """Aggiunge campi custom al serializer."""
        base = super().get_serializer_class()

        class CustomSerializer(base):
            image_url = ImageUrlField(read_only=True)
            image_thumb = ImageThumbField(read_only=True)
            gallery_images = GalleryImagesField(read_only=True)
            gallery_thumbs = GalleryThumbsField(read_only=True)
            genre_display = GenreListField(read_only=True)
            tags = TagsListField(read_only=True)
            socials = SocialsField(read_only=True)
            events = ArtistEventsField(read_only=True)

        return CustomSerializer

    def get_queryset(self):
        """Aggiunge filtri custom e ordinamento rotativo giornaliero.

        Il parametro `daily_seed` (es. "2026-02-19") attiva un ordinamento
        deterministico basato sulla data: ogni giorno le band appaiono in
        posizioni diverse, garantendo equa visibilità a rotazione.
        Formula: ORDER BY MD5(pk || daily_seed)
        """
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

        # Ordinamento rotativo giornaliero: MD5(pk + seed) come chiave di sort
        daily_seed = self.request.query_params.get("daily_seed")
        if daily_seed:
            qs = qs.annotate(
                daily_order=MD5(
                    Concat(
                        Cast("pk", output_field=CharField()),
                        Value(daily_seed),
                        output_field=CharField(),
                    )
                )
            ).order_by("daily_order")

        return qs.select_related("main_image").prefetch_related("genres", "target_events")
