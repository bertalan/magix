"""Modelli app Events: Venue, Promoter snippets, EventListingPage, EventPage."""
from django.db import models
from django.utils import timezone
from django_countries.fields import CountryField
from wagtail.admin.panels import FieldPanel, MultiFieldPanel
from wagtail.fields import RichTextField
from wagtail.images import get_image_model_string
from wagtail.models import Page
from wagtail.search import index
from wagtail.snippets.models import register_snippet
from wagtail_localize.fields import SynchronizedField, TranslatableField


@register_snippet
class Venue(models.Model):
    """Locale, teatro, piazza o venue per eventi. Supporta indirizzi internazionali."""

    name = models.CharField(max_length=200, verbose_name="Nome venue")
    city = models.CharField(max_length=100, verbose_name="Citta")
    province = models.CharField(
        max_length=10,
        blank=True,
        verbose_name="Provincia / Stato",
        help_text="Es: AL, MI, TO oppure Bayern, Ile-de-France",
    )
    region = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Regione",
        help_text="Testo libero. Es: Piemonte, Lombardia, Bavaria, Catalonia",
    )
    country = CountryField(
        default="IT",
        verbose_name="Paese",
        help_text="Codice ISO 3166-1 alpha-2",
    )
    address = models.CharField(
        max_length=300,
        blank=True,
        verbose_name="Indirizzo completo",
    )
    zip_code = models.CharField(
        max_length=20,
        blank=True,
        verbose_name="CAP / Codice postale",
    )
    capacity = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="Capienza",
    )
    website = models.URLField(blank=True, verbose_name="Sito web")
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name="Latitudine",
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name="Longitudine",
    )

    panels = [
        FieldPanel("name"),
        MultiFieldPanel(
            [
                FieldPanel("address"),
                FieldPanel("city"),
                FieldPanel("province"),
                FieldPanel("region"),
                FieldPanel("zip_code"),
                FieldPanel("country"),
            ],
            heading="Localizzazione",
        ),
        FieldPanel("capacity"),
        FieldPanel("website"),
        MultiFieldPanel(
            [
                FieldPanel("latitude"),
                FieldPanel("longitude"),
            ],
            heading="Coordinate GPS (auto-compilabili via Nominatim)",
        ),
    ]

    class Meta:
        verbose_name = "Venue"
        verbose_name_plural = "Venues"
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} — {self.city} ({self.country.code})"

    @property
    def full_address(self) -> str:
        """Indirizzo completo formattato per visualizzazione e deep link."""
        parts = [self.address, self.zip_code, self.city, self.province, str(self.country.name)]
        return ", ".join(p for p in parts if p)

    @property
    def navigation_url(self) -> str:
        """URL deep link per navigazione (OpenStreetMap)."""
        if self.latitude and self.longitude:
            return f"https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=;{self.latitude},{self.longitude}"
        from urllib.parse import quote
        addr = self.full_address
        return f"https://www.openstreetmap.org/search?query={quote(addr)}"

    def geocode_with_nominatim(self) -> bool:
        """Geocodifica indirizzo con Nominatim (OpenStreetMap). Ritorna True se successo."""
        from core.geocoding import nominatim_geocode
        coords = nominatim_geocode(self.full_address)
        if coords:
            self.latitude, self.longitude = coords
            return True
        return False


@register_snippet
class Promoter(models.Model):
    """Promoter o organizzatore eventi. Dati riservati (non pubblici)."""

    company_name = models.CharField(max_length=200, verbose_name="Ragione sociale")
    contact_name = models.CharField(
        max_length=150,
        blank=True,
        verbose_name="Referente",
    )
    email = models.EmailField(blank=True, verbose_name="Email")
    phone = models.CharField(max_length=30, blank=True, verbose_name="Telefono")
    notes = models.TextField(
        blank=True,
        verbose_name="Note interne",
        help_text="Visibili solo agli admin.",
    )

    panels = [
        FieldPanel("company_name"),
        FieldPanel("contact_name"),
        FieldPanel("email"),
        FieldPanel("phone"),
        FieldPanel("notes"),
    ]

    class Meta:
        verbose_name = "Promoter"
        verbose_name_plural = "Promoters"
        ordering = ["company_name"]

    def __str__(self) -> str:
        return self.company_name


EVENT_STATUS_CHOICES = [
    ("confirmed", "Confermato"),
    ("tentative", "Da confermare"),
    ("cancelled", "Annullato"),
    ("postponed", "Posticipato"),
    ("sold_out", "Sold Out"),
]

EVENT_VISIBILITY_CHOICES = [
    ("public", "Pubblico"),
    ("private", "Privato (non visibile nel calendario)"),
]


class EventListingPage(Page):
    """Contenitore logico per EventPage. URL: /calendario/ o /events/"""

    intro = RichTextField(
        blank=True,
        verbose_name="Testo introduttivo",
    )

    content_panels = Page.content_panels + [
        FieldPanel("intro"),
    ]

    parent_page_types = ["core.HomePage"]
    subpage_types = ["events.EventPage"]
    max_count = 1

    class Meta:
        verbose_name = "Pagina Calendario Eventi"

    def get_context(self, request, *args, **kwargs):
        """Filtra eventi futuri/passati con filtri opzionali."""
        context = super().get_context(request, *args, **kwargs)
        today = timezone.now().date()
        show = request.GET.get("show", "future")

        events = EventPage.objects.live().public()

        if show == "past":
            events = events.filter(start_date__lt=today).order_by("-start_date")
        elif show == "all":
            events = events.order_by("-start_date")
        else:
            events = events.filter(start_date__gte=today).order_by("start_date")

        artist_slug = request.GET.get("artist")
        if artist_slug:
            events = events.filter(related_artist__slug=artist_slug)

        venue_id = request.GET.get("venue")
        if venue_id:
            events = events.filter(venue_id=venue_id)

        region = request.GET.get("region")
        if region:
            events = events.filter(venue__region__icontains=region)

        country = request.GET.get("country")
        if country:
            events = events.filter(venue__country=country)

        context["events"] = events
        context["show_mode"] = show
        context["today"] = today
        return context


class EventPage(Page):
    """Singola data o evento."""

    # === Date ===
    start_date = models.DateField(null=True, verbose_name="Data inizio")
    end_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Data fine",
        help_text="Compilare solo per eventi multi-giorno.",
    )
    doors_time = models.TimeField(
        null=True,
        blank=True,
        verbose_name="Apertura porte",
    )
    start_time = models.TimeField(
        null=True,
        blank=True,
        verbose_name="Inizio show",
    )

    # === Stato ===
    status = models.CharField(
        max_length=20,
        choices=EVENT_STATUS_CHOICES,
        default="confirmed",
        verbose_name="Stato evento",
    )
    visibility = models.CharField(
        max_length=20,
        choices=EVENT_VISIBILITY_CHOICES,
        default="public",
        verbose_name="Visibilita",
    )
    is_archived = models.BooleanField(
        default=False,
        verbose_name="Archiviato",
        help_text="Impostato automaticamente dal job notturno per eventi passati.",
    )

    # === Relazioni ===
    related_artist = models.ForeignKey(
        "artists.ArtistPage",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="events",
        verbose_name="Artista",
    )
    venue = models.ForeignKey(
        "events.Venue",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="events",
        verbose_name="Venue",
    )
    promoter = models.ForeignKey(
        "events.Promoter",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="events",
        verbose_name="Promoter",
    )

    # === Media ===
    featured_image = models.ForeignKey(
        get_image_model_string(),
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        verbose_name="Immagine evento",
    )

    # === Contenuto ===
    description = RichTextField(
        blank=True,
        verbose_name="Descrizione evento",
    )
    ticket_url = models.URLField(
        blank=True,
        verbose_name="Link biglietti",
    )
    ticket_price = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Prezzo biglietti",
        help_text="Es: '15 + d.p.' oppure 'Ingresso libero'",
    )

    # === Admin Panels ===
    content_panels = Page.content_panels + [
        MultiFieldPanel(
            [
                FieldPanel("start_date"),
                FieldPanel("end_date"),
                FieldPanel("doors_time"),
                FieldPanel("start_time"),
            ],
            heading="Date e Orari",
        ),
        MultiFieldPanel(
            [
                FieldPanel("status"),
                FieldPanel("visibility"),
            ],
            heading="Stato",
        ),
        FieldPanel("related_artist"),
        FieldPanel("venue"),
        FieldPanel("promoter"),
        FieldPanel("featured_image"),
        FieldPanel("description"),
        MultiFieldPanel(
            [
                FieldPanel("ticket_url"),
                FieldPanel("ticket_price"),
            ],
            heading="Biglietti",
        ),
    ]

    # === wagtail-localize ===
    override_translatable_fields = [
        TranslatableField("title"),
        TranslatableField("description"),
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

    # === Regole Albero ===
    parent_page_types = ["events.EventListingPage"]
    subpage_types = []  # Foglia

    # === Search ===
    search_fields = Page.search_fields + [
        index.SearchField("description"),
        index.AutocompleteField("title"),
        index.FilterField("start_date"),
        index.FilterField("status"),
        index.FilterField("is_archived"),
        index.RelatedFields("venue", [
            index.SearchField("name", boost=3),
            index.SearchField("city", boost=2),
            index.FilterField("region"),
        ]),
        index.RelatedFields("related_artist", [
            index.SearchField("title", boost=4),
        ]),
    ]

    class Meta:
        verbose_name = "Pagina Evento"
        verbose_name_plural = "Pagine Evento"
        ordering = ["-start_date"]

    def __str__(self) -> str:
        return f"{self.title} — {self.start_date}"

    @property
    def is_future(self) -> bool:
        """Ritorna True se l'evento e' nel futuro."""
        if not self.start_date:
            return False
        return self.start_date >= timezone.now().date()

    @property
    def display_status(self) -> str:
        """Status per il frontend (allineato a MusicEvent.status del template)."""
        if self.status == "sold_out":
            return "SOLD OUT"
        elif self.status == "cancelled":
            return "CANCELLED"
        elif self.ticket_price and "libero" in self.ticket_price.lower():
            return "FREE"
        elif self.status == "confirmed":
            return "AVAILABLE"
        return self.get_status_display()
