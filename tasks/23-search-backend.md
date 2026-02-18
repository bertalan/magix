# TASK 23 — Ricerca Full-Text (PostgreSQL)

> **Agente:** Backend  
> **Fase:** 5 — Qualità & Ottimizzazione  
> **Dipendenze:** Task 01, Task 03, Task 04  
> **Stima:** 20 min  

---

## OBIETTIVO

Configurare il motore di ricerca Wagtail con PostgreSQL full-text search. Include:
1. Backend di ricerca PostgreSQL (non il default database)
2. Configurazione `search_fields` per ArtistPage e EventPage
3. API endpoint di ricerca globale
4. Supporto autocomplete per la search bar frontend

---

## FILES_IN_SCOPE (da leggere)

- `idea/4-dev-guidelines.md` — Sezione ricerca

---

## OUTPUT_ATTESO

```
config/settings/
├── base.py                # WAGTAILSEARCH_BACKENDS config
core/
├── search.py              # Vista ricerca globale API
```

---

## SPECIFICHE

### 1. Backend di ricerca PostgreSQL

```python
# config/settings/base.py

WAGTAILSEARCH_BACKENDS = {
    "default": {
        "BACKEND": "wagtail.search.backends.database",
        "SEARCH_CONFIG": "italian",  # Configurazione linguistica PostgreSQL
        "AUTO_UPDATE": True,
    }
}
```

**Importante:** La configurazione `"italian"` usa il dizionario PostgreSQL italiano per:
- Stemming (es: "cantare" → "cant")
- Stop words (es: "il", "la", "di")
- Accented characters

### 2. Search Fields — ArtistPage

```python
# artists/models.py — Aggiornare search_fields

class ArtistPage(Page):
    # ... campi ...

    search_fields = Page.search_fields + [
        index.SearchField("bio", boost=2),
        index.SearchField("tribute_to"),
        index.AutocompleteField("title", boost=10),
        index.AutocompleteField("bio"),
        index.FilterField("artist_type"),
        index.RelatedFields("genres", [
            index.SearchField("name", boost=3),
        ]),
    ]
```

**Note sui boost:**
- `title` boost=10: il nome artista è il match più rilevante
- `genres.name` boost=3: il genere è il secondo fattore
- `bio` boost=2: la bio contiene keywords descrittive
- `tribute_to`: per cercare "tributo Queen" e trovare la band giusta

### 3. Search Fields — EventPage

```python
# events/models.py — Aggiornare search_fields

class EventPage(Page):
    # ... campi ...

    search_fields = Page.search_fields + [
        index.SearchField("title", boost=5),
        index.AutocompleteField("title"),
        index.FilterField("status"),
        index.FilterField("is_archived"),
        index.RelatedFields("venue", [
            index.SearchField("name", boost=3),
            index.SearchField("city", boost=2),
        ]),
        index.RelatedFields("artist", [
            index.SearchField("title", boost=4),
        ]),
    ]
```

### 4. API Ricerca Globale

```python
# core/search.py
"""API per ricerca globale su artisti ed eventi."""
from django.http import JsonResponse
from wagtail.models import Page
from wagtail.search.models import Query


def search_api(request):
    """
    GET /api/v2/search/?q=<query>&type=all|artists|events&limit=10

    Ritorna risultati di ricerca su artisti e/o eventi.
    """
    query_string = request.GET.get("q", "").strip()
    search_type = request.GET.get("type", "all")
    limit = min(int(request.GET.get("limit", "10")), 50)

    if not query_string or len(query_string) < 2:
        return JsonResponse({"results": [], "query": query_string})

    # Registra la query per analytics
    Query.get(query_string).add_hit()

    results = []

    if search_type in ("all", "artists"):
        from artists.models import ArtistPage
        artist_results = ArtistPage.objects.live().search(
            query_string, operator="or"
        )[:limit]
        results.extend([
            {
                "type": "artist",
                "id": page.id,
                "title": page.title,
                "slug": page.slug,
                "genre": ", ".join(g.name for g in page.genres.all()),
                "image_url": (
                    page.card_image.get_rendition("fill-200x200|format-webp").url
                    if page.card_image else None
                ),
            }
            for page in artist_results
        ])

    if search_type in ("all", "events"):
        from events.models import EventPage
        event_results = EventPage.objects.live().filter(
            is_archived=False
        ).search(query_string, operator="or")[:limit]
        results.extend([
            {
                "type": "event",
                "id": page.id,
                "title": page.title,
                "slug": page.slug,
                "date_start": page.date_start.isoformat() if page.date_start else None,
                "venue_name": page.venue.name if page.venue else "",
                "city": page.venue.city if page.venue else "",
            }
            for page in event_results
        ])

    return JsonResponse({
        "query": query_string,
        "total": len(results),
        "results": results,
    })


def autocomplete_api(request):
    """
    GET /api/v2/search/autocomplete/?q=<partial_query>&limit=5

    Ritorna suggerimenti autocomplete per la search bar.
    """
    query_string = request.GET.get("q", "").strip()
    limit = min(int(request.GET.get("limit", "5")), 20)

    if not query_string or len(query_string) < 2:
        return JsonResponse({"suggestions": []})

    from artists.models import ArtistPage
    results = ArtistPage.objects.live().autocomplete(query_string)[:limit]

    suggestions = [
        {
            "id": page.id,
            "name": page.title,
            "genre": ", ".join(g.name for g in page.genres.all()),
        }
        for page in results
    ]

    return JsonResponse({"query": query_string, "suggestions": suggestions})
```

### 5. URL patterns

```python
# config/urls.py — Aggiungere
from core.search import search_api, autocomplete_api

urlpatterns += [
    path("api/v2/search/", search_api, name="search_api"),
    path("api/v2/search/autocomplete/", autocomplete_api, name="autocomplete_api"),
]
```

### 6. Management Command — Rebuild Index

```bash
# Dopo il deploy o import dati, ricostruire l'indice
python manage.py update_index
```

### 7. Frontend Hook

```typescript
// frontend/src/hooks/useSearch.ts
import { useState } from "react";

interface SearchResult {
  type: "artist" | "event";
  id: number;
  title: string;
  slug: string;
  genre?: string;
  image_url?: string;
  date_start?: string;
  venue_name?: string;
  city?: string;
}

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (query: string, type = "all") => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/v2/search/?q=${encodeURIComponent(query)}&type=${type}`
      );
      const data = await res.json();
      setResults(data.results);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, search };
}
```

---

## NOTE IMPLEMENTATIVE

1. **PostgreSQL vs Elasticsearch:** Per un sito con ~30-50 artisti, PostgreSQL full-text search è più che sufficiente. Nessun bisogno di Elasticsearch.
2. **`SEARCH_CONFIG: "italian"`:** Usa il dizionario PostgreSQL `italian` per stemming e stop words. Richiede `postgresql-contrib` installato.
3. **AutocompleteField:** Genera un trigram index per ricerca fuzzy/parziale. Richiede `pg_trgm` extension.
4. **Query analytics:** `Query.get(q).add_hit()` registra le ricerche per le statistiche nel pannello Wagtail admin.
5. **Operator `or`:** Cerca pagine che contengono ALMENO UNA delle parole. Più permissivo di `and`.
6. **rebuild_index:** Da eseguire dopo import CSV o deploy. Wagtail aggiorna l'indice automaticamente su save delle pagine (Auto_update=True).

---

## CRITERI DI ACCETTAZIONE

- [ ] `WAGTAILSEARCH_BACKENDS` configurato con backend database + config italian
- [ ] `search_fields` definiti per ArtistPage con boost appropriati
- [ ] `search_fields` definiti per EventPage con venue/artist relati
- [ ] `GET /api/v2/search/?q=rock` ritorna artisti e eventi
- [ ] `GET /api/v2/search/autocomplete/?q=re` ritorna suggerimenti
- [ ] Ricerca funziona con stemming italiano ("cantanti" trova "cantante")
- [ ] Query analytics registrate in Wagtail admin
- [ ] `python manage.py update_index` completa senza errori
- [ ] Hook `useSearch` funzionante nel frontend
- [ ] Minimo 2 caratteri per attivare la ricerca
