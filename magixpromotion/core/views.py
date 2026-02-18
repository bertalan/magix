"""View per download EPK con controllo permessi."""
from django.contrib.auth.decorators import login_required
from django.http import Http404
from django.shortcuts import get_object_or_404, redirect

from .models import EPKPackage


@login_required
def epk_download(request, epk_id: int, asset_type: str):
    """
    Download di un asset EPK.
    asset_type: 'photo' | 'rider' | 'bio' | 'logo'
    """
    epk = get_object_or_404(EPKPackage, pk=epk_id)

    if not epk.is_public:
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

    if hasattr(asset, "url"):
        return redirect(asset.url)

    raise Http404("File non disponibile.")
