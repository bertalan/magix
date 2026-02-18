"""
Backend proxy per Gemini AI — BandFinder API.

Accetta una query utente e un pool di artisti, chiama l'API Gemini
server-side e restituisce l'artista suggerito con reasoning e vibeScore.
Questo evita di esporre la chiave API Gemini nel frontend.
"""
import json
import logging
import os

import requests as http_requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_POST

logger = logging.getLogger(__name__)

GEMINI_ENDPOINT = (
    "https://generativelanguage.googleapis.com/v1beta/"
    "models/gemini-2.0-flash:generateContent"
)


def _get_gemini_api_key():
    """Recupera la chiave Gemini, prima dalle SiteSettings poi dall'env."""
    try:
        from wagtail.models import Site
        from core.models import MagixSiteSettings

        site = Site.objects.filter(is_default_site=True).first()
        if site:
            site_settings = MagixSiteSettings.for_site(site)
            if site_settings.gemini_api_key:
                return site_settings.gemini_api_key
    except Exception:
        pass

    return os.environ.get("GEMINI_API_KEY", "")


def _get_company_info():
    """Legge informazioni aziendali dalle SiteSettings."""
    try:
        from wagtail.models import Site
        from core.models import MagixSiteSettings

        site = Site.objects.filter(is_default_site=True).first()
        if site:
            settings = MagixSiteSettings.for_site(site)
            return {
                "name": settings.company_name or "l'agenzia",
                "location": f"{settings.city}, {str(settings.country)}"
                if settings.city
                else "Italia",
            }
    except Exception:
        pass

    return {"name": "l'agenzia", "location": "Italia"}


def _build_system_prompt(artist_pool: list, company_info: dict) -> str:
    agency_name = company_info.get("name", "l'agenzia")
    agency_location = company_info.get("location", "Italia")

    roster = json.dumps(
        [
            {
                "id": a["id"],
                "name": a["name"],
                "genre": a.get("genre", ""),
                "bio": a.get("bio", ""),
                "type": a.get("artist_type", ""),
                "tags": a.get("tags", []),
            }
            for a in artist_pool
        ],
        ensure_ascii=False,
    )

    return (
        f"Sei l'assistente BandFinder di {agency_name}, "
        f"agenzia di band e artisti musicali.\n"
        f"Il tuo compito è trovare l'artista o band più adatta alla "
        f"richiesta dell'utente nel nostro roster.\n\n"
        f"Contesto: L'agenzia ha sede in {agency_location} ma gestisce "
        f"eventi anche all'estero.\n"
        f"Le tipologie includono: Dance Show Band, Tributo Italiano, "
        f"Tributo Internazionale, DJ Set, Rock Band, Folk Band.\n\n"
        f"Roster disponibile:\n{roster}\n\n"
        f"REGOLE:\n"
        f"- Rispondi SEMPRE in italiano\n"
        f"- Sii professionale ma amichevole\n"
        f"- Il reasoning deve essere una frase breve e incisiva che "
        f"spiega il match\n"
        f"- Il vibeScore va da 1 a 10 dove 10 è match perfetto\n"
        f"- Scegli SOLO artisti dal roster fornito"
    )


@require_POST
@csrf_protect
def band_finder_api(request):
    """Endpoint POST /api/v2/band-finder/ — proxy verso Gemini AI."""

    # --- Parse body JSON ---
    try:
        body = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return JsonResponse(
            {"detail": "Formato JSON non valido."},
            status=400,
        )

    query = body.get("query", "").strip()
    artist_pool = body.get("artist_pool", [])

    if not query:
        return JsonResponse(
            {"detail": "Il campo 'query' è obbligatorio."},
            status=400,
        )
    if not artist_pool or not isinstance(artist_pool, list):
        return JsonResponse(
            {"detail": "Il campo 'artist_pool' deve essere un array non vuoto."},
            status=400,
        )

    # --- Chiave API ---
    api_key = _get_gemini_api_key()
    if not api_key:
        logger.error("BandFinder: chiave Gemini API non configurata.")
        return JsonResponse(
            {"detail": "Servizio AI non disponibile al momento."},
            status=503,
        )

    # --- Prompt e payload Gemini ---
    company_info = _get_company_info()
    system_prompt = _build_system_prompt(artist_pool, company_info)

    gemini_payload = {
        "system_instruction": {
            "parts": [{"text": system_prompt}],
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": query}],
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "artistId": {"type": "NUMBER"},
                    "reasoning": {"type": "STRING"},
                    "vibeScore": {"type": "NUMBER"},
                },
                "required": ["artistId", "reasoning", "vibeScore"],
            },
        },
    }

    # --- Chiamata Gemini ---
    try:
        resp = http_requests.post(
            GEMINI_ENDPOINT,
            params={"key": api_key},
            json=gemini_payload,
            timeout=30,
        )
    except http_requests.RequestException as exc:
        logger.exception("BandFinder: errore di rete verso Gemini: %s", exc)
        return JsonResponse(
            {"detail": "Errore di comunicazione con il servizio AI."},
            status=502,
        )

    if resp.status_code != 200:
        logger.error(
            "BandFinder: Gemini ha risposto con status %s — %s",
            resp.status_code,
            resp.text[:500],
        )
        return JsonResponse(
            {"detail": "Il servizio AI ha restituito un errore."},
            status=502,
        )

    # --- Parse risposta Gemini ---
    try:
        gemini_data = resp.json()
        text = (
            gemini_data["candidates"][0]["content"]["parts"][0]["text"]
        )
        result = json.loads(text)
    except (KeyError, IndexError, json.JSONDecodeError) as exc:
        logger.exception("BandFinder: risposta Gemini non parsabile: %s", exc)
        return JsonResponse(
            {"detail": "Risposta AI non valida."},
            status=502,
        )

    # Validazione campi minimi
    if not all(k in result for k in ("artistId", "reasoning", "vibeScore")):
        logger.error("BandFinder: campi mancanti nella risposta: %s", result)
        return JsonResponse(
            {"detail": "Risposta AI incompleta."},
            status=502,
        )

    return JsonResponse(
        {
            "artistId": result["artistId"],
            "reasoning": result["reasoning"],
            "vibeScore": result["vibeScore"],
        },
        status=200,
    )
