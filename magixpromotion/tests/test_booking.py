"""Test per il form di booking."""
import pytest

from booking.forms import BookingForm


@pytest.mark.django_db
class TestBookingForm:
    def _valid_data(self):
        """Return a dict with all required fields populated."""
        return {
            "full_name": "Mario Rossi",
            "email": "mario@test.com",
            "requested_artist": "Red Moon",
            "event_type": "matrimonio",
            "message": "Vorremmo la band per il nostro matrimonio.",
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

    def test_missing_full_name(self):
        data = self._valid_data()
        del data["full_name"]
        form = BookingForm(data=data)
        assert not form.is_valid()
        assert "full_name" in form.errors

    def test_missing_artista(self):
        data = self._valid_data()
        del data["requested_artist"]
        form = BookingForm(data=data)
        assert not form.is_valid()
        assert "requested_artist" in form.errors

    def test_missing_event_type(self):
        data = self._valid_data()
        del data["event_type"]
        form = BookingForm(data=data)
        assert not form.is_valid()
        assert "event_type" in form.errors

    def test_missing_message(self):
        data = self._valid_data()
        del data["message"]
        form = BookingForm(data=data)
        assert not form.is_valid()
        assert "message" in form.errors

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
        # phone, company, event_date, event_location, estimated_budget are optional
        assert "phone" not in form.errors
        assert "company" not in form.errors
        assert "event_date" not in form.errors
        assert "event_location" not in form.errors
        assert "estimated_budget" not in form.errors

    def test_all_fields_populated(self):
        data = self._valid_data()
        data.update(
            {
                "phone": "+39 335 123 4567",
                "company": "Azienda Test SRL",
                "event_date": "2026-09-15",
                "event_location": "Como, Villa Olmo",
                "estimated_budget": "5000 EUR",
            }
        )
        form = BookingForm(data=data)
        assert form.is_valid(), form.errors

    def test_event_type_invalid_choice(self):
        data = self._valid_data()
        data["event_type"] = "invalid_choice"
        form = BookingForm(data=data)
        assert not form.is_valid()
        assert "event_type" in form.errors
