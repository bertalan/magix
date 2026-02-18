# TASK 03 — ArtistListingPage + ArtistPage

> **Agente:** Backend  
> **Fase:** 1 — Data Models  
> **Dipendenze:** Task 01, Task 02  
> **Stima:** 40 min  

---

## OBIETTIVO

Creare i modelli Page per la sezione Artisti: una pagina indice (`ArtistListingPage`) e la pagina di dettaglio (`ArtistPage`). L'ArtistPage è il fulcro del sito — scheda completa con video hero, generi, discografia, e campi specifici per tribute/show band.

---

## FILES_IN_SCOPE (da leggere)

- `idea/1-architettura-dati-wagtail.md` — sezioni 1.1, 1.2, 1.3, 1.5
- `idea/7-note-strategiche-progetto.md` — sezione 2 (ArtistPage modifiche)
- `dati-band-Magixpromotion.csv` — struttura dati reali
- `template-strutturale/types.ts` — interface `Artist` per allineamento campi

---

## OUTPUT_ATTESO

```
artists/
├── models.py          # ArtistListingPage, ArtistPage, ArtistGenreRelation
├── blocks.py          # (importa da core/blocks.py — vedi Task 05)
```

---

## SPECIFICHE MODELLI

### 1. ArtistListingPage (Index)

```python
"""Pagina indice che elenca tutti gli artisti del roster."""
from wagtail.models import Page
from wagtail.fields import RichTextField
from wagtail.admin.panels import FieldPanel


class ArtistListingPage(Page):
    """Contenitore logico per le pagine artista. URL: /artisti/"""

    intro = RichTextField(
        blank=True,
        verbose_name="Testo introduttivo",
        help_text="Breve intro SEO per la pagina roster.",
    )

    content_panels = Page.content_panels + [
        FieldPanel("intro"),
    ]

    # Regole albero Wagtail
    parent_page_types = ["core.HomePage"]
    subpage_types = ["artists.ArtistPage"]
    max_count = 1  # Solo un indice artisti

    class Meta:
        verbose_name = "Pagina Roster Artisti"

    def get_context(self, request, *args, **kwargs):
        """Aggiunge la lista artisti live al contesto template."""
        context = super().get_context(request, *args, **kwargs)
        # Filtri dinamici da query params
        genre_slug = request.GET.get("genre")
        artist_type = request.GET.get("type")  # tribute, show, dj
        region = request.GET.get("region")

        artists = ArtistPage.objects.live().public().order_by("title")

        if genre_slug:
            artists = artists.filter(genres__slug=genre_slug)
        if artist_type:
            artists = artists.filter(artist_type=artist_type)
        if region:
            artists = artists.filter(base_region__icontains=region)

        country = request.GET.get("country")
        if country:
            artists = artists.filter(base_country=country)

        context["artists"] = artists
        context["genres"] = Genre.objects.all()
        return context
```

### 2. ArtistPage (Detail)

```python
"""Pagina di dettaglio artista — fulcro del sito."""
from django.db import models
from django_countries.fields import CountryField
from modelcluster.fields import ParentalManyToManyField
from wagtail.models import Page
from wagtail.fields import RichTextField, StreamField
from wagtail.admin.panels import FieldPanel, MultiFieldPanel
from wagtail.search import index
from wagtail.images import get_image_model_string

ARTIST_TYPE_CHOICES = [
    ("show_band", "Show Band / Party Band"),
    ("tribute", "Tribute Band"),
    ("original", "Band Originale"),
    ("dj", "DJ / Solista"),
    ("cover", "Cover Band"),
]

REGION_CHOICES = [
    # RIMOSSO — ora base_region è testo libero e base_country è CountryField
    # Vedi nota internazionalizzazione sotto
]

TARGET_EVENT_CHOICES = [
    ("matrimonio", "Matrimonio"),
    ("piazza", "Festa di Piazza"),
    ("club", "Club / Locale"),
    ("teatro", "Teatro"),
    ("corporate", "Evento Aziendale"),
    ("festival", "Festival"),
    ("privato", "Evento Privato"),
]


class ArtistPage(Page):
    """Scheda di dettaglio artista/band."""

    # === Campi Principali ===
    artist_type = models.CharField(
        max_length=20,
        choices=ARTIST_TYPE_CHOICES,
        default="show_band",
        verbose_name="Tipologia artista",
    )
    short_bio = models.TextField(
        max_length=500,
        verbose_name="Bio breve",
        help_text="Max 500 caratteri. Usata nelle card e snippet SEO.",
    )

    # === Media Primari ===
    main_image = models.ForeignKey(
        get_image_model_string(),
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        verbose_name="Immagine principale",
    )
    hero_video_url = models.URLField(
        blank=True,
        verbose_name="URL Video Hero (YouTube)",
        help_text="Se presente, l'header è video-first (loop/preview).",
    )

    # === Tribute-specific ===
    tribute_to = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="Tributo a",
        help_text="Nome artista/band tributato. Es: 'Queen', 'Vasco Rossi'. Migliora SEO.",
    )

    # === Localizzazione (internazionale) ===
    base_country = CountryField(
        default="IT",
        verbose_name="Paese base",
        help_text="Paese operativo principale della band.",
    )
    base_region = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Regione base",
        help_text="Testo libero. Es: Piemonte, Lombardia, Bavaria.",
    )
    base_city = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Città base",
    )

    # === Relazioni ===
    genres = ParentalManyToManyField(
        "artists.Genre",
        blank=True,
        verbose_name="Generi musicali",
    )
    target_events = ParentalManyToManyField(
        "artists.TargetEvent",
        blank=True,
        verbose_name="Tipologie evento target",
        help_text="Per quali tipi di evento è adatta questa band?",
    )

    # === Social & Link ===
    spotify_url = models.URLField(blank=True, verbose_name="Spotify")
    instagram_url = models.URLField(blank=True, verbose_name="Instagram")
    facebook_url = models.URLField(blank=True, verbose_name="Facebook")
    website_url = models.URLField(blank=True, verbose_name="Sito web")

    # === Permessi Per-Band (Task 27) ===
    managing_group = models.ForeignKey(
        "auth.Group",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name="Gruppo editor autorizzati",
        help_text=(
            "Gruppo Wagtail i cui membri possono modificare questa band "
            "e i relativi eventi. Lasciare vuoto per accesso solo staff."
        ),
    )

    # === Contenuto Flessibile (StreamField) ===
    body = StreamField(
        [
            # I blocchi vengono definiti nel Task 05
            # ("bio_block", ArtistBioBlock()),
            # ("discography_block", DiscographyBlock()),
            # ("video_embed_block", VideoEmbedBlock()),
            # ("gallery_block", GalleryBlock()),
        ],
        blank=True,
        use_json_field=True,
        verbose_name="Contenuto pagina",
    )

    # === Pannelli Admin ===
    content_panels = Page.content_panels + [
        MultiFieldPanel(
            [
                FieldPanel("artist_type"),
                FieldPanel("tribute_to"),
            ],
            heading="Classificazione",
        ),
        FieldPanel("short_bio"),
        MultiFieldPanel(
            [
                FieldPanel("main_image"),
                FieldPanel("hero_video_url"),
            ],
            heading="Media principali",
        ),
        FieldPanel("genres", widget=forms.CheckboxSelectMultiple),
        FieldPanel("target_events", widget=forms.CheckboxSelectMultiple),
        MultiFieldPanel(
            [
                FieldPanel("base_country"),
                FieldPanel("base_region"),
                FieldPanel("base_city"),
            ],
            heading="Localizzazione",
        ),
        FieldPanel("body"),
    ]

    promote_panels = Page.promote_panels + [
        MultiFieldPanel(
            [
                FieldPanel("spotify_url"),
                FieldPanel("instagram_url"),
                FieldPanel("facebook_url"),
                FieldPanel("website_url"),
            ],
            heading="Social & Link esterni",
        ),
    ]

    # === Pannello Settings (Permessi Per-Band — Task 27) ===
    settings_panels = Page.settings_panels + [
        FieldPanel("managing_group"),
    ]

    # === Regole Albero ===
    parent_page_types = ["artists.ArtistListingPage"]
    subpage_types = []  # Foglia — nessun figlio

    # === Search ===
    search_fields = Page.search_fields + [
        index.SearchField("short_bio"),
        index.SearchField("tribute_to"),
        index.FilterField("artist_type"),
        index.FilterField("base_country"),
        index.FilterField("base_region"),
        index.RelatedFields("genres", [
            index.SearchField("name"),
        ]),
    ]

    class Meta:
        verbose_name = "Pagina Artista"
        verbose_name_plural = "Pagine Artista"

    def __str__(self) -> str:
        return self.title
```

### 3. TargetEvent (Snippet aggiuntivo)

```python
"""Tipologia evento target — Snippet per classificare band per tipo evento."""
from wagtail.snippets.models import register_snippet

@register_snippet
class TargetEvent(models.Model):
    """Tipologia di evento per cui un artista è adatto."""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    icon = models.CharField(
        max_length=50,
        blank=True,
        help_text="Nome icona Lucide (es: 'party-popper', 'building-2').",
    )

    panels = [
        FieldPanel("name"),
        FieldPanel("slug"),
        FieldPanel("icon"),
    ]

    class Meta:
        verbose_name = "Tipologia evento"
        verbose_name_plural = "Tipologie evento"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name
```

**Valori pre-popolati:** Matrimonio, Festa di Piazza, Club/Locale, Teatro, Evento Aziendale, Festival, Evento Privato

---

## ALLINEAMENTO CON TEMPLATE FRONTEND

Il `types.ts` del template definisce:
```typescript
interface Artist {
  id: string;        // → page.pk
  name: string;      // → page.title
  genre: string;     // → page.genres (join nomi)
  imageUrl: string;  // → page.main_image rendition URL
  bio: string;       // → page.short_bio
  youtubeUrl?: string; // → page.hero_video_url
  socials: { instagram?, spotify?, twitter? }; // → page.*_url
  tags: string[];    // → page.genres + page.target_events
  events: MusicEvent[]; // → EventPage related (Task 04)
}
```

---

## NOTE IMPLEMENTATIVE

1. **`forms` import:** Aggiungere `from django import forms` per `CheckboxSelectMultiple`.
2. **StreamField body:** Per ora lasciare la lista blocchi vuota o commentata. Verranno aggiunti nel Task 05.
3. **wagtail-localize:** I campi `short_bio`, `body`, `title` saranno traducibili. I campi `hero_video_url`, `spotify_url`, `genres`, `main_image` saranno sincronizzati. Configurazione in Task 11.
4. **`get_image_model_string()`:** Usa la funzione Wagtail per compatibilità con custom image model futuro.
5. **`managing_group` (Task 27):** Il campo ForeignKey a `auth.Group` va in `settings_panels` (non visibile agli editor). Usato dagli hook in `core/wagtail_hooks.py` per isolamento per-band. Vedi Task 27 per dettagli completi su permessi, workflow e hook.

---

## CRITERI DI ACCETTAZIONE

- [ ] Migrazioni generate e applicate senza errori
- [ ] ArtistListingPage creabile SOLO sotto HomePage
- [ ] ArtistPage creabile SOLO sotto ArtistListingPage
- [ ] ArtistPage NON accetta pagine figlie
- [ ] Generi assegnabili con checkbox multipli
- [ ] Campo `tribute_to` visibile e funzionante
- [ ] Campo `hero_video_url` accetta URL YouTube  
- [ ] `search_fields` configurati correttamente
- [ ] Filtri funzionanti su `ArtistListingPage.get_context()`
- [ ] `base_country` usa CountryField (default IT)
- [ ] `base_region` è testo libero (no REGION_CHOICES)
- [ ] Filtro per country funzionante
- [ ] Campo `managing_group` presente in `settings_panels` (Task 27)

---

## SEZIONE TDD

```python
# tests/test_artist_models.py
import pytest
from tests.factories import ArtistPageFactory, ArtistListingPageFactory

@pytest.mark.django_db
class TestArtistPageInternational:
    def test_default_country_is_IT(self, artist_listing):
        artist = ArtistPageFactory(parent=artist_listing)
        assert artist.base_country.code == "IT"

    def test_foreign_country(self, artist_listing):
        artist = ArtistPageFactory(
            parent=artist_listing,
            base_country="DE",
            base_region="Bavaria",
            base_city="Munich",
        )
        assert artist.base_country.code == "DE"
        assert artist.base_region == "Bavaria"

    def test_filter_by_country(self, artist_listing, genres):
        ArtistPageFactory(parent=artist_listing, base_country="IT")
        ArtistPageFactory(parent=artist_listing, base_country="DE")
        from artists.models import ArtistPage
        assert ArtistPage.objects.filter(base_country="IT").count() == 1
```

---

## SECURITY CHECKLIST

- [ ] Campi `bio` / `short_bio` sanitizzati (RichTextField è safe in Wagtail)
- [ ] `hero_video_url` validato come URL (URLField)
- [ ] Nessun campo sensibile esposto senza autenticazione
- [ ] `CheckboxSelectMultiple` non vulnerabile a injection
