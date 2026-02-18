"""Form booking con campi fissi + campi dinamici da CMS."""
from django import forms


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
        help_text="Se arrivi dalla scheda artista, questo campo e' precompilato.",
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
        widget=forms.TextInput(attrs={"placeholder": "Citta, Venue..."}),
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
