"""Test per il form di booking."""
import pytest

from booking.forms import BookingForm


@pytest.mark.django_db
class TestBookingForm:
    def _valid_data(self):
        """Return a dict with all required fields populated."""
        return {
            "nome_cognome": "Mario Rossi",
            "email": "mario@test.com",
            "artista_richiesto": "Red Moon",
            "tipo_evento": "matrimonio",
            "messaggio": "Vorremmo la band per il nostro matrimonio.",
            "privacy": True,
        }

    def test_valid_form(self):
        form = BookingForm(data=self._valid_data())
        assert form.is_valid(), form.errors

    def test_missing_email(self):
        data = self._valid_data()
        del data["email"]
        form = BookingForm(data=data)
        assert not form.is_valid()
        assert "email" in form.errors

    def test_invalid_email_format(self):
        data = self._valid_data()
        data["email"] = "not-an-email"
        form = BookingForm(data=data)
        assert not form.is_valid()
        assert "email" in form.errors

    def test_missing_nome_cognome(self):
        data = self._valid_data()
        del data["nome_cognome"]
        form = BookingForm(data=data)
        assert not form.is_valid()
        assert "nome_cognome" in form.errors

    def test_missing_artista(self):
        data = self._valid_data()
        del data["artista_richiesto"]
        form = BookingForm(data=data)
        assert not form.is_valid()
        assert "artista_richiesto" in form.errors

    def test_missing_tipo_evento(self):
        data = self._valid_data()
        del data["tipo_evento"]
        form = BookingForm(data=data)
        assert not form.is_valid()
        assert "tipo_evento" in form.errors

    def test_missing_messaggio(self):
        data = self._valid_data()
        del data["messaggio"]
        form = BookingForm(data=data)
        assert not form.is_valid()
        assert "messaggio" in form.errors

    def test_privacy_false(self):
        data = self._valid_data()
        data["privacy"] = False
        form = BookingForm(data=data)
        assert not form.is_valid()
        assert "privacy" in form.errors

    def test_privacy_missing(self):
        data = self._valid_data()
        del data["privacy"]
        form = BookingForm(data=data)
        assert not form.is_valid()
        assert "privacy" in form.errors

    def test_optional_fields(self):
        """Optional fields should not cause validation errors when omitted."""
        data = self._valid_data()
        # These are all optional
        form = BookingForm(data=data)
        assert form.is_valid()
        # telefono, azienda, data_evento, luogo_evento, budget_indicativo are optional
        assert "telefono" not in form.errors
        assert "azienda" not in form.errors
        assert "data_evento" not in form.errors
        assert "luogo_evento" not in form.errors
        assert "budget_indicativo" not in form.errors

    def test_all_fields_populated(self):
        data = self._valid_data()
        data.update(
            {
                "telefono": "+39 335 123 4567",
                "azienda": "Azienda Test SRL",
                "data_evento": "2026-09-15",
                "luogo_evento": "Como, Villa Olmo",
                "budget_indicativo": "5000 EUR",
            }
        )
        form = BookingForm(data=data)
        assert form.is_valid(), form.errors

    def test_tipo_evento_invalid_choice(self):
        data = self._valid_data()
        data["tipo_evento"] = "invalid_choice"
        form = BookingForm(data=data)
        assert not form.is_valid()
        assert "tipo_evento" in form.errors
