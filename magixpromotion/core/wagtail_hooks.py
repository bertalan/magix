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
    if user.is_staff or user.is_superuser:
        return True

    specific_page = page.specific

    # Caso ArtistPage
    if hasattr(specific_page, "managing_group"):
        if specific_page.managing_group is None:
            return False
        return user.groups.filter(pk=specific_page.managing_group_id).exists()

    # Caso EventPage
    if hasattr(specific_page, "related_artist") and specific_page.related_artist:
        artist = specific_page.related_artist.specific
        if hasattr(artist, "managing_group") and artist.managing_group:
            return user.groups.filter(pk=artist.managing_group_id).exists()
        return False

    return True


@hooks.register("before_edit_page")
def check_band_permission_on_edit(request, page):
    if not _user_can_edit_page(request.user, page):
        raise PermissionDenied(
            "Non hai i permessi per modificare questa pagina. "
            "Contatta lo staff Magix Promotion."
        )


@hooks.register("before_create_page")
def check_band_permission_on_create(request, parent_page, page_class):
    if request.user.is_staff or request.user.is_superuser:
        return

    from artists.models import ArtistPage
    if page_class == ArtistPage:
        raise PermissionDenied(
            "Solo lo staff puo' creare nuove pagine artista."
        )


@hooks.register("construct_page_action_menu")
def hide_publish_for_collaborators(menu_items, request, context):
    if request.user.is_staff or request.user.is_superuser:
        return

    menu_items[:] = [
        item for item in menu_items
        if item.name not in ("action-publish", "action-unpublish")
    ]


@hooks.register("construct_page_listing_buttons")
def hide_listing_actions_for_collaborators(buttons, page, user, context):
    if user.is_staff or user.is_superuser:
        return

    if not _user_can_edit_page(user, page):
        buttons[:] = []


@hooks.register("construct_explorer_page_queryset")
def filter_explorer_for_collaborators(parent_page, pages, request):
    user = request.user
    if user.is_staff or user.is_superuser:
        return pages

    managing_group_ids = _get_user_managing_group_ids(user)
    if not managing_group_ids:
        return pages.none()

    from artists.models import ArtistPage
    from events.models import EventPage

    artist_pks = ArtistPage.objects.filter(
        managing_group_id__in=managing_group_ids
    ).values_list("pk", flat=True)

    event_pks = EventPage.objects.filter(
        related_artist_id__in=artist_pks
    ).values_list("pk", flat=True)

    listing_pks = pages.filter(
        depth__lte=parent_page.depth + 1,
        numchild__gt=0,
    ).values_list("pk", flat=True)

    all_visible_pks = set(artist_pks) | set(event_pks) | set(listing_pks)
    return pages.filter(pk__in=all_visible_pks)
