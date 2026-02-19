/* ===================================================================
 * Tests for src/components/BookingForm.tsx
 * =================================================================== */

import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import BookingForm from "@/components/BookingForm";

/** Data futura dinamica per evitare che il campo date min={oggi} blocchi il submit */
const FUTURE_DATE = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split("T")[0]; // ~3 mesi da oggi

/**
 * Helper: compila il campo artista tramite l'autocomplete.
 * Digita il testo e poi seleziona il suggerimento (o lascia testo libero).
 */
async function fillArtistField(
  user: ReturnType<typeof userEvent.setup>,
  text: string,
) {
  const artistInput = screen.getByPlaceholderText("Artista / Band richiesta *");
  await user.type(artistInput, text);
}

/**
 * Helper: compila tutti i campi obbligatori del form.
 */
async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText("Il tuo nome *"), "Mario Rossi");
  await user.type(screen.getByPlaceholderText("Email *"), "mario@example.com");
  await fillArtistField(user, "The Groove Machine");

  // Select event type (primo combobox visibile)
  const eventTypeSelect = screen.getByLabelText("Tipo evento");
  await user.selectOptions(eventTypeSelect, "matrimonio");

  // Data evento
  const dateInput = document.querySelector(
    'input[name="event_date"]',
  ) as HTMLInputElement;
  await user.type(dateInput, FUTURE_DATE);

  // Location
  await user.type(
    screen.getByPlaceholderText("Citta' / Provincia *"),
    "Milano",
  );

  // Privacy checkbox
  const privacyCheckbox = screen.getByRole("checkbox");
  await user.click(privacyCheckbox);
}

describe("BookingForm", () => {
  it("renders all required form fields", () => {
    render(<BookingForm />);

    expect(screen.getByPlaceholderText("Il tuo nome *")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email *")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Telefono (opzionale)"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Artista / Band richiesta *"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Citta' / Provincia *"),
    ).toBeInTheDocument();
    expect(screen.getByText("Seleziona tipo evento...")).toBeInTheDocument();
    expect(
      screen.getByText("Fascia di budget (opzionale)"),
    ).toBeInTheDocument();
  });

  it("renders privacy checkbox", () => {
    render(<BookingForm />);
    expect(
      screen.getByText(/Acconsento al trattamento dei dati/),
    ).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<BookingForm />);
    expect(
      screen.getByRole("button", { name: /INVIA RICHIESTA/ }),
    ).toBeInTheDocument();
  });

  it("submit button is disabled when form is incomplete", () => {
    render(<BookingForm />);
    const button = screen.getByRole("button", { name: /INVIA RICHIESTA/ });
    expect(button).toBeDisabled();
  });

  it("pre-fills artist name when preselectedArtist is provided", () => {
    render(<BookingForm preselectedArtist="The Groove Machine" />);
    // Il campo è readonly (locked) con il valore preselezionato
    const artistInput = screen.getByLabelText("Artista o band richiesta");
    expect(artistInput).toHaveValue("The Groove Machine");
    expect(artistInput).toHaveAttribute("readOnly");
  });

  it("shows autocomplete dropdown when typing", async () => {
    const user = userEvent.setup();
    render(<BookingForm />);

    const artistInput = screen.getByPlaceholderText(
      "Artista / Band richiesta *",
    );
    await user.click(artistInput);

    // Il dropdown dovrebbe aprirsi con le opzioni dal mock
    await waitFor(() => {
      expect(screen.getByText("Altro / Non in elenco...")).toBeInTheDocument();
    });
  });

  it("enables submit button after filling all required fields", async () => {
    const user = userEvent.setup();
    render(<BookingForm />);

    await fillRequiredFields(user);

    const button = screen.getByRole("button", { name: /INVIA RICHIESTA/ });
    expect(button).not.toBeDisabled();
  });

  it("shows success message after successful submission", async () => {
    const user = userEvent.setup();
    render(<BookingForm />);

    await fillRequiredFields(user);

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

    await fillRequiredFields(user);

    const button = screen.getByRole("button", { name: /INVIA RICHIESTA/ });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText("Errore nel server")).toBeInTheDocument();
    });
  });

  it("allows submitting a new request after success", async () => {
    const user = userEvent.setup();
    render(<BookingForm />);

    await fillRequiredFields(user);

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
