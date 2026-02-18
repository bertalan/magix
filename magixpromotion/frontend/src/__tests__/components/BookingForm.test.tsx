/* ===================================================================
 * Tests for src/components/BookingForm.tsx
 * =================================================================== */

import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import BookingForm from "@/components/BookingForm";

describe("BookingForm", () => {
  it("renders all required form fields", () => {
    render(<BookingForm />);

    expect(screen.getByPlaceholderText("Il tuo nome *")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email *")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Telefono (opzionale)")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Artista / Band richiesta *")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Citta' / Provincia *")).toBeInTheDocument();
    expect(screen.getByText("Seleziona tipo evento...")).toBeInTheDocument();
    expect(screen.getByText("Fascia di budget (opzionale)")).toBeInTheDocument();
  });

  it("renders privacy checkbox", () => {
    render(<BookingForm />);
    expect(screen.getByText(/Acconsento al trattamento dei dati/)).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<BookingForm />);
    expect(screen.getByRole("button", { name: /INVIA RICHIESTA/ })).toBeInTheDocument();
  });

  it("submit button is disabled when form is incomplete", () => {
    render(<BookingForm />);
    const button = screen.getByRole("button", { name: /INVIA RICHIESTA/ });
    expect(button).toBeDisabled();
  });

  it("pre-fills artist name when preselectedArtist is provided", () => {
    render(<BookingForm preselectedArtist="The Groove Machine" />);
    const artistInput = screen.getByPlaceholderText("Artista / Band richiesta *");
    expect(artistInput).toHaveValue("The Groove Machine");
  });

  it("enables submit button after filling all required fields", async () => {
    const user = userEvent.setup();
    render(<BookingForm />);

    // Fill required fields
    await user.type(screen.getByPlaceholderText("Il tuo nome *"), "Mario Rossi");
    await user.type(screen.getByPlaceholderText("Email *"), "mario@example.com");
    await user.type(
      screen.getByPlaceholderText("Artista / Band richiesta *"),
      "The Groove Machine",
    );

    // Select event type
    const eventTypeSelect = screen.getAllByRole("combobox")[0];
    await user.selectOptions(eventTypeSelect, "matrimonio");

    // Fill date (type=date)
    const dateInput = document.querySelector('input[name="event_date"]') as HTMLInputElement;
    await user.type(dateInput, "2025-09-15");

    // Fill location
    await user.type(screen.getByPlaceholderText("Citta' / Provincia *"), "Milano");

    // Check privacy
    const privacyCheckbox = screen.getByRole("checkbox");
    await user.click(privacyCheckbox);

    const button = screen.getByRole("button", { name: /INVIA RICHIESTA/ });
    expect(button).not.toBeDisabled();
  });

  it("shows success message after successful submission", async () => {
    const user = userEvent.setup();
    render(<BookingForm />);

    // Fill all required fields
    await user.type(screen.getByPlaceholderText("Il tuo nome *"), "Mario Rossi");
    await user.type(screen.getByPlaceholderText("Email *"), "mario@example.com");
    await user.type(
      screen.getByPlaceholderText("Artista / Band richiesta *"),
      "The Groove Machine",
    );
    const eventTypeSelect = screen.getAllByRole("combobox")[0];
    await user.selectOptions(eventTypeSelect, "matrimonio");
    const dateInput = document.querySelector('input[name="event_date"]') as HTMLInputElement;
    await user.type(dateInput, "2025-09-15");
    await user.type(screen.getByPlaceholderText("Citta' / Provincia *"), "Milano");
    const privacyCheckbox = screen.getByRole("checkbox");
    await user.click(privacyCheckbox);

    // Submit
    const button = screen.getByRole("button", { name: /INVIA RICHIESTA/ });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText("Richiesta Inviata!")).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Ti risponderemo entro 24 ore/),
    ).toBeInTheDocument();
  });

  it("shows error message on submission failure", async () => {
    server.use(
      http.post("/api/v2/booking/submit/", () => {
        return HttpResponse.json(
          { detail: "Errore nel server" },
          { status: 400 },
        );
      }),
    );

    const user = userEvent.setup();
    render(<BookingForm />);

    // Fill all required fields
    await user.type(screen.getByPlaceholderText("Il tuo nome *"), "Mario Rossi");
    await user.type(screen.getByPlaceholderText("Email *"), "mario@example.com");
    await user.type(
      screen.getByPlaceholderText("Artista / Band richiesta *"),
      "The Groove Machine",
    );
    const eventTypeSelect = screen.getAllByRole("combobox")[0];
    await user.selectOptions(eventTypeSelect, "matrimonio");
    const dateInput = document.querySelector('input[name="event_date"]') as HTMLInputElement;
    await user.type(dateInput, "2025-09-15");
    await user.type(screen.getByPlaceholderText("Citta' / Provincia *"), "Milano");
    const privacyCheckbox = screen.getByRole("checkbox");
    await user.click(privacyCheckbox);

    // Submit
    const button = screen.getByRole("button", { name: /INVIA RICHIESTA/ });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText("Errore nel server")).toBeInTheDocument();
    });
  });

  it("allows submitting a new request after success", async () => {
    const user = userEvent.setup();
    render(<BookingForm />);

    // Fill and submit
    await user.type(screen.getByPlaceholderText("Il tuo nome *"), "Mario Rossi");
    await user.type(screen.getByPlaceholderText("Email *"), "mario@example.com");
    await user.type(
      screen.getByPlaceholderText("Artista / Band richiesta *"),
      "The Groove Machine",
    );
    const eventTypeSelect = screen.getAllByRole("combobox")[0];
    await user.selectOptions(eventTypeSelect, "matrimonio");
    const dateInput = document.querySelector('input[name="event_date"]') as HTMLInputElement;
    await user.type(dateInput, "2025-09-15");
    await user.type(screen.getByPlaceholderText("Citta' / Provincia *"), "Milano");
    const privacyCheckbox = screen.getByRole("checkbox");
    await user.click(privacyCheckbox);

    const button = screen.getByRole("button", { name: /INVIA RICHIESTA/ });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText("Richiesta Inviata!")).toBeInTheDocument();
    });

    // Click "NUOVA RICHIESTA"
    const newRequestButton = screen.getByRole("button", {
      name: "NUOVA RICHIESTA",
    });
    await user.click(newRequestButton);

    // Should be back to form
    expect(screen.getByPlaceholderText("Il tuo nome *")).toBeInTheDocument();
  });
});
