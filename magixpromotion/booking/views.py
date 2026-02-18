"""Vista API per la submission del form booking via JSON."""
import json
import logging

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_POST

from .forms import BookingForm
from .email_routing import get_manager_email

logger = logging.getLogger(__name__)


@require_POST
@csrf_protect
def booking_submit_api(request):
    """Endpoint API per ricevere richieste booking dal frontend React."""
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse(
            {"detail": "Formato JSON non valido."},
            status=400,
        )

    form = BookingForm(data)
    if not form.is_valid():
        # Ritorna il primo errore di validazione
        first_error = next(iter(form.errors.values()))[0]
        return JsonResponse({"detail": str(first_error)}, status=400)

    # Salvataggio e notifica email
    cleaned = form.cleaned_data
    artist_name = cleaned.get("requested_artist", "")

    try:
        from django.core.mail import send_mail

        manager_email = get_manager_email(artist_name)
        body_lines = [f"{k.replace('_', ' ').title()}: {v}" for k, v in cleaned.items() if k != "privacy"]
        send_mail(
            subject=f"[MagixPromotion] Richiesta booking: {artist_name}",
            message="\n".join(body_lines),
            from_email="noreply@magixpromotion.it",
            recipient_list=[manager_email],
            fail_silently=True,
        )
        logger.info(f"Booking API: notifica inviata per {artist_name}")
    except Exception as exc:
        logger.exception(f"Errore invio email booking: {exc}")

    return JsonResponse(
        {"success": True, "message": "Richiesta inviata con successo"},
        status=200,
    )
