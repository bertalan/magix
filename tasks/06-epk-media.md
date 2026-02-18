# TASK 06 — EPK/Media Model + Collection Permissions

> **Agente:** Backend  
> **Fase:** 1 — Data Models  
> **Dipendenze:** Task 01, Task 03  
> **Stima:** 25 min  

---

## OBIETTIVO

Implementare l'area EPK (Electronic Press Kit) protetta da permessi. I file ad alta risoluzione (foto TIFF, loghi vettoriali, rider tecnici) devono essere accessibili solo ad utenti autorizzati (giornalisti, promoter) tramite il sistema nativo di Wagtail Collections.

---

## FILES_IN_SCOPE (da leggere)

- `idea/1-architettura-dati-wagtail.md` — sezione 1.4 (Media & EPK)

---

## OUTPUT_ATTESO

```
core/
├── models.py          # EPKDownload model (aggiungere)
├── views.py           # View protetta per download EPK
├── epk_urls.py        # URL patterns per download
templates/
├── core/
│   └── epk_landing.html   # Pagina EPK (scheletro)
```

---

## SPECIFICHE

### 1. Configurazione Collection "Press/EPK"

Creare via migration o data migration:

```python
"""Data migration per creare la Collection EPK e il Gruppo Press."""
from django.db import migrations


def create_epk_collection_and_group(apps, schema_editor):
    """Crea la collection 'Press/EPK' e il gruppo 'Press' con permessi."""
    Collection = apps.get_model("wagtailcore", "Collection")
    Group = apps.get_model("auth", "Group")
    GroupCollectionPermission = apps.get_model(
        "wagtailcore", "GroupCollectionPermission"
    )
    Permission = apps.get_model("auth", "Permission")

    # Crea collection sotto la root
    root_collection = Collection.objects.get(depth=1)
    epk_collection = root_collection.add_child(name="Press/EPK")

    # Crea gruppo "Press"
    press_group, _ = Group.objects.get_or_create(name="Press")

    # Permessi: il gruppo Press può accedere alla collection EPK
    # Cerca il permesso "choose_document" o equivalente
    try:
        choose_doc = Permission.objects.get(codename="choose_document")
        GroupCollectionPermission.objects.create(
            group=press_group,
            collection=epk_collection,
            permission=choose_doc,
        )
    except Permission.DoesNotExist:
        pass  # Il permesso verrà configurato manualmente in admin


def reverse_func(apps, schema_editor):
    Collection = apps.get_model("wagtailcore", "Collection")
    Collection.objects.filter(name="Press/EPK").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0001_initial"),
        ("wagtailcore", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_epk_collection_and_group, reverse_func),
    ]
```

### 2. EPKDownload Model

```python
"""Modello per tracciare e gestire i download EPK per artista."""
from django.db import models
from wagtail.admin.panels import FieldPanel
from wagtail.snippets.models import register_snippet
from wagtail.documents import get_document_model_string


@register_snippet
class EPKPackage(models.Model):
    """Kit stampa per un artista — raggruppa documenti e media."""

    artist = models.ForeignKey(
        "artists.ArtistPage",
        on_delete=models.CASCADE,
        related_name="epk_packages",
        verbose_name="Artista",
    )
    title = models.CharField(
        max_length=200,
        verbose_name="Titolo EPK",
        help_text="Es: 'Red Moon — Press Kit 2026'",
    )
    description = models.TextField(
        blank=True,
        verbose_name="Descrizione",
    )
    # I file effettivi sono nella Collection "Press/EPK"
    # Qui linkiamo i documenti Wagtail
    press_photo_hires = models.ForeignKey(
        "wagtailimages.Image",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        verbose_name="Foto stampa alta risoluzione",
    )
    technical_rider = models.ForeignKey(
        get_document_model_string(),
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        verbose_name="Rider tecnico (PDF)",
    )
    biography_pdf = models.ForeignKey(
        get_document_model_string(),
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        verbose_name="Biografia PDF",
    )
    logo_vector = models.ForeignKey(
        get_document_model_string(),
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        verbose_name="Logo vettoriale (SVG/AI)",
    )
    is_public = models.BooleanField(
        default=False,
        verbose_name="Pubblicamente accessibile",
        help_text="Se True, non richiede autenticazione per il download.",
    )
    updated_at = models.DateTimeField(auto_now=True)

    panels = [
        FieldPanel("artist"),
        FieldPanel("title"),
        FieldPanel("description"),
        FieldPanel("is_public"),
        FieldPanel("press_photo_hires"),
        FieldPanel("technical_rider"),
        FieldPanel("biography_pdf"),
        FieldPanel("logo_vector"),
    ]

    class Meta:
        verbose_name = "Kit Stampa (EPK)"
        verbose_name_plural = "Kit Stampa (EPK)"
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return self.title
```

### 3. View Protetta per Download

```python
"""View per download EPK con controllo permessi."""
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404, redirect


@login_required
def epk_download(request, epk_id: int, asset_type: str):
    """
    Download di un asset EPK.
    asset_type: 'photo' | 'rider' | 'bio' | 'logo'
    """
    epk = get_object_or_404(EPKPackage, pk=epk_id)

    # Se EPK è pubblico, consenti senza check gruppo
    if not epk.is_public:
        # Verifica che l'utente appartenga al gruppo "Press"
        if not request.user.groups.filter(name="Press").exists():
            raise Http404("Accesso non autorizzato.")

    asset_map = {
        "photo": epk.press_photo_hires,
        "rider": epk.technical_rider,
        "bio": epk.biography_pdf,
        "logo": epk.logo_vector,
    }

    asset = asset_map.get(asset_type)
    if asset is None:
        raise Http404("Asset non trovato.")

    # Per documenti Wagtail, redirect alla URL servita
    if hasattr(asset, "url"):
        return redirect(asset.url)

    raise Http404("File non disponibile.")
```

### 4. URL Pattern

```python
# core/epk_urls.py
from django.urls import path
from . import views

urlpatterns = [
    path(
        "epk/<int:epk_id>/download/<str:asset_type>/",
        views.epk_download,
        name="epk_download",
    ),
]
```

Aggiungere in `config/urls.py`:
```python
urlpatterns += [
    path("press/", include("core.epk_urls")),
]
```

---

## NOTE IMPLEMENTATIVE

1. **File grandi (>50MB):** Per file molto pesanti, considerare signed URL verso S3 in futuro. Per ora, il sistema Wagtail Document serve i file tramite Django.
2. **`WAGTAILDOCS_SERVE_METHOD`:** In produzione impostare a `"serve_view"` (non `"direct"`) per proteggere l'accesso diretto ai file.
3. **Collezione:** Tutti i documenti e immagini caricati per EPK devono essere assegnati alla Collection "Press/EPK" dall'editor.
4. **API:** Nel Task 10, gli EPK con `is_public=True` saranno esposti via API. Quelli privati no.
5. **Coordinamento con T27 (§L440–452):** Il sistema permessi pagina (T27: `GroupPagePermission` + `managing_group`) è complementare ai permessi collection (T06: `GroupCollectionPermission`). Quando si crea un gruppo per-band, assegnare **sia** permessi pagina (T27) **sia** permessi sulla Collection EPK (T06). Vedi `tasks/27-permissions-workflow.md` §Allineamento EPK.

---

## CRITERI DI ACCETTAZIONE

- [ ] Collection "Press/EPK" creata via data migration
- [ ] Gruppo "Press" creato con permessi sulla collection
- [ ] EPKPackage visibile nel pannello Snippets
- [ ] Download protetto: utente non-Press riceve 404
- [ ] Download pubblico: EPK con `is_public=True` accessibile senza gruppo
- [ ] URL pattern `/press/epk/<id>/download/<type>/` funzionanti
- [ ] Rider tecnico (PDF) scaricabile dall'admin

---

## SEZIONE TDD

```python
# tests/test_epk.py
import pytest
from django.test import Client

@pytest.mark.django_db
class TestEPKDownload:
    def test_protected_epk_requires_group(self, home_page):
        client = Client()
        response = client.get("/press/epk/1/download/photo/")
        assert response.status_code in (403, 404)

    def test_public_epk_accessible(self, home_page):
        """EPK con is_public=True è accessibile senza autenticazione."""
        # Da implementare con fixture EPKPackage(is_public=True)
        pass
```

---

## SECURITY CHECKLIST

- [ ] Download EPK protetto da gruppo 'Press' (Django Groups)
- [ ] File media serviti attraverso Django (no direct Nginx access per EPK privati)
- [ ] Upload limitato a tipi file specifici (PDF, JPG, PNG)
- [ ] Dimensione upload limitata (max 20MB per file)
