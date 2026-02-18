"""Sistema navigazione dinamico sganciato dall'albero pagine."""
from django.db import models
from modelcluster.fields import ParentalKey
from modelcluster.models import ClusterableModel
from wagtail.admin.panels import (
    FieldPanel,
    InlinePanel,
    PageChooserPanel,
)
from wagtail.models import Orderable
from wagtail.snippets.models import register_snippet


MENU_LOCATION_CHOICES = [
    ("header", "Header (Navigazione principale)"),
    ("footer_main", "Footer — Colonna principale"),
    ("footer_legal", "Footer — Link legali"),
    ("footer_social", "Footer — Social"),
    ("mobile", "Mobile menu"),
]


@register_snippet
class NavigationMenu(ClusterableModel):
    """Un menu navigazione gestibile da CMS."""

    title = models.CharField(
        max_length=100,
        verbose_name="Nome menu",
        help_text="Nome interno, non visibile al pubblico. Es: 'Header Menu IT'",
    )
    location = models.CharField(
        max_length=30,
        choices=MENU_LOCATION_CHOICES,
        verbose_name="Posizione",
    )
    language = models.CharField(
        max_length=5,
        choices=[("it", "Italiano"), ("en", "English")],
        default="it",
        verbose_name="Lingua",
    )

    panels = [
        FieldPanel("title"),
        FieldPanel("location"),
        FieldPanel("language"),
        InlinePanel("items", label="Voci di menu"),
    ]

    class Meta:
        verbose_name = "Menu navigazione"
        verbose_name_plural = "Menu navigazione"
        unique_together = [("location", "language")]

    def __str__(self) -> str:
        return f"{self.title} ({self.get_location_display()})"


class MenuItem(Orderable):
    """Singola voce di menu — punta a pagina interna o URL esterno."""

    menu = ParentalKey(
        NavigationMenu,
        on_delete=models.CASCADE,
        related_name="items",
    )
    title_override = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Titolo custom",
        help_text="Se vuoto, usa il titolo della pagina linkata.",
    )
    page_link = models.ForeignKey(
        "wagtailcore.Page",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        verbose_name="Pagina interna",
    )
    external_url = models.URLField(
        blank=True,
        verbose_name="URL esterno",
        help_text="Usato solo se 'Pagina interna' e' vuoto.",
    )
    open_in_new_tab = models.BooleanField(
        default=False,
        verbose_name="Apri in nuova scheda",
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Icona",
        help_text="Nome icona Lucide React (es: 'music', 'calendar', 'mail').",
    )

    panels = [
        FieldPanel("title_override"),
        PageChooserPanel("page_link"),
        FieldPanel("external_url"),
        FieldPanel("open_in_new_tab"),
        FieldPanel("icon"),
    ]

    class Meta:
        ordering = ["sort_order"]

    @property
    def display_title(self) -> str:
        """Ritorna il titolo da mostrare nel menu."""
        if self.title_override:
            return self.title_override
        if self.page_link:
            return self.page_link.title
        return self.external_url or "—"

    @property
    def url(self) -> str:
        """Ritorna l'URL della voce di menu."""
        if self.page_link:
            return self.page_link.url
        return self.external_url or "#"

    def __str__(self) -> str:
        return self.display_title
