# TASK 07 — Booking Form Context-Aware

> **Agente:** Backend  
> **Fase:** 2 — Business Logic  
> **Dipendenze:** Task 03, Task 04  
> **Stima:** 40 min  

---

## OBIETTIVO

Implementare un form di booking/contatto "intelligente" che eredita il contesto della pagina da cui viene invocato. Se l'utente clicca "Richiedi Preventivo" dalla scheda di un artista, il form arriva precompilato con il nome dell'artista e il campo è in sola lettura.

---

## FILES_IN_SCOPE (da leggere)

- `idea/3-funzionalita-booking.md` — sezioni 3.1, 3.4
- `idea/7-note-strategiche-progetto.md` — sezione 4 (Booking Intelligente)

---

## OUTPUT_ATTESO

```
booking/
├── models.py          # BookingFormPage, BookingFormField
├── forms.py           # Custom form class con contesto
├── views.py           # Processing logic
├── email_routing.py   # Routing email per artista
templates/
├── booking/
│   ├── booking_form_page.html
│   └── booking_form_landing.html   # Thank you page
```

---

## SPECIFICHE

### 1. BookingFormPage (Wagtail FormBuilder esteso)

```python
"""Form booking esteso con contesto artista."""
from django.db import models
from wagtail.models import Page
from wagtail.fields import RichTextField
from wagtail.admin.panels import FieldPanel, FieldRowPanel, MultiFieldPanel, InlinePanel
from wagtail.contrib.forms.models import AbstractFormField, AbstractEmailForm
from modelcluster.fields import ParentalKey


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

    # Campi fissi (non gestibili da editor ma sempre presenti)
    FIXED_FIELDS = [
        "nome_cognome",
        "email",
        "telefono",
        "artista_richiesto",
        "tipo_evento",
        "data_evento",
        "luogo_evento",
        "messaggio",
    ]

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

    class Meta:
        verbose_name = "Pagina Form Booking"

    def get_context(self, request, *args, **kwargs):
        """Inietta il contesto artista nel form."""
        context = super().get_context(request, *args, **kwargs)
        
        # Parametri dal referrer o query string
        artist_id = request.GET.get("artist_id")
        artist_name = request.GET.get("artist_name", "")
        event_type = request.GET.get("event_type", "")

        context["prefilled_artist_id"] = artist_id
        context["prefilled_artist_name"] = artist_name
        context["prefilled_event_type"] = event_type
        context["is_artist_locked"] = bool(artist_id)

        return context

    def get_form(self, *args, **kwargs):
        """Override per aggiungere campi fissi al form dinamico."""
        form = super().get_form(*args, **kwargs)
        return form

    def process_form_submission(self, form):
        """
        Override per:
        1. Routing email in base all'artista selezionato
        2. Salvataggio submission nel DB
        """
        submission = super().process_form_submission(form)
        
        # Routing email condizionale
        artist_name = form.cleaned_data.get("artista_richiesto", "")
        if artist_name:
            from .email_routing import get_manager_email
            manager_email = get_manager_email(artist_name)
            if manager_email:
                self._send_notification_to_manager(
                    form, manager_email, artist_name
                )

        return submission

    def _send_notification_to_manager(self, form, manager_email, artist_name):
        """Invia notifica al manager specifico dell'artista."""
        from django.core.mail import send_mail

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
```

### 2. Form Custom con Campi Fissi

```python
# booking/forms.py
"""Form booking con campi fissi + campi dinamici da CMS."""
from django import forms
from artists.models import ArtistPage


EVENT_TYPE_CHOICES = [
    ("", "— Seleziona tipo evento —"),
    ("matrimonio", "Matrimonio"),
    ("piazza", "Festa di Piazza"),
    ("club", "Club / Locale"),
    ("teatro", "Teatro"),
    ("corporate", "Evento Aziendale"),
    ("festival", "Festival"),
    ("privato", "Evento Privato"),
    ("altro", "Altro"),
]


class BookingForm(forms.Form):
    """Form con campi fissi per richiesta preventivo."""

    nome_cognome = forms.CharField(
        max_length=200,
        label="Nome e Cognome *",
        widget=forms.TextInput(attrs={"placeholder": "Mario Rossi"}),
    )
    email = forms.EmailField(
        label="Email *",
        widget=forms.EmailInput(attrs={"placeholder": "mario@esempio.it"}),
    )
    telefono = forms.CharField(
        max_length=30,
        required=False,
        label="Telefono",
        widget=forms.TextInput(attrs={"placeholder": "+39 ..."}),
    )
    azienda = forms.CharField(
        max_length=200,
        required=False,
        label="Azienda / Ente",
        help_text="Se applicabile.",
    )
    artista_richiesto = forms.CharField(
        max_length=200,
        label="Artista / Band richiesto *",
        help_text="Se arrivi dalla scheda artista, questo campo è precompilato.",
    )
    tipo_evento = forms.ChoiceField(
        choices=EVENT_TYPE_CHOICES,
        label="Tipo di evento *",
    )
    data_evento = forms.DateField(
        required=False,
        label="Data evento (indicativa)",
        widget=forms.DateInput(attrs={"type": "date"}),
    )
    luogo_evento = forms.CharField(
        max_length=300,
        required=False,
        label="Luogo evento",
        widget=forms.TextInput(attrs={"placeholder": "Città, Venue..."}),
    )
    budget_indicativo = forms.CharField(
        max_length=100,
        required=False,
        label="Budget indicativo",
        help_text="Opzionale. Ci aiuta a proporti la soluzione migliore.",
    )
    messaggio = forms.CharField(
        widget=forms.Textarea(attrs={"rows": 4, "placeholder": "Descrivi il tuo evento..."}),
        label="Messaggio",
    )
    privacy = forms.BooleanField(
        label="Acconsento al trattamento dei dati personali *",
        help_text="Informativa privacy disponibile al link in fondo alla pagina.",
    )
```

### 3. Email Routing per Artista

```python
# booking/email_routing.py
"""Routing email di notifica in base all'artista selezionato."""
from django.conf import settings

# Mappa artista → email manager (configurabile da settings o DB)
# In produzione, questo sarà un modello/snippet gestibile da admin
ARTIST_MANAGER_MAP: dict[str, str] = {
    # Popolato via management command o configurazione admin
    # "Red Moon": "manager1@magixpromotion.it",
}

DEFAULT_BOOKING_EMAIL = getattr(
    settings, "BOOKING_DEFAULT_EMAIL", "booking@magixpromotion.it"
)


def get_manager_email(artist_name: str) -> str:
    """Ritorna l'email del manager per l'artista, o il default."""
    return ARTIST_MANAGER_MAP.get(artist_name, DEFAULT_BOOKING_EMAIL)
```

---

## LINK DA ARTIST PAGE AL FORM

Nella `ArtistPage`, il bottone "Richiedi Preventivo" genera un URL tipo:
```
/booking/?artist_id=123&artist_name=Red+Moon&event_type=
```

Nel template `TalentDetail.tsx` del frontend, il bottone "BOOKING ENQUIRIES" chiamerà questa URL.

---

## NOTE IMPLEMENTATIVE

1. **Wagtail FormBuilder + Campi fissi:** I campi fissi (`BookingForm`) vengono renderizzati per primi. I campi dinamici aggiunti dall'editor via `InlinePanel` vengono accodati.
2. **`readonly` su artista:** Se `artist_id` è presente nel query string, il campo viene reso readonly/disabled nel frontend + validato nel backend.
3. **CSRF:** Il form Django include `{% csrf_token %}`. Il frontend React dovrà fare una fetch dell'endpoint o usare un approccio API (vedi Task 18).
4. **Privacy GDPR:** Il campo privacy è obbligatorio. Il link all'informativa va verso una pagina CMS.

---

## CRITERI DI ACCETTAZIONE

- [ ] BookingFormPage creabile sotto HomePage
- [ ] Campi fissi (nome, email, artista, tipo evento) sempre presenti
- [ ] Campi aggiuntivi gestibili da admin via InlinePanel
- [ ] Precompilazione artista da query string `?artist_id=123`
- [ ] Campo artista readonly quando precompilato
- [ ] Email inviata al manager corretto (routing per artista)
- [ ] Email fallback a `BOOKING_DEFAULT_EMAIL` se artista non mappato
- [ ] Submission salvata nel DB Wagtail (Form Submissions)
- [ ] Privacy checkbox obbligatoria

---

## SEZIONE TDD

```python
# tests/test_booking_form.py
import pytest
from django.test import Client

@pytest.mark.django_db
class TestBookingFormSecurity:
    def test_csrf_required(self, home_page):
        """Form POST senza CSRF token deve fallire."""
        client = Client(enforce_csrf_checks=True)
        response = client.post("/api/v2/booking/submit/", {})
        assert response.status_code in (403, 400)

    def test_rate_limiting(self, home_page):
        """Non più di 5 richieste/minuto per IP."""
        # Da implementare con django-ratelimit o throttling DRF
        pass

    def test_email_sanitized(self, home_page):
        """Email con header injection deve essere rifiutata."""
        client = Client()
        data = {
            "nome": "Test",
            "email": "test@test.com\r\nBcc: spam@evil.com",
            "privacy": True,
        }
        response = client.post("/api/v2/booking/submit/", data, content_type="application/json")
        assert response.status_code == 400
```

---

## SECURITY CHECKLIST

- [ ] CSRF protection attiva sul form
- [ ] Rate limiting: max 5 richieste/minuto per IP
- [ ] Sanitizzazione input: no HTML injection in nome/messaggio
- [ ] Email header injection bloccata
- [ ] Privacy checkbox obbligatoria (GDPR compliance)
- [ ] Dati booking salvati in DB (audit trail)
