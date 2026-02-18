"""Modelli app Booking — form contatto/booking context-aware."""
from django.db import models
from django.core.mail import send_mail
from modelcluster.fields import ParentalKey
from wagtail.admin.panels import FieldPanel, FieldRowPanel, InlinePanel, MultiFieldPanel
from wagtail.contrib.forms.models import AbstractEmailForm, AbstractFormField
from wagtail.fields import RichTextField


class BookingFormField(AbstractFormField):
    """Campo custom del form, gestibile da admin."""

    page = ParentalKey(
        "BookingFormPage",
        on_delete=models.CASCADE,
        related_name="form_fields",
    )


class BookingFormPage(AbstractEmailForm):
    """
    Form contatto/booking estendibile da CMS.
    Eredita il contesto artista/evento dalla pagina di provenienza.
    """

    intro = RichTextField(
        blank=True,
        verbose_name="Testo introduttivo",
    )
    thank_you_text = RichTextField(
        blank=True,
        verbose_name="Testo di ringraziamento",
    )

    content_panels = AbstractEmailForm.content_panels + [
        FieldPanel("intro"),
        InlinePanel("form_fields", label="Campi aggiuntivi"),
        FieldPanel("thank_you_text"),
        MultiFieldPanel(
            [
                FieldRowPanel(
                    [
                        FieldPanel("from_address", classname="col6"),
                        FieldPanel("to_address", classname="col6"),
                    ]
                ),
                FieldPanel("subject"),
            ],
            heading="Configurazione Email",
        ),
    ]

    parent_page_types = ["core.HomePage"]
    subpage_types = []
    max_count = 1

    class Meta:
        verbose_name = "Pagina Form Booking"

    def get_context(self, request, *args, **kwargs):
        """Inietta il contesto artista nel form."""
        context = super().get_context(request, *args, **kwargs)
        artist_id = request.GET.get("artist_id")
        artist_name = request.GET.get("artist_name", "")
        event_type = request.GET.get("event_type", "")

        context["prefilled_artist_id"] = artist_id
        context["prefilled_artist_name"] = artist_name
        context["prefilled_event_type"] = event_type
        context["is_artist_locked"] = bool(artist_id)
        return context

    def process_form_submission(self, form):
        """Routing email in base all'artista selezionato + salvataggio."""
        submission = super().process_form_submission(form)

        artist_name = form.cleaned_data.get("requested_artist", "")
        if artist_name:
            from .email_routing import get_manager_email

            manager_email = get_manager_email(artist_name)
            if manager_email:
                self._send_notification_to_manager(form, manager_email, artist_name)

        return submission

    def _send_notification_to_manager(self, form, manager_email, artist_name):
        """Invia notifica al manager specifico dell'artista."""
        send_mail(
            subject=f"[MagixPromotion] Richiesta booking: {artist_name}",
            message=self._build_email_body(form),
            from_email=self.from_address or "noreply@magixpromotion.it",
            recipient_list=[manager_email],
            fail_silently=True,
        )

    def _build_email_body(self, form):
        """Costruisce il corpo email dalla submission."""
        lines = []
        for field_name, value in form.cleaned_data.items():
            label = field_name.replace("_", " ").title()
            lines.append(f"{label}: {value}")
        return "\n".join(lines)
