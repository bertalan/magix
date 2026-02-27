"""HomePage — radice dell'albero Wagtail."""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django_countries.fields import CountryField
from wagtail.contrib.settings.models import BaseSiteSetting, register_setting
from wagtail.admin.panels import FieldPanel, MultiFieldPanel
from wagtail.documents import get_document_model_string
from wagtail.models import Page
from wagtail.snippets.models import register_snippet


class HomePage(Page):
    """Pagina radice del sito. Funge da aggregatore."""

    max_count = 1  # Solo una HomePage
    subpage_types = [
        "artists.ArtistListingPage",
        "events.EventListingPage",
        "booking.BookingFormPage",
    ]

    class Meta:
        verbose_name = _("Home Page")


@register_setting(icon="cog")
class MagixSiteSettings(BaseSiteSetting):
    """Configurazioni globali del sito, gestite dal CMS.

    Contiene dati NON traducibili (telefono, email, indirizzi, API keys).
    Le stringhe UI traducibili vanno nei file .po (gettext).
    """

    # --- Dati aziendali ---
    company_name = models.CharField(
        max_length=200,
        default="Magix Promotion",
        verbose_name=_("Ragione sociale"),
    )
    vat_number = models.CharField(
        max_length=30,
        blank=True,
        verbose_name=_("Partita IVA"),
    )
    phone = models.CharField(
        max_length=30,
        default="+39 335 523 0855",
        verbose_name=_("Telefono"),
    )
    email = models.EmailField(
        default="info@magixpromotion.it",
        verbose_name=_("Email principale"),
    )

    # --- Indirizzo sede ---
    address = models.CharField(
        max_length=300,
        default="Via dello Scabiolo",
        verbose_name=_("Indirizzo"),
    )
    city = models.CharField(
        max_length=100,
        default="Novi Ligure",
        verbose_name=_("Citta"),
    )
    province = models.CharField(
        max_length=10,
        default="AL",
        verbose_name=_("Provincia"),
    )
    zip_code = models.CharField(
        max_length=20,
        default="15067",
        verbose_name=_("CAP"),
    )
    country = CountryField(
        default="IT",
        verbose_name=_("Paese"),
    )
    hq_latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        default=44.7631,
        verbose_name=_("Latitudine sede"),
    )
    hq_longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        default=8.7873,
        verbose_name=_("Longitudine sede"),
    )

    # --- Social URLs ---
    facebook_url = models.URLField(blank=True, verbose_name=_("Facebook"))
    instagram_url = models.URLField(blank=True, verbose_name=_("Instagram"))
    youtube_url = models.URLField(blank=True, verbose_name=_("YouTube"))
    spotify_url = models.URLField(blank=True, verbose_name=_("Spotify"))

    # --- Analytics ---
    matomo_url = models.CharField(
        max_length=300,
        blank=True,
        verbose_name=_("Matomo URL"),
        help_text=_("URL base del server Matomo (es: //piwik.gpsbooking.com/). Vuoto = usa valore da settings."),
    )
    matomo_site_id = models.CharField(
        max_length=20,
        blank=True,
        verbose_name=_("Matomo Site ID"),
        help_text=_("ID del sito configurato su Matomo. Vuoto = usa valore da settings."),
    )
    google_analytics_id = models.CharField(
        max_length=50,
        blank=True,
        verbose_name=_("Google Analytics ID"),
        help_text=_("Measurement ID di Google Analytics (es: G-XXXXXXXXXX). Vuoto = disabilitato."),
    )

    # --- API Keys e configurazioni tecniche ---
    gemini_api_key = models.CharField(
        max_length=200,
        blank=True,
        verbose_name=_("Gemini API Key"),
        help_text=_("Chiave API Google Gemini per traduzioni automatiche e BandFinder."),
    )
    nominatim_user_agent = models.CharField(
        max_length=100,
        default="magixpromotion",
        verbose_name=_("Nominatim User-Agent"),
        help_text=_("User agent per le richieste a Nominatim/OSM."),
    )

    # --- Pannelli Admin ---
    panels = [
        MultiFieldPanel(
            [
                FieldPanel("company_name"),
                FieldPanel("vat_number"),
                FieldPanel("phone"),
                FieldPanel("email"),
            ],
            heading=_("Dati aziendali"),
        ),
        MultiFieldPanel(
            [
                FieldPanel("address"),
                FieldPanel("city"),
                FieldPanel("province"),
                FieldPanel("zip_code"),
                FieldPanel("country"),
                FieldPanel("hq_latitude"),
                FieldPanel("hq_longitude"),
            ],
            heading=_("Sede legale"),
        ),
        MultiFieldPanel(
            [
                FieldPanel("facebook_url"),
                FieldPanel("instagram_url"),
                FieldPanel("youtube_url"),
                FieldPanel("spotify_url"),
            ],
            heading=_("Social media"),
        ),
        MultiFieldPanel(
            [
                FieldPanel("matomo_url"),
                FieldPanel("matomo_site_id"),
                FieldPanel("google_analytics_id"),
            ],
            heading=_("Analytics & Tracking"),
        ),
        MultiFieldPanel(
            [
                FieldPanel("gemini_api_key"),
                FieldPanel("nominatim_user_agent"),
            ],
            heading=_("Configurazioni tecniche (non traducibili)"),
        ),
    ]

    class Meta:
        verbose_name = _("Impostazioni Magix Promotion")


@register_snippet
class EPKPackage(models.Model):
    """Kit stampa per un artista — raggruppa documenti e media."""

    artist = models.ForeignKey(
        "artists.ArtistPage",
        on_delete=models.CASCADE,
        related_name="epk_packages",
        verbose_name=_("Artista"),
    )
    title = models.CharField(
        max_length=200,
        verbose_name=_("Titolo EPK"),
        help_text=_("Es: 'Red Moon — Press Kit 2026'"),
    )
    description = models.TextField(
        blank=True,
        verbose_name=_("Descrizione"),
    )
    press_photo_hires = models.ForeignKey(
        "wagtailimages.Image",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        verbose_name=_("Foto stampa alta risoluzione"),
    )
    technical_rider = models.ForeignKey(
        get_document_model_string(),
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        verbose_name=_("Rider tecnico (PDF)"),
    )
    biography_pdf = models.ForeignKey(
        get_document_model_string(),
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        verbose_name=_("Biografia PDF"),
    )
    logo_vector = models.ForeignKey(
        get_document_model_string(),
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        verbose_name=_("Logo vettoriale (SVG/AI)"),
    )
    is_public = models.BooleanField(
        default=False,
        verbose_name=_("Pubblicamente accessibile"),
        help_text=_("Se True, non richiede autenticazione per il download."),
    )
    updated_at = models.DateTimeField(auto_now=True)

    panels = [
        FieldPanel("artist"),
        FieldPanel("title"),
        FieldPanel("description"),
        FieldPanel("is_public"),
        FieldPanel("press_photo_hires"),
        FieldPanel("technical_rider"),
        FieldPanel("biography_pdf"),
        FieldPanel("logo_vector"),
    ]

    class Meta:
        verbose_name = _("Kit Stampa (EPK)")
        verbose_name_plural = _("Kit Stampa (EPK)")
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return self.title
