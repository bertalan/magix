"""View per download EPK con controllo permessi e SEO."""
import os
import re
from datetime import datetime

from django.http import FileResponse, Http404, HttpResponse
from django.shortcuts import get_object_or_404, redirect
from django.utils.text import slugify
from wagtail.models import Site

from .models import EPKPackage


def robots_txt(request):
    """Genera robots.txt dinamico. Blocca /admin/ e /api/ per i crawler."""
    try:
        site = Site.objects.get(is_default_site=True)
        base_url = site.root_url.rstrip("/")
    except Site.DoesNotExist:
        base_url = "https://www.magixpromotion.com"

    lines = [
        "User-agent: *",
        "Allow: /",
        "",
        "# Aree riservate",
        "Disallow: /admin/",
        "Disallow: /django-admin/",
        "Disallow: /api/",
        "",
        f"Sitemap: {base_url}/sitemap.xml",
    ]
    return HttpResponse("\n".join(lines), content_type="text/plain")


def _safe_filename(name: str) -> str:
    """Genera nome file sicuro: ASCII, spazi→underscore, senza caratteri speciali."""
    name = slugify(name, allow_unicode=False).replace("-", "_")
    return re.sub(r"[^a-zA-Z0-9_]", "", name) or "file"


def epk_download(request, epk_id: int, asset_type: str):
    """
    Download di un asset EPK con rinomina automatica.
    asset_type: 'photo' | 'rider' | 'bio' | 'logo' | 'zip'
    Il file viene rinominato come: {NomeBand}_{TipoAsset}_{YYYYMMDD}.{ext}
    Per lo ZIP: {NomeBand}_PressKit.{ext}
    Se is_public=True l'accesso è libero, altrimenti richiede gruppo 'Press'.
    """
    epk = get_object_or_404(EPKPackage, pk=epk_id)

    if not epk.is_public:
        if not request.user.is_authenticated or not request.user.groups.filter(name="Press").exists():
            raise Http404("Accesso non autorizzato.")

    asset_map = {
        "photo": epk.press_photo_hires,
        "rider": epk.technical_rider,
        "bio": epk.biography_pdf,
        "logo": epk.logo_vector,
        "zip": epk.press_kit_zip,
    }

    asset_label_map = {
        "photo": "FotoHD",
        "rider": "RiderTecnico",
        "bio": "Biografia",
        "logo": "Logo",
        "zip": "PressKit",
    }

    asset = asset_map.get(asset_type)
    if asset is None:
        raise Http404("Asset non trovato.")

    # Calcola il nome band e la data per il filename
    band_name = _safe_filename(epk.artist.title) if epk.artist else "artista"
    date_str = epk.updated_at.strftime("%Y%m%d") if epk.updated_at else datetime.now().strftime("%Y%m%d")
    label = asset_label_map.get(asset_type, asset_type)

    # Determina l'estensione originale del file
    if hasattr(asset, "file"):
        original_name = os.path.basename(asset.file.name)
    elif hasattr(asset, "filename"):
        original_name = asset.filename
    else:
        original_name = "file"
    _, ext = os.path.splitext(original_name)
    if not ext:
        ext = ".bin"

    # Costruisci il filename rinominato
    if asset_type == "zip":
        download_name = f"{band_name}_PressKit{ext}"
    else:
        download_name = f"{band_name}_{label}_{date_str}{ext}"

    # Servi il file con Content-Disposition per forzare il download con nome
    if hasattr(asset, "file"):
        try:
            file_obj = asset.file
            file_obj.open("rb")
            response = FileResponse(file_obj, as_attachment=True, filename=download_name)
            return response
        except Exception:
            # Fallback a redirect se il file non è accessibile direttamente
            pass

    if hasattr(asset, "url"):
        return redirect(asset.url)

    raise Http404("File non disponibile.")
