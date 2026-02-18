# TASK 20 — SEO & Structured Data (JSON-LD)

> **Agente:** Backend + Frontend  
> **Fase:** 5 — Qualità & Ottimizzazione  
> **Dipendenze:** Task 03, Task 04, Task 13  
> **Stima:** 25 min  

---

## OBIETTIVO

Implementare SEO tecnico e dati strutturati Schema.org per massimizzare la visibilità su Google. Include:
1. JSON-LD per MusicGroup, Event, LocalBusiness
2. Meta tags Open Graph e Twitter Cards
3. Sitemap XML e robots.txt
4. Canonical URLs con hreflang IT/EN

---

## FILES_IN_SCOPE (da leggere)

- `idea/5-frontend-ux-inclusive.md` — Sezione SEO
- `idea/4-dev-guidelines.md` — Sezione SEO

---

## OUTPUT_ATTESO

### Backend
```
core/
├── seo.py                    # Helper functions JSON-LD
├── templatetags/
│   ├── __init__.py
│   └── seo_tags.py           # Template tag per JSON-LD
artists/
├── seo.py                    # JSON-LD per ArtistPage
events/
├── seo.py                    # JSON-LD per EventPage
templates/
├── base.html                 # Meta tags block
```

### Frontend
```
frontend/src/components/
├── SEOHead.tsx               # Componente per meta tag dinamici
```

---

## SPECIFICHE

### 1. JSON-LD MusicGroup (per ArtistPage)

```python
# artists/seo.py
"""Generazione JSON-LD Schema.org per artisti."""
import json
from typing import Any


def artist_jsonld(page) -> str:
    """Genera JSON-LD Schema.org/MusicGroup per una ArtistPage."""
    data: dict[str, Any] = {
        "@context": "https://schema.org",
        "@type": "MusicGroup",
        "name": page.title,
        "description": page.bio[:200] if page.bio else "",
        "url": page.full_url,
        "genre": [g.name for g in page.genres.all()],
    }

    # Immagine
    if page.card_image:
        data["image"] = page.card_image.get_rendition("fill-800x600").url

    # Video promo
    if page.hero_video_url:
        data["video"] = {
            "@type": "VideoObject",
            "url": page.hero_video_url,
            "name": f"Video promo {page.title}",
        }

    # Social
    same_as = []
    if page.social_instagram:
        same_as.append(page.social_instagram)
    if page.social_facebook:
        same_as.append(page.social_facebook)
    if page.social_spotify:
        same_as.append(page.social_spotify)
    if same_as:
        data["sameAs"] = same_as

    # Eventi futuri
    events = page.get_children().live().filter(eventpage__is_archived=False)
    if events.exists():
        data["event"] = [
            {
                "@type": "MusicEvent",
                "name": ev.title,
                "startDate": ev.specific.date_start.isoformat() if hasattr(ev.specific, "date_start") else "",
                "location": {
                    "@type": "Place",
                    "name": ev.specific.venue.name if ev.specific.venue else "",
                },
            }
            for ev in events[:5]
        ]

    return json.dumps(data, ensure_ascii=False)
```

### 2. JSON-LD Event (per EventPage)

```python
# events/seo.py
"""Generazione JSON-LD Schema.org per eventi."""
import json
from typing import Any


def event_jsonld(page) -> str:
    """Genera JSON-LD Schema.org/MusicEvent per una EventPage."""
    data: dict[str, Any] = {
        "@context": "https://schema.org",
        "@type": "MusicEvent",
        "name": page.title,
        "startDate": page.date_start.isoformat() if page.date_start else "",
        "url": page.full_url,
        "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    }

    if page.date_end:
        data["endDate"] = page.date_end.isoformat()

    # Venue / Location
    if page.venue:
        location: dict[str, Any] = {
            "@type": "Place",
            "name": page.venue.name,
        }
        if page.venue.city:
            location["address"] = {
                "@type": "PostalAddress",
                "addressLocality": page.venue.city,
                "addressRegion": page.venue.region or "",
                "postalCode": page.venue.zip_code or "",
                "addressCountry": str(page.venue.country) if page.venue.country else "IT",
            }
        if page.venue.latitude and page.venue.longitude:
            location["geo"] = {
                "@type": "GeoCoordinates",
                "latitude": float(page.venue.latitude),
                "longitude": float(page.venue.longitude),
            }
        data["location"] = location

    # Artista / Performer
    if page.artist:
        data["performer"] = {
            "@type": "MusicGroup",
            "name": page.artist.title,
            "url": page.artist.full_url,
        }

    # Organizer
    data["organizer"] = {
        "@type": "Organization",
        "name": "Magix Promotion",
        "url": "https://www.magixpromotion.it",
    }

    return json.dumps(data, ensure_ascii=False)
```

### 3. JSON-LD LocalBusiness (per HomePage)

```python
# core/seo.py
"""JSON-LD per homepage e pagine generiche.
Legge i dati aziendali da MagixSiteSettings (CMS)."""
import json
from wagtail.models import Site


def homepage_jsonld() -> str:
    """JSON-LD Schema.org/EntertainmentBusiness per Magix Promotion.
    Dati dinamici da MagixSiteSettings."""
    from core.models import MagixSiteSettings

    try:
        site = Site.objects.get(is_default_site=True)
        settings = MagixSiteSettings.for_site(site)
    except Exception:
        settings = None

    data = {
        "@context": "https://schema.org",
        "@type": "EntertainmentBusiness",
        "name": getattr(settings, 'company_name', 'Magix Promotion'),
        "description": "Agenzia di band e artisti musicali per eventi in Italia e nel mondo.",
        "url": "https://www.magixpromotion.it",
        "telephone": getattr(settings, 'phone', '+39 335 523 0855'),
        "email": getattr(settings, 'email', 'info@magixpromotion.it'),
        "address": {
            "@type": "PostalAddress",
            "streetAddress": getattr(settings, 'address_street', 'Via dello Scabiolo'),
            "addressLocality": getattr(settings, 'address_city', 'Novi Ligure'),
            "postalCode": getattr(settings, 'address_zip', '15067'),
            "addressRegion": getattr(settings, 'address_region', 'Piemonte'),
            "addressCountry": getattr(settings, 'address_country', 'IT'),
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": float(settings.lat) if settings and settings.lat else 44.7631,
            "longitude": float(settings.lng) if settings and settings.lng else 8.7873,
        },
        "areaServed": {
            "@type": "GeoCircle",
            "geoMidpoint": {
                "@type": "GeoCoordinates",
                "latitude": float(settings.lat) if settings and settings.lat else 44.7631,
                "longitude": float(settings.lng) if settings and settings.lng else 8.7873,
            },
            "geoRadius": "500",
        },
        "priceRange": "€€",
        "knowsLanguage": ["it", "en"],
    }
    return json.dumps(data, ensure_ascii=False)
```

### 4. Template Tag per JSON-LD

```python
# core/templatetags/seo_tags.py
from django import template
from django.utils.safestring import mark_safe
from core.seo import homepage_jsonld

register = template.Library()


@register.simple_tag(takes_context=True)
def page_jsonld(context):
    """Inserisce JSON-LD appropriato per la pagina corrente."""
    page = context.get("page") or context.get("self")
    if not page:
        return ""

    page_class = page.specific_class.__name__

    if page_class == "ArtistPage":
        from artists.seo import artist_jsonld
        script = artist_jsonld(page.specific)
    elif page_class == "EventPage":
        from events.seo import event_jsonld
        script = event_jsonld(page.specific)
    elif page_class == "HomePage":
        script = homepage_jsonld()
    else:
        return ""

    return mark_safe(f'<script type="application/ld+json">{script}</script>')
```

### 5. Meta Tags — Frontend SEOHead.tsx

```tsx
import React from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: "website" | "music.musician" | "music.event";
}

/**
 * Componente per gestire meta tag dinamici via document.head.
 * In una SPA senza SSR, usa useEffect per aggiornare i meta tag.
 */
const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  image,
  url,
  type = "website",
}) => {
  React.useEffect(() => {
    // Title
    document.title = `${title} | Magix Promotion`;

    // Meta tags
    const metas: Record<string, string> = {
      description: description,
      "og:title": title,
      "og:description": description,
      "og:type": type,
      "og:site_name": "Magix Promotion",
      "twitter:card": "summary_large_image",
      "twitter:title": title,
      "twitter:description": description,
    };
    if (image) {
      metas["og:image"] = image;
      metas["twitter:image"] = image;
    }
    if (url) {
      metas["og:url"] = url;
    }

    Object.entries(metas).forEach(([name, content]) => {
      const attr = name.startsWith("og:") || name.startsWith("twitter:") ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    });
  }, [title, description, image, url, type]);

  return null;
};

export default SEOHead;
```

### 6. Sitemap e robots.txt (backend)

```python
# config/urls.py — Aggiungere
from django.contrib.sitemaps.views import sitemap
from wagtail.contrib.sitemaps.views import sitemap as wagtail_sitemap

urlpatterns += [
    path("sitemap.xml", wagtail_sitemap),
    # robots.txt servito come template o via Nginx
]
```

Settings:
```python
# settings/base.py
INSTALLED_APPS += ["wagtail.contrib.sitemaps"]
```

---

## NOTE IMPLEMENTATIVE

1. **JSON-LD server-side:** Generato nel backend Django per essere visibile ai crawler. La SPA React non è indicizzabile senza SSR.
2. **homepage_jsonld dinamico:** Legge telefono, email, indirizzo da `MagixSiteSettings`. Se il model non è configurato, usa valori di default (hardcoded come fallback).
3. **event_jsonld internazionale:** Usa `venue.country` (da CountryField) invece di hardcoded "IT". Include `geo` se il venue ha coordinate.
4. **SEOHead client-side:** Utile solo per sharing link e social preview. Per SEO reale, servire la pagina con Django template fallback.
3. **Schema.org types:** `MusicGroup` per artisti, `MusicEvent` per eventi, `EntertainmentBusiness` per il brand.
4. **hreflang:** Gestito da wagtail-localize automaticamente se le pagine tradotte esistono.
5. **Sitemap:** Wagtail ha un contrib integrato che genera sitemap XML automaticamente.

---

## CRITERI DI ACCETTAZIONE

- [ ] JSON-LD MusicGroup presente nelle pagine artista
- [ ] JSON-LD MusicEvent presente nelle pagine evento  
- [ ] JSON-LD LocalBusiness presente nella homepage
- [ ] Meta Open Graph generati per ogni pagina
- [ ] Sitemap XML accessibile a `/sitemap.xml`
- [ ] Template tag `{% page_jsonld %}` funzionante
- [ ] SEOHead React aggiorna document.title e meta tags
- [ ] JSON-LD valido (testabile su search.google.com/test/rich-results)

---

## SEZIONE TDD

```python
# tests/test_seo.py
import pytest
import json

@pytest.mark.django_db
class TestHomepageJsonLD:
    def test_contains_real_phone(self, home_page):
        from core.seo import homepage_jsonld
        data = json.loads(homepage_jsonld())
        # Deve avere un telefono (non placeholder XXX)
        assert "XXX" not in data.get("telephone", "")

    def test_contains_address_fields(self, home_page):
        from core.seo import homepage_jsonld
        data = json.loads(homepage_jsonld())
        addr = data["address"]
        assert addr["addressCountry"] in ("IT", "it")
        assert len(addr.get("streetAddress", "")) > 0

@pytest.mark.django_db
class TestEventJsonLD:
    def test_venue_country_from_model(self, home_page):
        """Verifica che il paese venga dal model, non hardcoded."""
        from events.seo import event_jsonld
        # Questo test va implementato con un EventPage + Venue con country="CH"
        pass
```

---

## SECURITY CHECKLIST

- [ ] JSON-LD non espone API keys o dati sensibili
- [ ] Email e telefono sono dati pubblici aziendali (OK)
- [ ] Nessun dato utente nella structured data
