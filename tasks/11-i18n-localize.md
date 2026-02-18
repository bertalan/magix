# TASK 11 — wagtail-localize Setup (i18n)

> **Agente:** Backend  
> **Fase:** 3 — API & Integration  
> **Dipendenze:** Task 03, Task 04  
> **Stima:** 25 min  

---

## OBIETTIVO

Configurare `wagtail-localize` per gestire la traduzione IT/EN del sito con alberi sincronizzati. Definire esplicitamente quali campi sono traducibili e quali sincronizzati su tutti i modelli Page.

---

## FILES_IN_SCOPE (da leggere)

- `idea/2-logica-navigazione-i18n.md` — completo
- Task 03 — campi ArtistPage  
- Task 04 — campi EventPage

---

## OUTPUT_ATTESO

```
config/
├── settings/
│   └── base.py           # Aggiornare INSTALLED_APPS, LANGUAGES, configurazione localize
artists/
├── translation.py         # Configurazione campi traducibili/sincronizzati
events/
├── translation.py
core/
├── translation.py
├── gemini_translator.py   # Machine translator Gemini per wagtail-localize
```

---

## SPECIFICHE

### 1. Settings (aggiornare `base.py`)

```python
# === wagtail-localize ===
INSTALLED_APPS += [
    "wagtail_localize",
    "wagtail_localize.locales",
]

# Già definiti in Task 01 ma verificare:
WAGTAIL_I18N_ENABLED = True
WAGTAIL_CONTENT_LANGUAGES = LANGUAGES = [
    ("it", "Italiano"),
    ("en", "English"),
]
LANGUAGE_CODE = "it"  # Lingua principale

# URL localizzati
LOCALE_PATHS = [BASE_DIR / "locale"]

# wagtail-localize settings
WAGTAILLOCALIZE_MACHINE_TRANSLATOR = {
    "CLASS": "core.gemini_translator.GeminiTranslator",
    "OPTIONS": {},  # La API key viene letta da MagixSiteSettings
}
```

### 1b. Gemini Machine Translator (core/gemini_translator.py)

```python
# core/gemini_translator.py
"""Machine translator per wagtail-localize basato su Google Gemini API.

Sostituisce DeepL. Legge la API key da MagixSiteSettings.
"""
import logging
from typing import Optional

from wagtail.models import Site
from wagtail_localize.machine_translators.base import BaseMachineTranslator

logger = logging.getLogger(__name__)


class GeminiTranslator(BaseMachineTranslator):
    """Traduttore automatico IT→EN (e viceversa) via Google Gemini API."""

    display_name = "Google Gemini"

    def _get_api_key(self) -> Optional[str]:
        """Recupera la chiave API da MagixSiteSettings."""
        from core.models import MagixSiteSettings
        try:
            site = Site.objects.get(is_default_site=True)
            settings = MagixSiteSettings.for_site(site)
            return settings.gemini_api_key or None
        except Exception:
            return None

    def translate(self, source_locale, target_locale, strings):
        """Traduce una lista di stringhe da source_locale a target_locale."""
        api_key = self._get_api_key()
        if not api_key:
            logger.error("Gemini API key non configurata in SiteSettings")
            return {}

        try:
            from google.genai import GoogleGenAI
            ai = GoogleGenAI(api_key=api_key)

            results = {}
            for string_value in strings:
                text = string_value.render_text()
                if not text.strip():
                    results[string_value] = text
                    continue

                prompt = (
                    f"Traduci il seguente testo da {source_locale.language_code} "
                    f"a {target_locale.language_code}. "
                    f"Mantieni la formattazione HTML se presente. "
                    f"Rispondi SOLO con la traduzione, senza spiegazioni.\n\n"
                    f"{text}"
                )

                response = ai.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=prompt,
                )
                translated = response.text.strip() if response.text else text
                results[string_value] = string_value.apply_text(translated)

            return results

        except Exception as e:
            logger.error(f"Errore traduzione Gemini: {e}")
            return {}

    def can_translate(self, source_locale, target_locale):
        """Verifica se la coppia linguistica è supportata."""
        supported = {"it", "en", "fr", "de", "es", "pt"}
        return (
            source_locale.language_code in supported
            and target_locale.language_code in supported
            and self._get_api_key() is not None
        )
```

### 2. Configurazione Campi su ArtistPage

```python
# artists/translation.py
"""
Definizione campi traducibili vs sincronizzati per ArtistPage.

TRADUCIBILI (valori diversi per lingua):
  - title, short_bio, body (StreamField)

SINCRONIZZATI (stessi valori su tutte le lingue):
  - hero_video_url, spotify_url, instagram_url, facebook_url, website_url
  - main_image, genres, target_events
  - artist_type, tribute_to, base_region, base_city
"""
from wagtail_localize.models import TranslatableMixin


# Nota: I modelli devono ereditare da TranslatableMixin PRIMA di Page
# La modifica va fatta nella definizione del modello stesso.

# Configurazione override_translatable_fields su ArtistPage:
ARTIST_TRANSLATABLE_FIELDS = [
    "title",
    "short_bio",
    "body",
    "seo_title",
    "search_description",
]

ARTIST_SYNCHRONIZED_FIELDS = [
    "slug",  # Lo slug viene tradotto separatamente
    "hero_video_url",
    "spotify_url",
    "instagram_url",
    "facebook_url",
    "website_url",
    "main_image",
    "genres",
    "target_events",
    "artist_type",
    "tribute_to",
    "base_country",
    "base_region",
    "base_city",
]
```

### 3. Modifica ArtistPage Model

L'ArtistPage deve ereditare da `TranslatableMixin`:

```python
from wagtail_localize.fields import SynchronizedField, TranslatableField

class ArtistPage(TranslatableMixin, Page):
    # ... campi esistenti ...

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
        # ⚠️ T27 (§L210–232): managing_group DEVE essere sincronizzato
        # per garantire che sia identico in tutte le lingue.
        SynchronizedField("managing_group"),
    ]
```

### 4. Configurazione Campi su EventPage

```python
# events/translation.py
"""
EventPage: la maggior parte dei campi è sincronizzata (date, venue, ticket).
Solo title e description sono traducibili.
"""
EVENTS_TRANSLATABLE_FIELDS = ["title", "description"]
EVENTS_SYNCHRONIZED_FIELDS = [
    "start_date", "end_date", "doors_time", "start_time",
    "status", "visibility", "is_archived",
    "related_artist", "venue", "promoter",
    "featured_image", "ticket_url", "ticket_price",
]
```

Modifica EventPage:
```python
class EventPage(TranslatableMixin, Page):
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
```

### 5. Snippet Translation (Genre)

```python
from wagtail_localize.models import TranslatableMixin

@register_snippet
class Genre(TranslatableMixin, models.Model):
    # Il nome del genere viene tradotto (es: "Dance Show Band" → ?)
    # Lo slug resta sincronizzato
    
    override_translatable_fields = [
        TranslatableField("name"),
        SynchronizedField("slug"),
    ]
```

### 6. URL Routing Localizzato

Già configurato nel Task 01 (`config/urls.py` usa `i18n_patterns`), ma verificare:

```python
# Risultato atteso:
# /it/artisti/red-moon       → ArtistPage (IT)
# /en/artists/red-moon       → ArtistPage (EN)
# /it/calendario/            → EventListingPage (IT)
# /en/events/                → EventListingPage (EN)
```

Gli slug delle `ListingPage` vengono tradotti nell'admin Wagtail:
- `ArtistListingPage`: slug IT = `artisti`, slug EN = `artists`
- `EventListingPage`: slug IT = `calendario`, slug EN = `events`

---

## NOTE IMPLEMENTATIVE

1. **Ordine ereditarietà:** `TranslatableMixin` DEVE venire prima di `Page` nella MRO. Es: `class ArtistPage(TranslatableMixin, Page)`.
2. **Migrazioni:** Dopo aver aggiunto `TranslatableMixin`, eseguire `makemigrations` e `migrate`. Wagtail-localize aggiunge tabelle di traduzione.
3. **Locale iniziale:** Al primo `migrate`, creare il Locale IT tramite admin o migration data: `Locale.objects.get_or_create(language_code="it")`.
4. **Sincronizzazione albero:** Una volta creato il Locale EN, l'albero IT viene clonato. Le pagine EN sono "traduzioni" collegate alle pagine IT.
5. **Gemini Translator:** Sostituisce DeepL. La API key è salvata in `MagixSiteSettings.gemini_api_key` (configurabile dal CMS). Il traduttore supporta IT, EN, FR, DE, ES, PT.
6. **Stringhe UI gettext:** Le stringhe dell'interfaccia utente ("Prenota ora", "Tutti i diritti riservati") vanno nei file `.po` in `locale/it/LC_MESSAGES/` e `locale/en/LC_MESSAGES/`. Usare `{% trans %}` nei template Django e `gettext()` nel codice Python.
7. **Variabili non traducibili:** Telefono, email, indirizzi, URL social, API keys → in `MagixSiteSettings` (CMS). Non mettere nei file `.po`.
8. **Compatibilità Wagtail 7.x:** `wagtail-localize>=1.13` supporta ufficialmente fino a Wagtail 7.2. Quando uscirà Wagtail 7.4 LTS, aggiornare wagtail-localize alla prossima release (1.14+). L'API `BaseMachineTranslator` è stabile e il nostro `GeminiTranslator` non è impattato dai breaking changes 7.0 (deferred validation, Page.save changes).

---

## CRITERI DI ACCETTAZIONE

- [ ] `wagtail-localize` installato e configurato
- [ ] Locale IT e EN creati nel DB
- [ ] ArtistPage traducibile: `short_bio` e `body` hanno versioni separate IT/EN
- [ ] ArtistPage sincronizzata: cambiare `hero_video_url` in IT aggiorna automaticamente EN
- [ ] EventPage: `start_date` sincronizzata, `description` traducibile
- [ ] Genre.name traducibile, Genre.slug sincronizzato
- [ ] URL routing: `/it/artisti/` e `/en/artists/` funzionanti
- [ ] Pannello traduzione visibile in admin per tutte le Page configurate
- [ ] Gemini Translator funzionante come machine translator
- [ ] Gemini API key letta da MagixSiteSettings
- [ ] Traduzione automatica IT→EN funzionante con un click in admin
- [ ] File `.po` creabili in `locale/` per stringhe UI gettext

---

## SEZIONE TDD

```python
# tests/test_gemini_translator.py
import pytest
from unittest.mock import patch, MagicMock

@pytest.mark.django_db
class TestGeminiTranslator:
    def test_can_translate_it_en(self):
        from core.gemini_translator import GeminiTranslator
        translator = GeminiTranslator(options={})
        with patch.object(translator, '_get_api_key', return_value='fake-key'):
            source = MagicMock(language_code="it")
            target = MagicMock(language_code="en")
            assert translator.can_translate(source, target) is True

    def test_cannot_translate_without_key(self):
        from core.gemini_translator import GeminiTranslator
        translator = GeminiTranslator(options={})
        with patch.object(translator, '_get_api_key', return_value=None):
            source = MagicMock(language_code="it")
            target = MagicMock(language_code="en")
            assert translator.can_translate(source, target) is False

    def test_unsupported_language(self):
        from core.gemini_translator import GeminiTranslator
        translator = GeminiTranslator(options={})
        with patch.object(translator, '_get_api_key', return_value='fake-key'):
            source = MagicMock(language_code="it")
            target = MagicMock(language_code="zh")  # Cinese non supportato
            assert translator.can_translate(source, target) is False
```

---

## SECURITY CHECKLIST

- [ ] Gemini API key NON esposta nei log o nell'API pubblica
- [ ] Rate limiting sulle chiamate Gemini (evitare costi eccessivi)
- [ ] Validazione input: non passare HTML pericoloso al traduttore
- [ ] Traduzione in ambiente di draft (non pubblica automaticamente)
