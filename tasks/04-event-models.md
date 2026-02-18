# TASK 04 — EventListingPage + EventPage

> **Agente:** Backend  
> **Fase:** 1 — Data Models  
> **Dipendenze:** Task 01, Task 02  
> **Stima:** 35 min  

---

## OBIETTIVO

Creare i modelli Page per la sezione Eventi/Calendario: una pagina indice filtrata per date future/passate (`EventListingPage`) e la pagina di dettaglio evento (`EventPage`) collegata a Venue, Artista e Promoter.

---

## FILES_IN_SCOPE (da leggere)

- `idea/1-architettura-dati-wagtail.md` — sezione 1.1 (Event models)
- `idea/3-funzionalita-booking.md` — sezione 3.2 (Calendario & Tour Dates)
- `template-strutturale/types.ts` — interface `MusicEvent`

---

## OUTPUT_ATTESO

```
events/
├── models.py          # EventListingPage, EventPage (Venue e Promoter già dal Task 02)
```

---

## SPECIFICHE MODELLI

### 1. EventListingPage (Index)

```python
"""Pagina calendario eventi — indice con filtri temporali."""
from django.utils import timezone
from wagtail.models import Page
from wagtail.fields import RichTextField
from wagtail.admin.panels import FieldPanel


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
        """
        Filtra eventi futuri/passati.
        Query params:
          - ?show=past  → eventi passati (desc)
          - ?show=all   → tutti
          - default     → solo futuri (asc)
          - ?artist=<slug>  → filtra per artista
          - ?venue=<id>     → filtra per venue
          - ?region=<slug>  → filtra per regione venue
        """
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

        # Filtri opzionali
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
```

---

### 2. EventPage (Detail)

```python
"""Pagina singolo evento — data, venue, artista, ticket."""
from django.db import models
from wagtail.models import Page
from wagtail.fields import RichTextField
from wagtail.admin.panels import FieldPanel, MultiFieldPanel
from wagtail.search import index
from wagtail.images import get_image_model_string


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


class EventPage(Page):
    """Singola data o evento."""

    # === Date ===
    # null=True per deferred validation Wagtail 7.x: permette save-draft senza data.
    # La data è obbligatoria al publish (blank=False implicito).
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
        verbose_name="Visibilità",
    )
    is_archived = models.BooleanField(
        default=False,
        verbose_name="Archiviato",
        help_text="Impostato automaticamente dal job notturno per eventi passati.",
    )

    # === Relazioni ===
    # ⚠️ T27 (§L272–300) usa related_artist per ereditare i permessi della band:
    # l'hook before_edit_page verifica related_artist.managing_group
    # per decidere se un collaboratore può modificare questo evento.
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
        help_text="Es: '€15 + d.p.' oppure 'Ingresso libero'",
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

    # === Regole Albero ===
    parent_page_types = ["events.EventListingPage"]
    subpage_types = []  # Foglia

    # === Search ===
    search_fields = Page.search_fields + [
        index.SearchField("description"),
        index.FilterField("start_date"),
        index.FilterField("status"),
        index.FilterField("is_archived"),
        index.RelatedFields("venue", [
            index.SearchField("name"),
            index.SearchField("city"),
            index.FilterField("region"),
        ]),
        index.RelatedFields("related_artist", [
            index.SearchField("title"),
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
        """Ritorna True se l'evento è nel futuro."""
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
```

---

## ALLINEAMENTO CON TEMPLATE FRONTEND

Il `types.ts` definisce:
```typescript
interface MusicEvent {
  id: string;      // → event.pk
  date: string;    // → event.start_date formatted
  venue: string;   // → event.venue.name
  city: string;    // → event.venue.city
  status: 'AVAILABLE' | 'SOLD OUT' | 'LOW TICKETS' | 'FREE';
}
```

La property `display_status` di EventPage mappa direttamente su questi valori.

---

## NOTE IMPLEMENTATIVE

1. **`is_archived` flag:** NON usiamo unpublish per evitare 404 e perdita SEO. Il campo `is_archived` viene impostato dal Celery task (Task 08).
2. **`related_artist` ForeignKey:** Un evento ha UN artista principale. Per eventi multi-artista futuri si potrà passare a M2M.
3. **`visibility = private`:** Questi eventi non appaiono nel calendario pubblico ma sono visibili in admin. Utile per date private/corporate.
4. **`doors_time` / `start_time`:** Separati per mostrare "Porte h21:00 — Show h22:00" nel frontend.
5. **Ordinamento:** Default discendente per admin. Nel `get_context` del listing, ascendente per eventi futuri.
6. **Permessi per-band (T27 §L112–202):** Il workflow "Approvazione Staff" viene assegnato a `EventListingPage` via data-migration. Gli eventi senza `related_artist` sono editabili solo dallo staff. Vedi `tasks/27-permissions-workflow.md`.

---

## CRITERI DI ACCETTAZIONE

- [ ] EventListingPage creabile SOLO sotto HomePage
- [ ] EventPage creabile SOLO sotto EventListingPage
- [ ] EventPage NON accetta figli
- [ ] Relazione Venue funzionante (dropdown nel pannello admin)
- [ ] Relazione ArtistPage funzionante (page chooser)
- [ ] Filtro future/past funziona in `get_context`
- [ ] Filtro per regione (testo libero, icontains) funzionante
- [ ] Filtro per country (codice ISO) funzionante
- [ ] Property `is_future` restituisce valore corretto
- [ ] Property `display_status` mappa su valori del template
- [ ] `search_fields` con filtro su `start_date` e `venue.region`

---

## SEZIONE TDD

```python
# tests/test_event_models.py
import pytest
from datetime import date, timedelta
from tests.factories import EventPageFactory, EventListingPageFactory, VenueFactory

@pytest.mark.django_db
class TestEventPageInternational:
    def test_event_with_foreign_venue(self, home_page):
        listing = EventListingPageFactory(parent=home_page)
        venue = VenueFactory(name="Berghain", city="Berlin", country="DE")
        event = EventPageFactory(parent=listing, venue=venue)
        assert event.venue.country.code == "DE"

    def test_filter_by_country(self, home_page):
        listing = EventListingPageFactory(parent=home_page)
        venue_it = VenueFactory(city="Milano", country="IT")
        venue_de = VenueFactory(city="Berlin", country="DE")
        EventPageFactory(parent=listing, venue=venue_it)
        EventPageFactory(parent=listing, venue=venue_de)
        from events.models import EventPage
        assert EventPage.objects.filter(venue__country="DE").count() == 1

    def test_display_status_mapping(self, home_page):
        listing = EventListingPageFactory(parent=home_page)
        event = EventPageFactory(parent=listing, status="confirmed")
        assert event.display_status == "AVAILABLE"
```

---

## SECURITY CHECKLIST

- [ ] `ticket_url` validato come URL (URLField)
- [ ] `description` usa RichTextField (safe escape in Wagtail)
- [ ] Query params (`show`, `artist`, `venue`, `region`, `country`) sanitizzati
- [ ] Promoter non esposto nel frontend (solo admin)
