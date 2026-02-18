"""Modelli app Artists: Genre snippet, TargetEvent snippet, ArtistListingPage, ArtistPage."""
from django import forms
from django.db import models
from django.utils.text import slugify
from django_countries.fields import CountryField
from modelcluster.fields import ParentalManyToManyField
from wagtail.admin.panels import FieldPanel, MultiFieldPanel
from wagtail.fields import RichTextField, StreamField
from wagtail.images import get_image_model_string
from wagtail.models import Page
from wagtail.search import index
from wagtail.snippets.models import register_snippet

from wagtail_localize.fields import SynchronizedField, TranslatableField

from core.blocks import ARTIST_BODY_BLOCKS


@register_snippet
class Genre(models.Model):
    """Genere musicale usato per classificare gli artisti."""

    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="Nome genere",
    )
    slug = models.SlugField(
        max_length=100,
        unique=True,
        help_text="Generato automaticamente dal nome.",
    )
    description = models.TextField(
        blank=True,
        verbose_name="Descrizione",
        help_text="Breve descrizione del genere (opzionale).",
    )

    panels = [
        FieldPanel("name"),
        FieldPanel("slug"),
        FieldPanel("description"),
    ]

    override_translatable_fields = [
        TranslatableField("name"),
        SynchronizedField("slug"),
    ]

    class Meta:
        verbose_name = "Genere musicale"
        verbose_name_plural = "Generi musicali"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


@register_snippet
class TargetEvent(models.Model):
    """Tipologia di evento per cui un artista e' adatto."""

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

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


ARTIST_TYPE_CHOICES = [
    ("show_band", "Show Band / Party Band"),
    ("tribute", "Tribute Band"),
    ("original", "Band Originale"),
    ("dj", "DJ / Solista"),
    ("cover", "Cover Band"),
]


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
        genre_slug = request.GET.get("genre")
        artist_type = request.GET.get("type")
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
        help_text="Se presente, l'header e' video-first (loop/preview).",
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
        verbose_name="Citta base",
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
        help_text="Per quali tipi di evento e' adatta questa band?",
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
        ARTIST_BODY_BLOCKS,
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

    settings_panels = Page.settings_panels + [
        FieldPanel("managing_group"),
    ]

    # === wagtail-localize ===
    override_translatable_fields = [
        TranslatableField("title"),
        TranslatableField("short_bio"),
        TranslatableField("body"),
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

    # === Regole Albero ===
    parent_page_types = ["artists.ArtistListingPage"]
    subpage_types = []  # Foglia — nessun figlio

    # === Search ===
    search_fields = Page.search_fields + [
        index.SearchField("short_bio", boost=2),
        index.SearchField("tribute_to"),
        index.AutocompleteField("title", boost=10),
        index.AutocompleteField("short_bio"),
        index.FilterField("artist_type"),
        index.FilterField("base_country"),
        index.FilterField("base_region"),
        index.RelatedFields("genres", [
            index.SearchField("name", boost=3),
        ]),
    ]

    class Meta:
        verbose_name = "Pagina Artista"
        verbose_name_plural = "Pagine Artista"

    def __str__(self) -> str:
        return self.title

    # === Image Renditions ===

    @property
    def card_image_renditions(self) -> dict[str, str]:
        """Genera rendition set per la card artista (WebP)."""
        if not self.main_image:
            return {}
        try:
            return {
                "thumbnail": self.main_image.get_rendition("fill-400x533|format-webp").url,
                "card": self.main_image.get_rendition("fill-600x800|format-webp").url,
                "card_2x": self.main_image.get_rendition("fill-1200x1600|format-webp").url,
                "og": self.main_image.get_rendition("fill-1200x630|format-webp").url,
            }
        except Exception:
            return {}

    @property
    def hero_image_renditions(self) -> dict[str, str]:
        """Rendition set per l'hero image nel detail (WebP)."""
        img = self.main_image
        if not img:
            return {}
        try:
            return {
                "mobile": img.get_rendition("fill-800x1000|format-webp").url,
                "desktop": img.get_rendition("fill-1200x1600|format-webp").url,
                "desktop_2x": img.get_rendition("fill-2400x3200|format-webp").url,
            }
        except Exception:
            return {}

    @property
    def card_image_url(self) -> str | None:
        """URL singola rendition card (per uso rapido)."""
        renditions = self.card_image_renditions
        return renditions.get("card")

    @property
    def hero_image_url(self) -> str | None:
        """URL singola rendition hero (per uso rapido)."""
        renditions = self.hero_image_renditions
        return renditions.get("desktop")

    @property
    def og_image_url(self) -> str | None:
        """URL rendition Open Graph (1200x630)."""
        renditions = self.card_image_renditions
        return renditions.get("og")

    # === Cache Invalidation ===

    def save(self, *args, **kwargs):
        """Invalida cache renditions e proprieta' cacheable su save."""
        from core.cache import invalidate_model_cache

        if self.pk:
            invalidate_model_cache("ArtistPage", self.pk)
        super().save(*args, **kwargs)
