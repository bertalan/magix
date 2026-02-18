# TASK 08 — Celery Task Archiviazione Eventi

> **Agente:** Backend  
> **Fase:** 2 — Business Logic  
> **Dipendenze:** Task 04  
> **Stima:** 20 min  

---

## OBIETTIVO

Implementare un job schedulato (Celery Beat) che ogni notte archivia automaticamente gli eventi passati senza fare unpublish (per preservare SEO e evitare 404).

---

## FILES_IN_SCOPE (da leggere)

- `idea/3-funzionalita-booking.md` — sezione 3.2 (Automazione)

---

## OUTPUT_ATTESO

```
booking/
├── tasks.py           # Celery tasks
config/
├── celery.py          # Configurazione Celery app
├── settings/
│   └── base.py        # Aggiungere CELERY_BEAT_SCHEDULE
```

---

## SPECIFICHE

### 1. Configurazione Celery (`config/celery.py`)

```python
"""Configurazione Celery per MagixPromotion."""
import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

app = Celery("magixpromotion")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
```

Aggiungere in `config/__init__.py`:
```python
from .celery import app as celery_app

__all__ = ("celery_app",)
```

### 2. Schedule in settings/base.py

```python
# Celery Beat Schedule
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    "archive-past-events": {
        "task": "booking.tasks.archive_past_events",
        "schedule": crontab(hour=3, minute=0),  # Ogni notte alle 03:00
        "options": {"expires": 3600},
    },
}
```

### 3. Task Archivazione (`booking/tasks.py`)

```python
"""Task Celery per manutenzione automatica eventi."""
import logging
from datetime import timedelta

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=300)
def archive_past_events(self) -> dict:
    """
    Archivia eventi con end_date (o start_date) precedente a ieri.
    
    Logica:
    - NON fa unpublish (per preservare URL e SEO)
    - Imposta is_archived = True
    - Logga il numero di eventi archiviati
    
    Returns:
        dict con conteggi operazione
    """
    from events.models import EventPage

    yesterday = timezone.now().date() - timedelta(days=1)

    # Cerca eventi live, non ancora archiviati, con data passata
    events_to_archive = EventPage.objects.live().filter(
        is_archived=False,
    ).filter(
        # Usa end_date se disponibile, altrimenti start_date
        models.Q(end_date__lt=yesterday) |
        models.Q(end_date__isnull=True, start_date__lt=yesterday),
    )

    count = events_to_archive.count()

    if count == 0:
        logger.info("Nessun evento da archiviare.")
        return {"archived": 0, "date": str(yesterday)}

    # Aggiorna in bulk per performance
    updated = events_to_archive.update(is_archived=True)

    logger.info(f"Archiviati {updated} eventi con data precedente a {yesterday}.")

    return {
        "archived": updated,
        "date": str(yesterday),
    }


@shared_task
def send_booking_notification(submission_id: int) -> None:
    """
    Task asincrono per invio email di notifica booking.
    Separato dal request/response per non rallentare l'utente.
    """
    from wagtail.contrib.forms.models import FormSubmission
    from django.core.mail import send_mail

    try:
        submission = FormSubmission.objects.get(pk=submission_id)
        data = submission.get_data()
        
        artist_name = data.get("artista_richiesto", "N/A")
        email_from = data.get("email", "noreply@magixpromotion.it")
        
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
```

---

## NOTE IMPLEMENTATIVE

1. **`models` import:** Aggiungere `from django.db import models` nel task per il `Q` object.
2. **NO unpublish:** Fondamentale. L'unpublish creerebbe 404 e perderebbe il ranking SEO delle pagine evento.
3. **Bulk update:** `update()` non triggera i signal Django ma è molto più veloce. Accettabile per questo use case.
4. **`send_booking_notification`:** Task aggiuntivo per disaccoppiare l'invio email dal request. Viene chiamato da `BookingFormPage.process_form_submission()` (Task 07).
5. **Redis:** Richiede Redis in esecuzione. Per sviluppo senza Redis, usare `CELERY_TASK_ALWAYS_EAGER = True` in `dev.py`.

---

## CRITERI DI ACCETTAZIONE

- [ ] `config/celery.py` configurato e importato in `__init__.py`
- [ ] `CELERY_BEAT_SCHEDULE` definito in settings
- [ ] Task `archive_past_events` eseguibile manualmente: `python manage.py shell -c "from booking.tasks import archive_past_events; archive_past_events.delay()"`
- [ ] Eventi con `start_date < ieri` marcati come `is_archived=True`
- [ ] Eventi futuri NON toccati
- [ ] Eventi già archiviati NON processati di nuovo
- [ ] Nessun evento viene unpublished
- [ ] Task `send_booking_notification` invia email con dati corretti
- [ ] Setting `CELERY_TASK_ALWAYS_EAGER = True` in dev per test senza Redis

---

## SEZIONE TDD

```python
# tests/test_celery_tasks.py
import pytest
from datetime import date, timedelta
from freezegun import freeze_time

@pytest.mark.django_db
class TestArchivePastEvents:
    @freeze_time("2025-07-15")
    def test_only_archives_past_events(self, home_page):
        from events.tasks import archive_past_events
        from tests.factories import EventListingPageFactory, EventPageFactory
        listing = EventListingPageFactory(parent=home_page)
        past = EventPageFactory(parent=listing, date_start=date(2025, 7, 10), is_archived=False)
        future = EventPageFactory(parent=listing, date_start=date(2025, 7, 20), is_archived=False)
        archive_past_events()
        past.refresh_from_db()
        future.refresh_from_db()
        assert past.is_archived is True
        assert future.is_archived is False

    def test_idempotent(self, home_page):
        """Eseguire due volte non deve causare errori."""
        from events.tasks import archive_past_events
        archive_past_events()
        archive_past_events()  # Nessun errore
```

---

## SECURITY CHECKLIST

- [ ] Task Celery non espongono dati sensibili nei log
- [ ] Email di notifica booking non contengono dati sensibili nel subject
- [ ] CELERY_BROKER_URL usa Redis con connessione locale (no internet)
