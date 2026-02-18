"""Configurazione campi traducibili per l'app Events (wagtail-localize)."""
from wagtail_localize.fields import SynchronizedField, TranslatableField

# Campi di EventPage che devono essere tradotti nelle varie lingue
EVENTS_TRANSLATABLE_FIELDS = [
    TranslatableField("title"),
    TranslatableField("description"),
]

# Campi di EventPage sincronizzati (copiati identici in ogni lingua)
EVENTS_SYNCHRONIZED_FIELDS = [
    SynchronizedField("start_date"),
    SynchronizedField("end_date"),
    SynchronizedField("doors_time"),
    SynchronizedField("start_time"),
    SynchronizedField("status"),
    SynchronizedField("venue"),
    SynchronizedField("related_artist"),
    SynchronizedField("promoter"),
    SynchronizedField("featured_image"),
    SynchronizedField("ticket_url"),
    SynchronizedField("ticket_price"),
]
