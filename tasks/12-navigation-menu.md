# TASK 12 — Sistema Menu Dinamico (Snippet)

> **Agente:** Backend  
> **Fase:** 3 — API & Integration  
> **Dipendenze:** Task 01  
> **Stima:** 20 min  

---

## OBIETTIVO

Creare un sistema di navigazione disaccoppiato dall'albero delle pagine Wagtail. Il menu è gestito tramite Snippet + Orderable, permettendo agli editor di comporre liberamente header e footer menu senza dipendere dalla struttura ad albero.

---

## FILES_IN_SCOPE (da leggere)

- `idea/2-logica-navigazione-i18n.md` — sezione 2.2 (Menu & Navigazione)

---

## OUTPUT_ATTESO

```
navigation/
├── models.py          # NavigationMenu, MenuItem
├── templatetags/
│   ├── __init__.py
│   └── navigation_tags.py    # Template tag per render menu
```

---

## SPECIFICHE

### 1. Modello Menu

```python
"""Sistema navigazione dinamico sganciato dall'albero pagine."""
from django.db import models
from modelcluster.fields import ParentalKey
from modelcluster.models import ClusterableModel
from wagtail.admin.panels import (
    FieldPanel,
    InlinePanel,
    MultiFieldPanel,
    PageChooserPanel,
)
from wagtail.models import Orderable
from wagtail.snippets.models import register_snippet


MENU_LOCATION_CHOICES = [
    ("header", "Header (Navigazione principale)"),
    ("footer_main", "Footer — Colonna principale"),
    ("footer_legal", "Footer — Link legali"),
    ("footer_social", "Footer — Social"),
    ("mobile", "Mobile menu"),
]


@register_snippet
class NavigationMenu(ClusterableModel):
    """Un menu navigazione gestibile da CMS."""

    title = models.CharField(
        max_length=100,
        verbose_name="Nome menu",
        help_text="Nome interno, non visibile al pubblico. Es: 'Header Menu IT'",
    )
    location = models.CharField(
        max_length=30,
        choices=MENU_LOCATION_CHOICES,
        verbose_name="Posizione",
    )
    language = models.CharField(
        max_length=5,
        choices=[("it", "Italiano"), ("en", "English")],
        default="it",
        verbose_name="Lingua",
    )

    panels = [
        FieldPanel("title"),
        FieldPanel("location"),
        FieldPanel("language"),
        InlinePanel("items", label="Voci di menu"),
    ]

    class Meta:
        verbose_name = "Menu navigazione"
        verbose_name_plural = "Menu navigazione"
        unique_together = [("location", "language")]

    def __str__(self) -> str:
        return f"{self.title} ({self.get_location_display()})"


class MenuItem(Orderable):
    """Singola voce di menu — punta a pagina interna o URL esterno."""

    menu = ParentalKey(
        NavigationMenu,
        on_delete=models.CASCADE,
        related_name="items",
    )
    title_override = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Titolo custom",
        help_text="Se vuoto, usa il titolo della pagina linkata.",
    )
    page_link = models.ForeignKey(
        "wagtailcore.Page",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        verbose_name="Pagina interna",
    )
    external_url = models.URLField(
        blank=True,
        verbose_name="URL esterno",
        help_text="Usato solo se 'Pagina interna' è vuoto.",
    )
    open_in_new_tab = models.BooleanField(
        default=False,
        verbose_name="Apri in nuova scheda",
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Icona",
        help_text="Nome icona Lucide React (es: 'music', 'calendar', 'mail').",
    )

    panels = [
        FieldPanel("title_override"),
        PageChooserPanel("page_link"),
        FieldPanel("external_url"),
        FieldPanel("open_in_new_tab"),
        FieldPanel("icon"),
    ]

    class Meta:
        ordering = ["sort_order"]

    @property
    def display_title(self) -> str:
        """Ritorna il titolo da mostrare nel menu."""
        if self.title_override:
            return self.title_override
        if self.page_link:
            return self.page_link.title
        return self.external_url or "—"

    @property
    def url(self) -> str:
        """Ritorna l'URL della voce di menu."""
        if self.page_link:
            return self.page_link.url
        return self.external_url or "#"

    def __str__(self) -> str:
        return self.display_title
```

### 2. Template Tag

```python
# navigation/templatetags/navigation_tags.py
"""Template tag per renderizzare menu dinamici."""
from django import template
from django.utils.translation import get_language
from navigation.models import NavigationMenu

register = template.Library()


@register.inclusion_tag("navigation/menu.html", takes_context=True)
def render_menu(context, location: str):
    """
    Renderizza un menu per posizione e lingua corrente.
    
    Uso: {% render_menu "header" %}
    """
    request = context.get("request")
    language = get_language() or "it"

    try:
        menu = NavigationMenu.objects.prefetch_related("items__page_link").get(
            location=location,
            language=language,
        )
        items = menu.items.all()
    except NavigationMenu.DoesNotExist:
        items = []

    return {"menu_items": items, "request": request}
```

### 3. API Endpoint per Menu (Frontend React)

```python
# navigation/api.py
"""API per menu navigazione (consumato dal frontend React)."""
from django.http import JsonResponse
from django.utils.translation import get_language
from .models import NavigationMenu


def menu_api(request, location: str):
    """
    GET /api/v2/menu/<location>/
    Ritorna JSON con le voci di menu per la posizione data.
    """
    language = request.GET.get("lang", get_language() or "it")

    try:
        menu = NavigationMenu.objects.prefetch_related("items__page_link").get(
            location=location,
            language=language,
        )
    except NavigationMenu.DoesNotExist:
        return JsonResponse({"items": []})

    items = [
        {
            "title": item.display_title,
            "url": item.url,
            "openInNewTab": item.open_in_new_tab,
            "icon": item.icon,
        }
        for item in menu.items.all()
    ]

    return JsonResponse({"location": location, "language": language, "items": items})
```

URL pattern:
```python
# In config/urls.py
from navigation.api import menu_api

urlpatterns += [
    path("api/v2/menu/<str:location>/", menu_api, name="menu_api"),
]
```

---

## TEMPLATE HTML BASE

```html
<!-- templates/navigation/menu.html -->
<nav>
  {% for item in menu_items %}
    <a href="{{ item.url }}"
       {% if item.open_in_new_tab %}target="_blank" rel="noopener"{% endif %}>
      {{ item.display_title }}
    </a>
  {% endfor %}
</nav>
```

---

## NOTE IMPLEMENTATIVE

1. **`unique_together`:** Un solo menu per posizione + lingua. Es: un solo "header" IT.
2. **Page link resiliente:** Se la pagina viene spostata/rinominata, l'ForeignKey mantiene il collegamento. Meglio dei link testuali.
3. **Icon field:** Stringa corrispondente ai nomi Lucide React (`Music`, `Calendar`, etc.) usati nel template-strutturale.
4. **ClusterableModel:** Necessario per usare `InlinePanel` + `ParentalKey` (ModelCluster pattern).
5. **API menu:** Endpoint semplice senza Wagtail API v2 framework. Sufficiente per le esigenze del frontend React.

---

## CRITERI DI ACCETTAZIONE

- [ ] NavigationMenu creabile nel pannello Snippets
- [ ] MenuItem ordinabili via drag & drop (InlinePanel + Orderable)
- [ ] MenuItem può puntare a pagina interna O URL esterno
- [ ] `display_title` usa il titolo custom o fallback al titolo pagina
- [ ] Template tag `{% render_menu "header" %}` funzionante
- [ ] API `GET /api/v2/menu/header/?lang=it` ritorna JSON corretto
- [ ] Menu separati per IT e EN
- [ ] Un solo menu per posizione + lingua (unique_together)

---

## SEZIONE TDD

```python
# tests/test_navigation_menu.py
import pytest
from django.test import Client

@pytest.mark.django_db
class TestMenuAPI:
    def test_header_menu_returns_json(self, home_page):
        client = Client()
        response = client.get("/api/v2/menu/header/?lang=it")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data

    def test_invalid_position_returns_empty(self, home_page):
        client = Client()
        response = client.get("/api/v2/menu/nonexistent/?lang=it")
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []

    def test_unique_together_constraint(self, home_page):
        from core.models import NavigationMenu
        NavigationMenu.objects.create(position="header", language="it")
        with pytest.raises(Exception):
            NavigationMenu.objects.create(position="header", language="it")
```

---

## SECURITY CHECKLIST

- [ ] Menu API sola lettura (no POST/PUT/DELETE)
- [ ] URL nei menu non contengono javascript: o data: URI
- [ ] Menu items con `open_in_new_tab` hanno `rel=noopener` nel template
