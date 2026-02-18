"""API endpoint custom per EventPage."""
from django.utils import timezone
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
            qs = qs.filter(start_date__gte=timezone.now().date())

        return qs.select_related("venue", "related_artist", "featured_image")
