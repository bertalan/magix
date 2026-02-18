"""Task Celery per manutenzione automatica eventi."""
import logging
from datetime import timedelta

from celery import shared_task
from django.db import models
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=300)
def archive_past_events(self) -> dict:
    """
    Archivia eventi con end_date (o start_date) precedente a ieri.

    NON fa unpublish (per preservare URL e SEO).
    Imposta is_archived = True.
    """
    from events.models import EventPage

    yesterday = timezone.now().date() - timedelta(days=1)

    events_to_archive = EventPage.objects.live().filter(
        is_archived=False,
    ).filter(
        models.Q(end_date__lt=yesterday)
        | models.Q(end_date__isnull=True, start_date__lt=yesterday),
    )

    count = events_to_archive.count()

    if count == 0:
        logger.info("Nessun evento da archiviare.")
        return {"archived": 0, "date": str(yesterday)}

    updated = events_to_archive.update(is_archived=True)
    logger.info(f"Archiviati {updated} eventi con data precedente a {yesterday}.")

    return {
        "archived": updated,
        "date": str(yesterday),
    }


@shared_task
def send_booking_notification(submission_id: int) -> None:
    """Task asincrono per invio email di notifica booking."""
    from wagtail.contrib.forms.models import FormSubmission
    from django.core.mail import send_mail

    try:
        submission = FormSubmission.objects.get(pk=submission_id)
        data = submission.get_data()

        artist_name = data.get("requested_artist", "N/A")

        from booking.email_routing import get_manager_email

        manager_email = get_manager_email(artist_name)

        body_lines = [f"{k}: {v}" for k, v in data.items()]

        send_mail(
            subject=f"[Booking] Richiesta per {artist_name}",
            message="\n".join(body_lines),
            from_email="noreply@magixpromotion.it",
            recipient_list=[manager_email],
            fail_silently=False,
        )

        logger.info(f"Notifica booking inviata per submission {submission_id}")

    except FormSubmission.DoesNotExist:
        logger.error(f"Submission {submission_id} non trovata.")
    except Exception as exc:
        logger.exception(f"Errore invio notifica booking: {exc}")
