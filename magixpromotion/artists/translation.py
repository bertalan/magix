"""Configurazione campi traducibili per l'app Artists (wagtail-localize)."""
from wagtail_localize.fields import SynchronizedField, TranslatableField

# Campi di ArtistPage che devono essere tradotti nelle varie lingue
ARTIST_TRANSLATABLE_FIELDS = [
    TranslatableField("title"),
    TranslatableField("short_bio"),
    TranslatableField("body"),
]

# Campi di ArtistPage sincronizzati (copiati identici in ogni lingua)
ARTIST_SYNCHRONIZED_FIELDS = [
    SynchronizedField("hero_video_url"),
    SynchronizedField("spotify_url"),
    SynchronizedField("instagram_url"),
    SynchronizedField("facebook_url"),
    SynchronizedField("website_url"),
    SynchronizedField("main_image"),
    SynchronizedField("artist_type"),
    SynchronizedField("tribute_to"),
    SynchronizedField("base_country"),
    SynchronizedField("base_region"),
    SynchronizedField("base_city"),
    SynchronizedField("managing_group"),
]
