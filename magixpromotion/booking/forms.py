"""Form booking con campi fissi + campi dinamici da CMS."""
from django import forms
from django.utils.translation import gettext_lazy as _


EVENT_TYPE_CHOICES = [
    ("", _("— Seleziona tipo evento —")),
    ("matrimonio", _("Matrimonio")),
    ("piazza", _("Festa di Piazza")),
    ("club", _("Club / Locale")),
    ("teatro", _("Teatro")),
    ("corporate", _("Evento Aziendale")),
    ("festival", _("Festival")),
    ("privato", _("Evento Privato")),
    ("altro", _("Altro")),
]


class BookingForm(forms.Form):
    """Form con campi fissi per richiesta preventivo."""

    full_name = forms.CharField(
        max_length=200,
        label=_("Nome e Cognome *"),
        widget=forms.TextInput(attrs={"placeholder": _("Mario Rossi")}),
    )
    email = forms.EmailField(
        label=_("Email *"),
        widget=forms.EmailInput(attrs={"placeholder": "mario@esempio.it"}),
    )
    phone = forms.CharField(
        max_length=30,
        required=False,
        label=_("Telefono"),
        widget=forms.TextInput(attrs={"placeholder": "+39 ..."}),
    )
    company = forms.CharField(
        max_length=200,
        required=False,
        label=_("Azienda / Ente"),
        help_text=_("Se applicabile."),
    )
    requested_artist = forms.CharField(
        max_length=200,
        label=_("Artista / Band richiesto *"),
        help_text=_("Se arrivi dalla scheda artista, questo campo e' precompilato."),
    )
    event_type = forms.ChoiceField(
        choices=EVENT_TYPE_CHOICES,
        label=_("Tipo di evento *"),
    )
    event_date = forms.DateField(
        required=False,
        label=_("Data evento (indicativa)"),
        widget=forms.DateInput(attrs={"type": "date"}),
    )
    event_location = forms.CharField(
        max_length=300,
        required=False,
        label=_("Luogo evento"),
        widget=forms.TextInput(attrs={"placeholder": _("Citta, Venue...")}),
    )
    estimated_budget = forms.CharField(
        max_length=100,
        required=False,
        label=_("Budget indicativo"),
        help_text=_("Opzionale. Ci aiuta a proporti la soluzione migliore."),
    )
    message = forms.CharField(
        widget=forms.Textarea(attrs={"rows": 4, "placeholder": _("Descrivi il tuo evento...")}),
        label=_("Messaggio"),
    )
    privacy = forms.BooleanField(
        label=_("Acconsento al trattamento dei dati personali *"),
        help_text=_("Informativa privacy disponibile al link in fondo alla pagina."),
    )
