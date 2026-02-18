# TASK 27 — Permessi, Workflow Approvazione e Isolamento Per-Band

> **Agente:** Backend  
> **Fase:** 2 — Business Logic  
> **Dipendenze:** Task 01, Task 03, Task 04, Task 06  
> **Stima:** 50 min  

---

## OBIETTIVO

Consentire a collaboratori esterni (es. manager di band, fotografi, social media manager) di **modificare** le pagine delle band e degli eventi associati, **senza poter pubblicare**. L'approvazione resta allo staff Magix Promotion tramite Wagtail Workflows. L'accesso è isolato per-band: ogni gruppo editor vede e modifica solo le pagine della propria band.

---

## FILES_IN_SCOPE (da leggere)

- `idea/1-architettura-dati-wagtail.md` — struttura albero pagine
- `tasks/03-artist-models.md` — ArtistPage (campo `managing_group`)
- `tasks/04-event-models.md` — EventPage (FK `related_artist`)
- `tasks/06-epk-media.md` — EPK Collection permissions (pattern esistente)
- `tasks/01-scaffolding-django.md` — INSTALLED_APPS e settings

---

## OUTPUT_ATTESO

```
core/
├── wagtail_hooks.py       # Hook per isolamento per-band
├── migrations/
│   └── 000X_create_workflow.py   # Data migration: Workflow + GroupApprovalTask
artists/
├── models.py              # Aggiornamento: campo managing_group su ArtistPage
├── migrations/
│   └── 000X_managing_group.py    # Migration per nuovo campo
```

---

## ARCHITETTURA A 3 LIVELLI

### Livello 1 — Gruppi Wagtail (edit senza publish)

Wagtail supporta nativamente gruppi con permessi granulari sulle pagine.

**Setup gruppi:**

| Gruppo | Pagine | Permessi | Note |
|--------|--------|----------|------|
| Staff | Tutto il sito | Add, Edit, Publish, Lock, Bulk Delete | Superuser o staff Django |
| Collaboratori Esterni | ArtistListingPage section + EventListingPage section | Add, Edit | NO Publish — draft only |
| Band: \<NomeBand\> | Solo pagine della propria band (via hook) | Edit | Sottogruppo logico di Collaboratori Esterni |

**Data migration per GroupPagePermission:**

```python
# core/migrations/000X_create_collaboratori_group.py
"""Crea il gruppo Collaboratori Esterni con permessi edit su sezioni Artisti ed Eventi."""
from django.db import migrations


def create_collaboratori_group(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    GroupPagePermission = apps.get_model("wagtailcore", "GroupPagePermission")
    Permission = apps.get_model("wagtailcore", "Permission")
    Page = apps.get_model("wagtailcore", "Page")

    # Crea gruppo
    group, _ = Group.objects.get_or_create(name="Collaboratori Esterni")

    # Permessi: add + edit (NO publish)
    add_perm = Permission.objects.get(codename="add_page")
    edit_perm = Permission.objects.get(codename="change_page")

    # Trova le pagine listing (devono esistere nel DB)
    # NB: questa migration va eseguita DOPO aver creato le pagine nel CMS.
    # In alternativa, creare i permessi via management command o admin UI.
    for page_slug in ("artisti", "calendario"):
        try:
            listing_page = Page.objects.get(slug=page_slug)
            for perm in (add_perm, edit_perm):
                GroupPagePermission.objects.get_or_create(
                    group=group,
                    page=listing_page,
                    permission=perm,
                )
        except Page.DoesNotExist:
            # Le pagine listing verranno create dal CMS admin.
            # I permessi si possono assegnare anche da Settings > Groups.
            pass


def reverse_func(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Group.objects.filter(name="Collaboratori Esterni").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0001_initial"),
        ("wagtailcore", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_collaboratori_group, reverse_func),
    ]
```

---

### Livello 2 — Workflow con Approvazione Staff

Wagtail Workflows (built-in da Wagtail 2.10+) consentono di definire flussi di approvazione multi-step. Usiamo un singolo `GroupApprovalTask` assegnato al gruppo Staff.

**Flusso:**
```
Editor salva draft → Submit for moderation → Workflow "Approvazione Staff"
  → GroupApprovalTask (gruppo: Staff) → Staff approva → Pagina pubblicata
                                       → Staff rifiuta → Editor riceve notifica, revisiona
```

**Data migration:**

```python
# core/migrations/000X_create_approval_workflow.py
"""Crea il Workflow 'Approvazione Staff' con GroupApprovalTask."""
from django.db import migrations


def create_workflow(apps, schema_editor):
    Workflow = apps.get_model("wagtailcore", "Workflow")
    GroupApprovalTask = apps.get_model("wagtailcore", "GroupApprovalTask")
    WorkflowTask = apps.get_model("wagtailcore", "WorkflowTask")
    Group = apps.get_model("auth", "Group")
    Page = apps.get_model("wagtailcore", "Page")
    WorkflowPage = apps.get_model("wagtailcore", "WorkflowPage")

    # 1. Crea il workflow
    workflow, _ = Workflow.objects.get_or_create(
        name="Approvazione Staff",
        defaults={"active": True},
    )

    # 2. Crea il task di approvazione
    # Nota: GroupApprovalTask richiede il gruppo staff.
    # Se non esiste ancora il gruppo "Staff", crearlo.
    staff_group, _ = Group.objects.get_or_create(name="Staff")

    task, created = GroupApprovalTask.objects.get_or_create(
        name="Revisione Staff",
        defaults={"active": True},
    )
    if created:
        task.groups.add(staff_group)

    # 3. Collega task al workflow (step 1)
    WorkflowTask.objects.get_or_create(
        workflow=workflow,
        task=task,
        defaults={"sort_order": 0},
    )

    # 4. Assegna workflow alle sezioni Artisti e Eventi
    for page_slug in ("artisti", "calendario"):
        try:
            listing_page = Page.objects.get(slug=page_slug)
            WorkflowPage.objects.get_or_create(
                workflow=workflow,
                page=listing_page,
            )
        except Page.DoesNotExist:
            # Assegnare manualmente da Settings > Workflows se le pagine
            # non esistono ancora al momento della migration.
            pass


def reverse_func(apps, schema_editor):
    Workflow = apps.get_model("wagtailcore", "Workflow")
    Workflow.objects.filter(name="Approvazione Staff").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0001_initial"),
        ("wagtailcore", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_workflow, reverse_func),
    ]
```

**Configurazione alternativa (Settings UI):**

Se le pagine listing non esistono al momento della migration, il workflow si può configurare interamente da admin:

1. `Settings > Workflows > Add Workflow` → "Approvazione Staff"
2. `Add Task > Group Approval Task` → "Revisione Staff" (gruppo: Staff)
3. Assegnare il workflow a ArtistListingPage e EventListingPage

---

### Livello 3 — Isolamento Per-Band (`managing_group` + Hooks)

Senza questo livello, qualsiasi membro di "Collaboratori Esterni" potrebbe modificare le pagine di **tutte** le band. Con `managing_group` + hook, ogni band editor vede solo le proprie pagine.

#### 3a. Campo `managing_group` su ArtistPage

```python
# artists/models.py — aggiunta al modello ArtistPage

from django.contrib.auth.models import Group

class ArtistPage(Page):
    # ... campi esistenti ...

    managing_group = models.ForeignKey(
        "auth.Group",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name="Gruppo editor autorizzati",
        help_text=(
            "Gruppo Wagtail i cui membri possono modificare questa band "
            "e i relativi eventi. Lasciare vuoto per accesso solo staff."
        ),
    )

    # === Pannelli Admin ===
    settings_panels = Page.settings_panels + [
        FieldPanel("managing_group"),
    ]
```

> **Nota:** Il campo va in `settings_panels` (non `content_panels`) perché è un'impostazione di governance, non contenuto editoriale. È visibile solo a chi ha accesso alla tab "Settings" della pagina (tipicamente staff/admin).

#### 3b. Hook per isolamento (`core/wagtail_hooks.py`)

```python
# core/wagtail_hooks.py
"""
Hook Wagtail per isolamento per-band.

Logica:
- Staff / superuser → accesso completo, nessuna restrizione.
- Collaboratore esterno → può modificare SOLO le pagine della propria band
  (ArtistPage con managing_group == gruppo utente, o EventPage con
  related_artist.managing_group == gruppo utente).
- Il pulsante "Pubblica" viene rimosso per i non-staff: possono solo
  salvare bozze e inviare in moderazione.
"""
from django.core.exceptions import PermissionDenied
from wagtail import hooks


def _get_user_managing_group_ids(user):
    """Restituisce i PK dei gruppi dell'utente che sono managing_group di qualche ArtistPage."""
    from artists.models import ArtistPage

    user_group_ids = set(user.groups.values_list("pk", flat=True))
    managing_ids = set(
        ArtistPage.objects.filter(
            managing_group_id__in=user_group_ids
        ).values_list("managing_group_id", flat=True)
    )
    return user_group_ids & managing_ids


def _user_can_edit_page(user, page):
    """
    Controlla se l'utente può modificare la pagina in base al managing_group.
    Ritorna True se:
      - L'utente è staff o superuser.
      - La pagina è un ArtistPage e managing_group è nel gruppo dell'utente.
      - La pagina è un EventPage e related_artist.managing_group è nel gruppo dell'utente.
      - La pagina non ha managing_group associato (accesso libero ai collaboratori).
    """
    if user.is_staff or user.is_superuser:
        return True

    # Risolvi la pagina specifica (Page → ArtistPage o EventPage)
    specific_page = page.specific

    # Caso ArtistPage
    if hasattr(specific_page, "managing_group"):
        if specific_page.managing_group is None:
            # Nessun gruppo assegnato → solo staff può editare
            return False
        return user.groups.filter(pk=specific_page.managing_group_id).exists()

    # Caso EventPage (controlla l'artista collegato)
    if hasattr(specific_page, "related_artist") and specific_page.related_artist:
        artist = specific_page.related_artist.specific
        if hasattr(artist, "managing_group") and artist.managing_group:
            return user.groups.filter(pk=artist.managing_group_id).exists()
        # Artista senza managing_group → solo staff
        return False

    # Altre pagine → rispetta permessi standard Wagtail
    return True


@hooks.register("before_edit_page")
def check_band_permission_on_edit(request, page):
    """
    Impedisce la modifica di una pagina se l'utente non appartiene
    al managing_group della band associata.
    """
    if not _user_can_edit_page(request.user, page):
        raise PermissionDenied(
            "Non hai i permessi per modificare questa pagina. "
            "Contatta lo staff Magix Promotion."
        )


@hooks.register("before_create_page")
def check_band_permission_on_create(request, parent_page, page_class):
    """
    Impedisce la creazione di pagine sotto sezioni protette
    se l'utente non è staff e non ha un managing_group associato.
    Per EventPage: la verifica completa avviene in before_edit_page
    dopo che l'utente ha selezionato l'artista.
    """
    if request.user.is_staff or request.user.is_superuser:
        return

    # Solo staff può creare nuovi ArtistPage
    from artists.models import ArtistPage
    if page_class == ArtistPage:
        raise PermissionDenied(
            "Solo lo staff può creare nuove pagine artista."
        )


@hooks.register("construct_page_action_menu")
def hide_publish_for_collaborators(menu_items, request, context):
    """
    Rimuove il pulsante 'Pubblica' per gli utenti non-staff.
    I collaboratori possono solo:
    - Salvare bozza
    - Inviare in moderazione (Submit for moderation)
    """
    if request.user.is_staff or request.user.is_superuser:
        return

    menu_items[:] = [
        item for item in menu_items
        if item.name not in ("action-publish", "action-unpublish")
    ]


@hooks.register("construct_page_listing_buttons")
def hide_listing_actions_for_collaborators(buttons, page, user, context):
    """
    Nasconde i pulsanti 'Pubblica' e 'Elimina' dalla page listing
    per i collaboratori non-staff.
    """
    if user.is_staff or user.is_superuser:
        return

    if not _user_can_edit_page(user, page):
        buttons[:] = []  # Rimuovi tutti i pulsanti per pagine non proprie


@hooks.register("construct_explorer_page_queryset")
def filter_explorer_for_collaborators(parent_page, pages, request):
    """
    Filtra l'explorer: i collaboratori vedono solo le pagine
    delle proprie band e i relativi eventi.

    NB: Questo hook filtra la vista, non i permessi reali.
    Il filtro di sicurezza è nel before_edit_page.
    """
    user = request.user
    if user.is_staff or user.is_superuser:
        return pages

    managing_group_ids = _get_user_managing_group_ids(user)
    if not managing_group_ids:
        return pages.none()

    from artists.models import ArtistPage
    from events.models import EventPage

    # Pagine artista gestite dall'utente
    artist_pks = ArtistPage.objects.filter(
        managing_group_id__in=managing_group_ids
    ).values_list("pk", flat=True)

    # Eventi collegati a quegli artisti
    event_pks = EventPage.objects.filter(
        related_artist_id__in=artist_pks
    ).values_list("pk", flat=True)

    # Listing pages (necessarie per la navigazione)
    from wagtail.models import Page
    listing_pks = pages.filter(
        depth__lte=parent_page.depth + 1,
        numchild__gt=0,
    ).values_list("pk", flat=True)

    all_visible_pks = set(artist_pks) | set(event_pks) | set(listing_pks)
    return pages.filter(pk__in=all_visible_pks)
```

---

## CONFIGURAZIONE ADMIN — PROCEDURA OPERATIVA

### Creare un gruppo per-band (esempio: "Band: I Rossi")

1. **Admin → Settings → Groups → Add Group**
   - Nome: `Band: I Rossi`
   - Page permissions:
     - ArtistListingPage → Edit
     - EventListingPage → Edit
   - (NO Publish su nessuna sezione)

2. **ArtistPage "I Rossi" → Settings tab:**
   - `managing_group` → selezionare "Band: I Rossi"

3. **Creare l'utente collaboratore:**
   - Admin → Settings → Users → Add User
   - Username: `mario.rossi`
   - Groups: `Band: I Rossi`, `Collaboratori Esterni`
   - `is_staff` = **False** (non è staff Django)

4. **Risultato:**
   - `mario.rossi` accede al Wagtail admin
   - Vede solo la pagina "I Rossi" e i relativi eventi
   - Può modificare e salvare bozze
   - Deve sottoporre le modifiche a moderazione (Workflow)
   - Lo staff Magix approva o rifiuta

> **Nota importante:** Gli utenti devono avere `is_active=True` e almeno un gruppo con `GroupPagePermission` per poter accedere all'admin Wagtail. `is_staff=False` va bene — Wagtail gestisce il login separatamente da Django admin.

---

## ALLINEAMENTO CON EPK (Task 06)

Il Task 06 usa `GroupCollectionPermission` per le Collection dei media EPK. Il sistema qui descritto è complementare:

| Ambito | Meccanismo | Task |
|--------|-----------|------|
| **Pagine** (ArtistPage, EventPage) | `GroupPagePermission` + hook `managing_group` | Task 27 (questo) |
| **Media/EPK** (Document, Image nelle Collection) | `GroupCollectionPermission` | Task 06 |

Per una band, il managing group dovrebbe avere sia i permessi pagina (Task 27) sia quelli collezione (Task 06). Coordinare la creazione del gruppo con entrambi i sistemi.

---

## NOTE IMPLEMENTATIVE

1. **`page.specific` call:** L'hook `before_edit_page` riceve un `Page` generico. Chiamare `.specific` per accedere ai campi custom. Questo comporta una query aggiuntiva, accettabile per le operazioni admin.
2. **Caching explorer filter:** `construct_explorer_page_queryset` potrebbe rallentare per roster grandi. Se necessario, cachare `_get_user_managing_group_ids()` per la durata della request con `request._managing_group_ids_cache`.
3. **`is_staff` vs gruppi:** In Wagtail, `is_staff=True` dà accesso al Django admin. Per i collaboratori basta avere un gruppo con `GroupPagePermission` — Wagtail li farà entrare nel CMS admin.
4. **Collisioni managing_group:** Se un utente è in più gruppi band, vedrà tutte le band associate. Il sistema è additivo.
5. **Fallback senza managing_group:** Se un ArtistPage non ha `managing_group`, solo staff/superuser possono editarlo. Questo è il default sicuro.
6. **EventPage senza related_artist:** Se un EventPage non ha `related_artist`, solo staff può editarlo. Un collaboratore non può creare eventi "orfani".

---

## CRITERI DI ACCETTAZIONE

- [ ] Campo `managing_group` presente su ArtistPage nella tab Settings
- [ ] Collaboratore esterno può accedere al Wagtail admin
- [ ] Collaboratore vede solo le pagine della propria band nell'explorer
- [ ] Collaboratore può modificare ArtistPage della propria band
- [ ] Collaboratore può modificare EventPage collegati alla propria band
- [ ] Collaboratore NON può modificare pagine di altre band
- [ ] Collaboratore NON può pubblicare (solo draft + submit for moderation)
- [ ] Workflow "Approvazione Staff" attivo sulle sezioni Artisti e Eventi
- [ ] Staff riceve notifica quando un collaboratore invia in moderazione
- [ ] Staff può approvare o rifiutare dal pannello Workflow
- [ ] Pagina viene pubblicata dopo approvazione staff
- [ ] Collaboratore NON può creare nuovi ArtistPage (solo staff)
- [ ] Collaboratore può creare EventPage (verifica managing_group in edit)

---

## SEZIONE TDD

```python
# tests/test_permissions_workflow.py
"""
Test per il sistema di permessi per-band e workflow approvazione.
Red → Green → Refactor.
"""
import pytest
from django.contrib.auth.models import Group, User
from django.core.exceptions import PermissionDenied
from django.test import RequestFactory
from wagtail.models import Page, GroupPagePermission
from wagtail.test.utils import WagtailPageTestCase

from artists.models import ArtistPage, ArtistListingPage
from events.models import EventPage, EventListingPage


@pytest.fixture
def staff_user(db):
    return User.objects.create_user(
        username="staff_member", password="testpass", is_staff=True
    )


@pytest.fixture
def band_group(db):
    return Group.objects.create(name="Band: Test Band")


@pytest.fixture
def collaborator(db, band_group):
    user = User.objects.create_user(
        username="collab", password="testpass", is_staff=False
    )
    user.groups.add(band_group)
    return user


@pytest.fixture
def other_band_group(db):
    return Group.objects.create(name="Band: Other Band")


@pytest.fixture
def other_collaborator(db, other_band_group):
    user = User.objects.create_user(
        username="other_collab", password="testpass", is_staff=False
    )
    user.groups.add(other_band_group)
    return user


@pytest.mark.django_db
class TestManagingGroupField:
    """Test per il campo managing_group su ArtistPage."""

    def test_artist_page_has_managing_group_field(self, artist_listing):
        """ArtistPage deve avere il campo managing_group."""
        artist = ArtistPage(title="Test Band")
        artist_listing.add_child(instance=artist)
        assert hasattr(artist, "managing_group")
        assert artist.managing_group is None

    def test_assign_managing_group(self, artist_listing, band_group):
        """Si può assegnare un gruppo a una ArtistPage."""
        artist = ArtistPage(title="Test Band", managing_group=band_group)
        artist_listing.add_child(instance=artist)
        artist.save()
        artist.refresh_from_db()
        assert artist.managing_group == band_group

    def test_managing_group_set_null_on_delete(self, artist_listing, band_group):
        """Se il gruppo viene eliminato, managing_group diventa None."""
        artist = ArtistPage(title="Test Band", managing_group=band_group)
        artist_listing.add_child(instance=artist)
        artist.save()
        band_group.delete()
        artist.refresh_from_db()
        assert artist.managing_group is None


@pytest.mark.django_db
class TestBandIsolationHook:
    """Test per l'hook before_edit_page — isolamento per-band."""

    def test_staff_can_edit_any_page(self, staff_user, artist_listing, band_group):
        """Staff può modificare qualsiasi pagina, anche con managing_group."""
        from core.wagtail_hooks import _user_can_edit_page

        artist = ArtistPage(title="Test Band", managing_group=band_group)
        artist_listing.add_child(instance=artist)
        assert _user_can_edit_page(staff_user, artist) is True

    def test_collaborator_can_edit_own_band(
        self, collaborator, artist_listing, band_group
    ):
        """Collaboratore può editare la pagina della propria band."""
        from core.wagtail_hooks import _user_can_edit_page

        artist = ArtistPage(title="Test Band", managing_group=band_group)
        artist_listing.add_child(instance=artist)
        assert _user_can_edit_page(collaborator, artist) is True

    def test_collaborator_cannot_edit_other_band(
        self, collaborator, artist_listing, other_band_group
    ):
        """Collaboratore NON può editare pagine di altre band."""
        from core.wagtail_hooks import _user_can_edit_page

        artist = ArtistPage(title="Other Band", managing_group=other_band_group)
        artist_listing.add_child(instance=artist)
        assert _user_can_edit_page(collaborator, artist) is False

    def test_collaborator_cannot_edit_unassigned_band(
        self, collaborator, artist_listing
    ):
        """Collaboratore NON può editare band senza managing_group."""
        from core.wagtail_hooks import _user_can_edit_page

        artist = ArtistPage(title="No Group Band", managing_group=None)
        artist_listing.add_child(instance=artist)
        assert _user_can_edit_page(collaborator, artist) is False


@pytest.mark.django_db
class TestEventPermissionViaArtist:
    """Test che i permessi sugli eventi derivino dall'artista collegato."""

    def test_collaborator_can_edit_own_band_event(
        self, collaborator, artist_listing, band_group, event_listing
    ):
        """Collaboratore può editare eventi della propria band."""
        from core.wagtail_hooks import _user_can_edit_page

        artist = ArtistPage(title="My Band", managing_group=band_group)
        artist_listing.add_child(instance=artist)
        artist.save()

        event = EventPage(title="My Band Event", related_artist=artist)
        event_listing.add_child(instance=event)
        assert _user_can_edit_page(collaborator, event) is True

    def test_collaborator_cannot_edit_other_band_event(
        self, collaborator, artist_listing, other_band_group, event_listing
    ):
        """Collaboratore NON può editare eventi di altre band."""
        from core.wagtail_hooks import _user_can_edit_page

        artist = ArtistPage(title="Other Band", managing_group=other_band_group)
        artist_listing.add_child(instance=artist)
        artist.save()

        event = EventPage(title="Other Event", related_artist=artist)
        event_listing.add_child(instance=event)
        assert _user_can_edit_page(collaborator, event) is False

    def test_event_without_artist_only_staff(
        self, collaborator, event_listing
    ):
        """Evento senza artista: solo staff può editare."""
        from core.wagtail_hooks import _user_can_edit_page

        event = EventPage(title="Orphan Event", related_artist=None)
        event_listing.add_child(instance=event)
        assert _user_can_edit_page(collaborator, event) is False


@pytest.mark.django_db
class TestPublishRestriction:
    """Test che i collaboratori non possano pubblicare."""

    def test_publish_button_hidden_for_collaborator(self, collaborator, rf):
        """Il pulsante Pubblica non deve apparire per i collaboratori."""
        from core.wagtail_hooks import hide_publish_for_collaborators

        request = rf.get("/admin/pages/1/edit/")
        request.user = collaborator

        # Simula menu items
        class MockMenuItem:
            def __init__(self, name):
                self.name = name

        menu_items = [
            MockMenuItem("action-publish"),
            MockMenuItem("action-submit"),
            MockMenuItem("action-unpublish"),
        ]
        hide_publish_for_collaborators(menu_items, request, {})

        remaining_names = [item.name for item in menu_items]
        assert "action-publish" not in remaining_names
        assert "action-unpublish" not in remaining_names
        assert "action-submit" in remaining_names

    def test_publish_button_visible_for_staff(self, staff_user, rf):
        """Il pulsante Pubblica deve rimanere per lo staff."""
        from core.wagtail_hooks import hide_publish_for_collaborators

        request = rf.get("/admin/pages/1/edit/")
        request.user = staff_user

        class MockMenuItem:
            def __init__(self, name):
                self.name = name

        menu_items = [
            MockMenuItem("action-publish"),
            MockMenuItem("action-submit"),
        ]
        hide_publish_for_collaborators(menu_items, request, {})

        remaining_names = [item.name for item in menu_items]
        assert "action-publish" in remaining_names


@pytest.mark.django_db
class TestWorkflowSetup:
    """Test per la configurazione del Workflow."""

    def test_approval_workflow_exists(self):
        """Il workflow 'Approvazione Staff' deve esistere dopo la migration."""
        from wagtail.models import Workflow

        assert Workflow.objects.filter(
            name="Approvazione Staff", active=True
        ).exists()

    def test_workflow_has_group_approval_task(self):
        """Il workflow deve avere un GroupApprovalTask collegato."""
        from wagtail.models import Workflow, WorkflowTask

        workflow = Workflow.objects.get(name="Approvazione Staff")
        tasks = WorkflowTask.objects.filter(workflow=workflow)
        assert tasks.count() == 1
        assert tasks.first().task.name == "Revisione Staff"
```

---

## SECURITY CHECKLIST

- [ ] `before_edit_page` hook blocca accesso non autorizzato con `PermissionDenied`
- [ ] `before_create_page` impedisce creazione ArtistPage da non-staff
- [ ] `construct_page_action_menu` rimuove Publish/Unpublish per non-staff
- [ ] `construct_explorer_page_queryset` filtra vista (defense-in-depth, non unico layer)
- [ ] `managing_group` in `settings_panels` → non visibile a editor senza accesso Settings
- [ ] `page.specific` non espone dati sensibili (solo check gruppo)
- [ ] Workflow impedisce pubblicazione diretta — ogni modifica passa per approvazione
- [ ] Nessun endpoint API espone `managing_group` al frontend (campo solo admin)
- [ ] Rate limiting su login Wagtail admin (configurare in Task 26 — deploy)
- [ ] Collaboratori con `is_staff=False` non accedono a Django admin (`/admin/`)
