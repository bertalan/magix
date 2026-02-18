"""Machine translator per wagtail-localize basato su Google Gemini API.

Legge la API key da MagixSiteSettings (campo gemini_api_key).
Lingue supportate: IT, EN, FR, DE, ES, PT.
"""
import json
import logging

import requests
from wagtail.models import Site
from wagtail_localize.machine_translators.base import BaseMachineTranslator
from wagtail_localize.strings import StringValue

logger = logging.getLogger(__name__)

SUPPORTED_LANGUAGES = {"it", "en", "fr", "de", "es", "pt"}

LANGUAGE_NAMES = {
    "it": "Italian",
    "en": "English",
    "fr": "French",
    "de": "German",
    "es": "Spanish",
    "pt": "Portuguese",
}

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"


class GeminiTranslator(BaseMachineTranslator):
    """Traduttore automatico che usa Google Gemini per wagtail-localize."""

    display_name = "Google Gemini"

    def _get_api_key(self):
        """Recupera la Gemini API key da MagixSiteSettings."""
        from core.models import MagixSiteSettings

        site = Site.objects.filter(is_default_site=True).first()
        if not site:
            logger.error("Nessun sito di default trovato per Gemini API key.")
            return None
        settings = MagixSiteSettings.for_site(site)
        return settings.gemini_api_key or None

    def can_translate(self, source_locale, target_locale):
        """Verifica se la coppia di lingue e' supportata."""
        source_code = source_locale.language_code.lower()
        target_code = target_locale.language_code.lower()
        return source_code in SUPPORTED_LANGUAGES and target_code in SUPPORTED_LANGUAGES

    def translate(self, source_locale, target_locale, strings):
        """Traduce una lista di StringValue usando Gemini API.

        Args:
            source_locale: Locale sorgente.
            target_locale: Locale destinazione.
            strings: Lista di StringValue da tradurre.

        Returns:
            dict: Mapping {StringValue originale: StringValue tradotta}.
        """
        api_key = self._get_api_key()
        if not api_key:
            logger.error("Gemini API key non configurata in MagixSiteSettings.")
            return {}

        source_lang = LANGUAGE_NAMES.get(
            source_locale.language_code.lower(), source_locale.language_code
        )
        target_lang = LANGUAGE_NAMES.get(
            target_locale.language_code.lower(), target_locale.language_code
        )

        translations = {}

        # Traduci in batch per efficienza
        texts = [string.render_text() for string in strings]

        if not texts:
            return translations

        prompt = (
            f"Translate the following texts from {source_lang} to {target_lang}. "
            f"Return a JSON array of translated strings, maintaining the exact same order. "
            f"Preserve any HTML tags exactly as they are. "
            f"Do not add any explanation, only return the JSON array.\n\n"
            f"Texts to translate:\n{json.dumps(texts, ensure_ascii=False)}"
        )

        try:
            response = requests.post(
                GEMINI_API_URL,
                params={"key": api_key},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": 0.1,
                        "responseMimeType": "application/json",
                    },
                },
                timeout=60,
            )
            response.raise_for_status()

            data = response.json()
            content_text = (
                data.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "")
            )

            translated_texts = json.loads(content_text)

            if len(translated_texts) != len(strings):
                logger.warning(
                    "Gemini ha restituito %d traduzioni per %d stringhe. "
                    "Alcune traduzioni potrebbero mancare.",
                    len(translated_texts),
                    len(strings),
                )

            for original, translated in zip(strings, translated_texts):
                translations[original] = StringValue.from_plaintext(translated)

        except requests.RequestException:
            logger.exception("Errore nella richiesta a Gemini API.")
        except (json.JSONDecodeError, KeyError, IndexError):
            logger.exception("Errore nel parsing della risposta Gemini.")

        return translations
