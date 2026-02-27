"""Blocchi StreamField riutilizzabili per il sito MagixPromotion."""
from django.utils.translation import gettext_lazy as _
from wagtail.blocks import (
    CharBlock,
    ChoiceBlock,
    IntegerBlock,
    ListBlock,
    PageChooserBlock,
    RichTextBlock,
    StructBlock,
    URLBlock,
)
from wagtail.embeds.blocks import EmbedBlock
from wagtail.images.blocks import ImageChooserBlock


class HeadingBlock(StructBlock):
    """Titolo di sezione con livello semantico controllato."""

    text = CharBlock(max_length=200)
    level = ChoiceBlock(
        choices=[
            ("h2", "H2"),
            ("h3", "H3"),
            ("h4", "H4"),
        ],
        default="h2",
        help_text=_("Mai H1 — riservato al titolo pagina."),
    )

    class Meta:
        template = "core/blocks/heading_block.html"
        icon = "title"
        label = _("Titolo sezione")


class ArtistBioBlock(StructBlock):
    """Sezione biografia con testo formattato e citazione opzionale."""

    body = RichTextBlock(
        features=["bold", "italic", "link", "ol", "ul"],
        help_text=_("Testo della biografia."),
    )
    quote = CharBlock(
        required=False,
        max_length=300,
        help_text=_("Citazione o frase di lancio dell'artista (opzionale)."),
    )
    quote_attribution = CharBlock(
        required=False,
        max_length=100,
        help_text=_("Autore della citazione (opzionale)."),
    )

    class Meta:
        template = "core/blocks/artist_bio_block.html"
        icon = "doc-full"
        label = _("Biografia")


class AlbumBlock(StructBlock):
    """Singolo album nella discografia."""

    title = CharBlock(max_length=200, help_text=_("Titolo album."))
    year = IntegerBlock(
        min_value=1950,
        max_value=2030,
        help_text=_("Anno di uscita."),
    )
    cover_image = ImageChooserBlock(
        required=False,
        help_text=_("Copertina album."),
    )
    spotify_url = URLBlock(
        required=False,
        help_text=_("Link diretto Spotify dell'album."),
    )

    class Meta:
        icon = "media"
        label = _("Album")


class DiscographyBlock(StructBlock):
    """Sezione discografia — lista ripetibile di album."""

    heading = CharBlock(
        default="Discografia",
        help_text=_("Titolo della sezione."),
    )
    albums = ListBlock(AlbumBlock())

    class Meta:
        template = "core/blocks/discography_block.html"
        icon = "list-ul"
        label = _("Discografia")


class VideoEmbedBlock(StructBlock):
    """Video embed (YouTube/Vimeo) con didascalia."""

    video = EmbedBlock(
        help_text=_("URL YouTube o Vimeo. Es: https://www.youtube.com/watch?v=..."),
    )
    caption = CharBlock(
        required=False,
        max_length=300,
        help_text=_("Didascalia sotto il video."),
    )
    is_featured = ChoiceBlock(
        choices=[
            ("normal", _("Normale")),
            ("featured", _("In evidenza (larghezza piena)")),
        ],
        default="normal",
    )

    class Meta:
        template = "core/blocks/video_embed_block.html"
        icon = "media"
        label = _("Video")


class GalleryImageBlock(StructBlock):
    """Singola immagine nella galleria."""

    image = ImageChooserBlock()
    caption = CharBlock(required=False, max_length=200)
    credit = CharBlock(required=False, max_length=100, help_text=_("Crediti fotografo."))

    class Meta:
        icon = "image"
        label = _("Foto")


class GalleryBlock(StructBlock):
    """Carosello/griglia di immagini."""

    heading = CharBlock(
        default="Gallery",
        required=False,
    )
    layout = ChoiceBlock(
        choices=[
            ("grid", _("Griglia (3 colonne)")),
            ("carousel", _("Carosello")),
            ("masonry", _("Masonry")),
        ],
        default="grid",
    )
    images = ListBlock(GalleryImageBlock())

    class Meta:
        template = "core/blocks/gallery_block.html"
        icon = "image"
        label = _("Galleria")


class CTABlock(StructBlock):
    """Bottone call-to-action (es: Richiesta Preventivo, Compra Biglietti)."""

    text = CharBlock(max_length=100, help_text=_("Testo del bottone."))
    url = URLBlock(required=False, help_text=_("Link esterno."))
    page = PageChooserBlock(required=False, help_text=_("Oppure link a pagina interna."))
    style = ChoiceBlock(
        choices=[
            ("primary", _("Primario (pieno)")),
            ("secondary", _("Secondario (outline)")),
            ("accent", _("Accent (gradient)")),
        ],
        default="primary",
    )

    class Meta:
        template = "core/blocks/cta_block.html"
        icon = "link"
        label = _("Call to Action")


# StreamField composito per ArtistPage.body
ARTIST_BODY_BLOCKS = [
    ("heading", HeadingBlock()),
    ("bio", ArtistBioBlock()),
    ("discography", DiscographyBlock()),
    ("video", VideoEmbedBlock()),
    ("gallery", GalleryBlock()),
    ("cta", CTABlock()),
    ("richtext", RichTextBlock(
        features=["bold", "italic", "link", "ol", "ul", "h3", "h4"],
        template="core/blocks/richtext_block.html",
    )),
]
