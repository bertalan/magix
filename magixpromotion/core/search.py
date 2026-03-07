"""API per ricerca globale su artisti ed eventi."""
from difflib import SequenceMatcher
import unicodedata

from django.db.models import Q
from django.http import JsonResponse


def _safe_rendition_url(image, spec):
    """Ritorna la URL di una rendition, se disponibile."""
    if not image:
        return None
    try:
        return image.get_rendition(spec).full_url
    except Exception:
        return None


def _normalize_search_text(value):
    """Normalizza il testo per confronti search/fuzzy."""
    normalized = unicodedata.normalize("NFKD", value or "")
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    return " ".join(ascii_text.lower().split())


def _resolve_locale_code(request):
    """Ricava il codice lingua da querystring o header."""
    locale = request.GET.get("locale") or request.GET.get("lang")
    if not locale:
        locale = request.headers.get("Accept-Language", "")

    locale = (locale or "").split(",")[0].strip().lower()
    if not locale:
        return None
    return locale.split("-")[0]


def _apply_locale_filter(queryset, locale_code):
    """Filtra il queryset sulla lingua richiesta, se presente."""
    if not locale_code:
        return queryset
    return queryset.filter(locale__language_code=locale_code)


def _filter_pages_for_locale(pages, locale_code, limit):
    """Filtra una sequenza di pagine per lingua dopo una full-text search."""
    if not locale_code:
        return list(pages)[:limit]

    filtered = [
        page for page in pages
        if getattr(getattr(page, "locale", None), "language_code", None) == locale_code
    ]
    return filtered[:limit]


def _fuzzy_score(query_string, *values):
    """Ritorna uno score fuzzy basato sui token disponibili."""
    normalized_query = _normalize_search_text(query_string)
    if len(normalized_query) < 3:
        return 0.0

    best_score = 0.0
    for value in values:
        normalized_value = _normalize_search_text(value)
        if not normalized_value:
            continue

        if normalized_query in normalized_value:
            return 1.0

        best_score = max(
            best_score,
            SequenceMatcher(None, normalized_query, normalized_value).ratio(),
        )

        for token in normalized_value.split():
            best_score = max(
                best_score,
                SequenceMatcher(None, normalized_query, token).ratio(),
            )

    return best_score


def _fuzzy_match_artists(queryset, query_string, limit):
    """Fallback fuzzy per artisti quando la full-text non trova risultati."""
    candidates = list(
        queryset.select_related("main_image").prefetch_related("genres", "target_events")
    )
    scored = []
    for page in candidates:
        score = _fuzzy_score(
            query_string,
            page.title,
            page.short_bio,
            page.tribute_to,
            " ".join(g.name for g in page.genres.all()),
        )
        if score >= 0.78:
            scored.append((score, page.title.lower(), page))

    scored.sort(key=lambda item: (-item[0], item[1]))
    return [page for _, _, page in scored[:limit]]


def _fuzzy_match_events(queryset, query_string, limit):
    """Fallback fuzzy per eventi quando la full-text non trova risultati."""
    candidates = list(queryset.select_related("venue"))
    scored = []
    for page in candidates:
        score = _fuzzy_score(
            query_string,
            page.title,
            page.description,
            page.venue.name if page.venue else "",
            page.venue.city if page.venue else "",
        )
        if score >= 0.78:
            scored.append((score, page.title.lower(), page))

    scored.sort(key=lambda item: (-item[0], item[1]))
    return [page for _, _, page in scored[:limit]]


def _serialize_artist_result(page):
    """Serializza un artista in formato compatibile con la UI roster."""
    genre_display = ", ".join(g.name for g in page.genres.all())
    tags = [g.name for g in page.genres.all()]
    if hasattr(page, "target_events"):
        tags += [target.name for target in page.target_events.all()]

    return {
        "type": "artist",
        "id": page.id,
        "title": page.title,
        "slug": page.slug,
        "genre": genre_display,
        "genre_display": genre_display,
        "image_url": _safe_rendition_url(
            page.main_image,
            "fill-800x1200|format-webp",
        ),
        "image_thumb": _safe_rendition_url(
            page.main_image,
            "fill-40x60|format-webp",
        ),
        "artist_type": page.artist_type,
        "short_bio": page.short_bio,
        "tags": tags,
        "tribute_to": page.tribute_to,
        "hero_video_url": page.hero_video_url,
        "base_country": str(page.base_country) if page.base_country else "",
        "base_region": page.base_region,
        "base_city": page.base_city,
    }


def search_api(request):
    """Ricerca full-text su artisti e/o eventi.

    GET /api/v2/search/?q=<query>&type=all|artists|events&limit=10

    Parametri:
        q: stringa di ricerca (minimo 2 caratteri)
        type: "all" (default), "artists", "events"
        limit: max risultati (default 10, max 50)

    Ritorna JSON con risultati unificati.
    """
    query_string = request.GET.get("q", "").strip()
    search_type = request.GET.get("type", "all")
    locale_code = _resolve_locale_code(request)

    try:
        limit = min(int(request.GET.get("limit", "10")), 50)
    except (ValueError, TypeError):
        limit = 10

    if not query_string or len(query_string) < 2:
        return JsonResponse({"results": [], "query": query_string, "total": 0})

    results = []

    if search_type in ("all", "artists"):
        from artists.models import ArtistPage

        artist_search_qs = ArtistPage.objects.live()
        artist_base_qs = _apply_locale_filter(artist_search_qs, locale_code)

        artist_results = _filter_pages_for_locale(
            artist_search_qs.search(query_string, operator="or")[: limit * 4],
            locale_code,
            limit,
        )
        if not artist_results:
            artist_results = (
                artist_base_qs
                .filter(
                    Q(title__icontains=query_string)
                    | Q(short_bio__icontains=query_string)
                    | Q(tribute_to__icontains=query_string)
                    | Q(genres__name__icontains=query_string)
                )
                .distinct()
                .order_by("title")[:limit]
            )
        if not artist_results:
            artist_results = _fuzzy_match_artists(artist_base_qs, query_string, limit)
        # Prefetch generi, target event e immagine per evitare N+1 query
        artist_ids = [p.id for p in artist_results]
        prefetched = {
            a.id: a
            for a in ArtistPage.objects.filter(
                id__in=artist_ids
            ).prefetch_related("genres", "target_events").select_related("main_image")
        }
        for page_id in artist_ids:
            page = prefetched.get(page_id)
            if not page:
                continue
            results.append(_serialize_artist_result(page))

    if search_type in ("all", "events"):
        from events.models import EventPage

        event_search_qs = EventPage.objects.live().filter(is_archived=False)
        event_base_qs = _apply_locale_filter(
            EventPage.objects.live().filter(is_archived=False),
            locale_code,
        )

        event_results = _filter_pages_for_locale(
            event_search_qs.search(query_string, operator="or")[: limit * 4],
            locale_code,
            limit,
        )
        if not event_results:
            event_results = (
                event_base_qs
                .filter(
                    Q(title__icontains=query_string)
                    | Q(description__icontains=query_string)
                    | Q(venue__name__icontains=query_string)
                    | Q(venue__city__icontains=query_string)
                )
                .distinct()
                .order_by("start_date")[:limit]
            )
        if not event_results:
            event_results = _fuzzy_match_events(event_base_qs, query_string, limit)
        for page in event_results:
            results.append(
                {
                    "type": "event",
                    "id": page.id,
                    "title": page.title,
                    "slug": page.slug,
                    "start_date": (
                        page.start_date.isoformat() if page.start_date else None
                    ),
                    "venue_name": page.venue.name if page.venue else "",
                    "city": page.venue.city if page.venue else "",
                }
            )

    return JsonResponse(
        {
            "query": query_string,
            "total": len(results),
            "results": results,
        }
    )


def autocomplete_api(request):
    """Suggerimenti autocomplete per la search bar.

    GET /api/v2/search/autocomplete/?q=<partial_query>&limit=5

    Parametri:
        q: stringa parziale (minimo 2 caratteri)
        limit: max suggerimenti (default 5, max 20)

    Ritorna JSON con suggerimenti artisti.
    """
    query_string = request.GET.get("q", "").strip()
    locale_code = _resolve_locale_code(request)

    try:
        limit = min(int(request.GET.get("limit", "5")), 20)
    except (ValueError, TypeError):
        limit = 5

    if not query_string or len(query_string) < 2:
        return JsonResponse({"suggestions": []})

    from artists.models import ArtistPage

    search_qs = ArtistPage.objects.live()
    base_qs = _apply_locale_filter(search_qs, locale_code)

    results = _filter_pages_for_locale(
        search_qs.autocomplete(query_string)[: limit * 4],
        locale_code,
        limit,
    )
    if not results:
        results = _fuzzy_match_artists(base_qs, query_string, limit)

    # Prefetch genres per evitare N+1 query
    result_ids = [p.id for p in results]
    prefetched = {
        a.id: a
        for a in ArtistPage.objects.filter(
            id__in=result_ids
        ).prefetch_related("genres")
    }

    suggestions = [
        {
            "id": page.id,
            "name": page.title,
            "slug": page.slug,
            "genre": ", ".join(g.name for g in page.genres.all()),
        }
        for page in (prefetched.get(pid) for pid in result_ids)
        if page is not None
    ]

    return JsonResponse({"query": query_string, "suggestions": suggestions})
