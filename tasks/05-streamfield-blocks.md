# TASK 05 — StreamField Blocks Custom

> **Agente:** Backend  
> **Fase:** 1 — Data Models  
> **Dipendenze:** Task 01  
> **Stima:** 30 min  

---

## OBIETTIVO

Creare il set di blocchi StreamField custom che compongono il body dell'ArtistPage (e potenzialmente di altre pagine). Sostituiscono l'editor WYSIWYG libero garantendo rigidità di design ma flessibilità di contenuto.

---

## FILES_IN_SCOPE (da leggere)

- `idea/1-architettura-dati-wagtail.md` — sezione 1.3 (StreamFields)
- `idea/7-note-strategiche-progetto.md` — sezione 3 (UX Video-First)

---

## OUTPUT_ATTESO

```
core/
├── blocks.py          # Tutti i blocchi StreamField riutilizzabili
```

---

## SPECIFICHE BLOCCHI

### 1. ArtistBioBlock

```python
"""Blocco bio artista — testo + citazione opzionale."""
from wagtail.blocks import (
    CharBlock, RichTextBlock, StructBlock, TextBlock,
    URLBlock, ListBlock, IntegerBlock, ImageChooserBlock,
    StreamBlock, ChoiceBlock,
)
from wagtail.embeds.blocks import EmbedBlock


class ArtistBioBlock(StructBlock):
    """Sezione biografia con testo formattato e citazione opzionale."""

    body = RichTextBlock(
        features=["bold", "italic", "link", "ol", "ul"],
        help_text="Testo della biografia.",
    )
    quote = CharBlock(
        required=False,
        max_length=300,
        help_text="Citazione o frase di lancio dell'artista (opzionale).",
    )
    quote_attribution = CharBlock(
        required=False,
        max_length=100,
        help_text="Autore della citazione (opzionale).",
    )

    class Meta:
        template = "core/blocks/artist_bio_block.html"
        icon = "doc-full"
        label = "Biografia"
```

### 2. DiscographyBlock

```python
class AlbumBlock(StructBlock):
    """Singolo album nella discografia."""

    title = CharBlock(max_length=200, help_text="Titolo album.")
    year = IntegerBlock(
        min_value=1950,
        max_value=2030,
        help_text="Anno di uscita.",
    )
    cover_image = ImageChooserBlock(
        required=False,
        help_text="Copertina album.",
    )
    spotify_url = URLBlock(
        required=False,
        help_text="Link diretto Spotify dell'album.",
    )

    class Meta:
        icon = "media"
        label = "Album"


class DiscographyBlock(StructBlock):
    """Sezione discografia — lista ripetibile di album."""

    heading = CharBlock(
        default="Discografia",
        help_text="Titolo della sezione.",
    )
    albums = ListBlock(AlbumBlock())

    class Meta:
        template = "core/blocks/discography_block.html"
        icon = "list-ul"
        label = "Discografia"
```

### 3. VideoEmbedBlock

```python
class VideoEmbedBlock(StructBlock):
    """Video embed (YouTube/Vimeo) con didascalia."""

    video = EmbedBlock(
        help_text="URL YouTube o Vimeo. Es: https://www.youtube.com/watch?v=...",
    )
    caption = CharBlock(
        required=False,
        max_length=300,
        help_text="Didascalia sotto il video.",
    )
    is_featured = ChoiceBlock(
        choices=[
            ("normal", "Normale"),
            ("featured", "In evidenza (larghezza piena)"),
        ],
        default="normal",
    )

    class Meta:
        template = "core/blocks/video_embed_block.html"
        icon = "media"
        label = "Video"
```

### 4. GalleryBlock

```python
class GalleryImageBlock(StructBlock):
    """Singola immagine nella galleria."""

    image = ImageChooserBlock()
    caption = CharBlock(required=False, max_length=200)
    credit = CharBlock(required=False, max_length=100, help_text="Crediti fotografo.")

    class Meta:
        icon = "image"
        label = "Foto"


class GalleryBlock(StructBlock):
    """Carosello/griglia di immagini."""

    heading = CharBlock(
        default="Gallery",
        required=False,
    )
    layout = ChoiceBlock(
        choices=[
            ("grid", "Griglia (3 colonne)"),
            ("carousel", "Carosello"),
            ("masonry", "Masonry"),
        ],
        default="grid",
    )
    images = ListBlock(GalleryImageBlock())

    class Meta:
        template = "core/blocks/gallery_block.html"
        icon = "image"
        label = "Galleria"
```

### 5. HeadingBlock (Utility)

```python
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
        help_text="Mai H1 — riservato al titolo pagina.",
    )

    class Meta:
        template = "core/blocks/heading_block.html"
        icon = "title"
        label = "Titolo sezione"
```

### 6. CTABlock (Call to Action)

```python
class CTABlock(StructBlock):
    """Bottone call-to-action (es: Richiesta Preventivo, Compra Biglietti)."""

    text = CharBlock(max_length=100, help_text="Testo del bottone.")
    url = URLBlock(required=False, help_text="Link esterno.")
    page = PageChooserBlock(required=False, help_text="Oppure link a pagina interna.")
    style = ChoiceBlock(
        choices=[
            ("primary", "Primario (pieno)"),
            ("secondary", "Secondario (outline)"),
            ("accent", "Accent (gradient)"),
        ],
        default="primary",
    )

    class Meta:
        template = "core/blocks/cta_block.html"
        icon = "link"
        label = "Call to Action"
```

### 7. Assemblaggio: ArtistBodyStreamField

```python
"""StreamField composito per ArtistPage.body."""

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
```

Questo viene usato in `ArtistPage.body`:
```python
body = StreamField(ARTIST_BODY_BLOCKS, blank=True, use_json_field=True)
```

---

## TEMPLATE HTML BASE (scheletri)

Creare i template minimi per evitare errori di rendering:

```
templates/core/blocks/
├── artist_bio_block.html
├── discography_block.html
├── video_embed_block.html
├── gallery_block.html
├── heading_block.html
├── cta_block.html
├── richtext_block.html
```

**Esempio `heading_block.html`:**
```html
{% load wagtailcore_tags %}
<{{ self.level }}>{{ self.text }}</{{ self.level }}>
```

**Esempio `artist_bio_block.html`:**
```html
{% load wagtailcore_tags %}
<div class="bio-section">
    <div class="bio-text">{{ self.body|richtext }}</div>
    {% if self.quote %}
    <blockquote class="bio-quote">
        <p>"{{ self.quote }}"</p>
        {% if self.quote_attribution %}
        <cite>— {{ self.quote_attribution }}</cite>
        {% endif %}
    </blockquote>
    {% endif %}
</div>
```

---

## NOTE IMPLEMENTATIVE

1. **Importare `PageChooserBlock`** da `wagtail.blocks` per CTABlock.
2. **I blocchi sono riutilizzabili:** `ARTIST_BODY_BLOCKS` può essere usato anche in altre Page (es. HomePage per sezioni custom).
3. **JSON-LD:** Nell'output API (Task 10), i `DiscographyBlock` saranno mappati su `Schema.org/MusicAlbum`. Strutturare i dati pensando a questa conversione.
4. **Accessibilità (Task 21):** HeadingBlock impedisce H1, garantendo struttura semantica corretta.

---

## CRITERI DI ACCETTAZIONE

- [ ] `core/blocks.py` contiene tutti i 7 blocchi definiti
- [ ] `ARTIST_BODY_BLOCKS` esportato e importabile da `artists/models.py`
- [ ] ArtistPage.body usa i nuovi blocchi (aggiornare Task 03)
- [ ] Template HTML base creati in `templates/core/blocks/`
- [ ] Nessun errore al `makemigrations` dopo aver collegato i blocchi
- [ ] HeadingBlock non offre opzione H1
- [ ] VideoEmbedBlock accetta URL YouTube e Vimeo

---

## SEZIONE TDD

```python
# tests/test_streamfield_blocks.py
import pytest
from wagtail.blocks import StreamValue

@pytest.mark.django_db
class TestStreamFieldBlocks:
    def test_heading_block_no_h1(self):
        """HeadingBlock non deve permettere H1."""
        from core.blocks import HeadingBlock
        block = HeadingBlock()
        # Verifica che 'h1' non sia tra le scelte
        size_choices = [c[0] for c in block.child_blocks['size'].field.choices]
        assert 'h1' not in size_choices

    def test_video_embed_accepts_youtube(self):
        from core.blocks import VideoEmbedBlock
        block = VideoEmbedBlock()
        value = block.clean({'url': 'https://www.youtube.com/watch?v=test'})
        assert value is not None
```

---

## SECURITY CHECKLIST

- [ ] RichTextBlock: solo tag HTML sicuri (no script, iframe)
- [ ] VideoEmbedBlock: whitelist domini (YouTube, Vimeo)
- [ ] ImageBlock: validazione tipo file (solo immagini)
