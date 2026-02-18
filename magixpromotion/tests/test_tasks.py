"""Test per i task Celery."""
import datetime

import pytest
from freezegun import freeze_time


@pytest.mark.django_db
class TestArchiveTask:
    @freeze_time("2025-07-15")
    def test_archive_past_events(self, home_page):
        from booking.tasks import archive_past_events
        from tests.factories import EventListingPageFactory, EventPageFactory

        listing = EventListingPageFactory(parent=home_page)

        # Evento passato (piu' di 1 giorno fa, cioe' < ieri = 2025-07-14)
        past = EventPageFactory(
            parent=listing,
            title="Evento Passato",
            start_date=datetime.date(2025, 7, 10),
            is_archived=False,
        )
        # Evento futuro
        future = EventPageFactory(
            parent=listing,
            title="Evento Futuro",
            start_date=datetime.date(2025, 7, 20),
            is_archived=False,
        )

        result = archive_past_events()

        past.refresh_from_db()
        future.refresh_from_db()
        assert past.is_archived is True
        assert future.is_archived is False
        assert result["archived"] >= 1

    @freeze_time("2025-07-15")
    def test_archive_no_events(self, home_page):
        """When there are no events to archive, returns archived=0."""
        from booking.tasks import archive_past_events

        result = archive_past_events()
        assert result["archived"] == 0

    @freeze_time("2025-07-15")
    def test_archive_does_not_rearchive(self, home_page):
        """Events already archived should not be counted again."""
        from booking.tasks import archive_past_events
        from tests.factories import EventListingPageFactory, EventPageFactory

        listing = EventListingPageFactory(parent=home_page)

        EventPageFactory(
            parent=listing,
            start_date=datetime.date(2025, 7, 5),
            is_archived=True,  # Already archived
        )

        result = archive_past_events()
        assert result["archived"] == 0

    @freeze_time("2025-07-15")
    def test_archive_respects_end_date(self, home_page):
        """Multi-day event should not be archived until end_date is past."""
        from booking.tasks import archive_past_events
        from tests.factories import EventListingPageFactory, EventPageFactory

        listing = EventListingPageFactory(parent=home_page)

        # Start is past but end_date is in the future
        multi_day = EventPageFactory(
            parent=listing,
            title="Multi Day",
            start_date=datetime.date(2025, 7, 10),
            end_date=datetime.date(2025, 7, 20),
            is_archived=False,
        )

        archive_past_events()
        multi_day.refresh_from_db()
        # Should NOT be archived because end_date is after yesterday
        assert multi_day.is_archived is False

    @freeze_time("2025-07-15")
    def test_archive_yesterday_event(self, home_page):
        """Event from yesterday (start_date == yesterday) should NOT be archived.

        The task archives events with start_date < yesterday (strictly less than).
        """
        from booking.tasks import archive_past_events
        from tests.factories import EventListingPageFactory, EventPageFactory

        listing = EventListingPageFactory(parent=home_page)

        yesterday_event = EventPageFactory(
            parent=listing,
            title="Evento Ieri",
            start_date=datetime.date(2025, 7, 14),  # yesterday
            is_archived=False,
        )

        archive_past_events()
        yesterday_event.refresh_from_db()
        # start_date (Jul 14) is NOT < yesterday (Jul 14), so not archived
        assert yesterday_event.is_archived is False
