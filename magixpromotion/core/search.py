"""API per ricerca globale su artisti ed eventi."""
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

    try:
        limit = min(int(request.GET.get("limit", "10")), 50)
    except (ValueError, TypeError):
        limit = 10

    if not query_string or len(query_string) < 2:
        return JsonResponse({"results": [], "query": query_string, "total": 0})

    results = []

    if search_type in ("all", "artists"):
        from artists.models import ArtistPage

        artist_results = ArtistPage.objects.live().search(
            query_string, operator="or"
        )[:limit]
        if not artist_results:
            artist_results = (
                ArtistPage.objects.live()
                .filter(
                    Q(title__icontains=query_string)
                    | Q(short_bio__icontains=query_string)
                    | Q(tribute_to__icontains=query_string)
                    | Q(genres__name__icontains=query_string)
                )
                .distinct()
                .order_by("title")[:limit]
            )
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

        event_results = (
            EventPage.objects.live()
            .filter(is_archived=False)
            .search(query_string, operator="or")[:limit]
        )
        if not event_results:
            event_results = (
                EventPage.objects.live()
                .filter(is_archived=False)
                .filter(
                    Q(title__icontains=query_string)
                    | Q(description__icontains=query_string)
                    | Q(venue__name__icontains=query_string)
                    | Q(venue__city__icontains=query_string)
                )
                .distinct()
                .order_by("start_date")[:limit]
            )
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

    try:
        limit = min(int(request.GET.get("limit", "5")), 20)
    except (ValueError, TypeError):
        limit = 5

    if not query_string or len(query_string) < 2:
        return JsonResponse({"suggestions": []})

    from artists.models import ArtistPage

    results = ArtistPage.objects.live().autocomplete(query_string)[:limit]

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
