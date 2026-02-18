"""API per ricerca globale su artisti ed eventi."""
from django.http import JsonResponse


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
        return JsonResponse({"results": [], "query": query_string})

    results = []

    if search_type in ("all", "artists"):
        from artists.models import ArtistPage

        artist_results = ArtistPage.objects.live().search(
            query_string, operator="or"
        )[:limit]
        for page in artist_results:
            image_url = None
            if page.main_image:
                try:
                    image_url = page.main_image.get_rendition(
                        "fill-200x200|format-webp"
                    ).url
                except Exception:
                    pass
            results.append(
                {
                    "type": "artist",
                    "id": page.id,
                    "title": page.title,
                    "slug": page.slug,
                    "genre": ", ".join(g.name for g in page.genres.all()),
                    "image_url": image_url,
                }
            )

    if search_type in ("all", "events"):
        from events.models import EventPage

        event_results = (
            EventPage.objects.live()
            .filter(is_archived=False)
            .search(query_string, operator="or")[:limit]
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

    suggestions = [
        {
            "id": page.id,
            "name": page.title,
            "slug": page.slug,
            "genre": ", ".join(g.name for g in page.genres.all()),
        }
        for page in results
    ]

    return JsonResponse({"query": query_string, "suggestions": suggestions})
