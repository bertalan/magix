import React from "react";
import type { BookingFormData } from "@/types";
import { submitBooking } from "@/lib/api";
import { Send, CheckCircle, AlertCircle, Loader } from "lucide-react";
import ArtistAutocomplete from "./ArtistAutocomplete";
import { useLanguage } from "@/contexts/LanguageContext";

interface BookingFormProps {
  /** Nome artista preselezionato (da navigazione) */
  preselectedArtist?: string;
}

const EVENT_TYPE_KEYS = [
  { value: "", i18nKey: "booking.selectEventType" },
  { value: "matrimonio", i18nKey: "booking.matrimonio" },
  { value: "corporate", i18nKey: "booking.corporate" },
  { value: "festival", i18nKey: "booking.festival" },
  { value: "privato", i18nKey: "booking.privato" },
  { value: "locale", i18nKey: "booking.locale" },
  { value: "piazza", i18nKey: "booking.piazza" },
  { value: "altro", i18nKey: "booking.altro" },
];

const BUDGET_RANGE_KEYS = [
  { value: "", i18nKey: "booking.budgetEmpty" },
  { value: "sotto-1000", i18nKey: "booking.budgetUnder1000" },
  { value: "1000-2500", i18nKey: "booking.budget1000_2500" },
  { value: "2500-5000", i18nKey: "booking.budget2500_5000" },
  { value: "5000-10000", i18nKey: "booking.budget5000_10000" },
  { value: "oltre-10000", i18nKey: "booking.budgetOver10000" },
];

type FormStatus = "idle" | "submitting" | "success" | "error";

/**
 * Form richiesta preventivo con validazione client-side.
 * Campi obbligatori: full_name, email, requested_artist, event_type, event_date, event_location, privacy.
 * Macchina a stati: idle -> submitting -> success | error.
 * Il token CSRF viene incluso nella richiesta POST via cookie.
 */
const BookingForm: React.FC<BookingFormProps> = ({ preselectedArtist }) => {
  const { t, lang } = useLanguage();
  const [formData, setFormData] = React.useState<BookingFormData>({
    full_name: "",
    email: "",
    phone: "",
    requested_artist: preselectedArtist || "",
    event_type: "",
    event_date: "",
    event_location: "",
    estimated_budget: "",
    message: "",
    privacy: false,
  });
  const [status, setStatus] = React.useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = React.useState("");

  // Aggiorna artista quando cambia dopo il mount
  React.useEffect(() => {
    if (preselectedArtist) {
      setFormData((prev) => ({ ...prev, requested_artist: preselectedArtist }));
    }
  }, [preselectedArtist]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

  const isValid = (): boolean => {
    return (
      formData.full_name.trim() !== "" &&
      formData.email.includes("@") &&
      formData.requested_artist.trim() !== "" &&
      formData.event_type !== "" &&
      formData.event_date !== "" &&
      formData.event_location.trim() !== "" &&
      formData.privacy === true
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid()) return;

    setStatus("submitting");
    setErrorMessage("");

    try {
      const result = await submitBooking(formData, lang);
      if (result.success) {
        setStatus("success");
      } else {
        setErrorMessage(result.message || t("booking.errorGeneric"));
        setStatus("error");
      }
    } catch {
      setErrorMessage(t("booking.errorConnection"));
      setStatus("error");
    }
  };

  // Stile condiviso per gli input
  const inputClass =
    "w-full bg-[var(--glass)] border border-[var(--glass-border)] px-5 py-4 rounded-2xl text-[var(--text-main)] placeholder:text-[var(--text-muted)]/40 focus:outline-none focus:border-[var(--accent)]/50 transition-all";

  // Data minima per il date picker (oggi)
  const minDate = new Date().toISOString().split("T")[0];

  // --- Stato successo ---
  if (status === "success") {
    return (
      <div className="text-center py-16">
        <CheckCircle className="mx-auto text-emerald-500 mb-6" size={64} />
        <h3 className="text-3xl font-heading font-extrabold text-[var(--text-main)] mb-4">
          {t("booking.successTitle")}
        </h3>
        <p className="text-[var(--text-muted)] text-lg max-w-md mx-auto">
          {t("booking.successBody")}
        </p>
        <button
          onClick={() => {
            setStatus("idle");
            setFormData({
              full_name: "",
              email: "",
              phone: "",
              requested_artist: preselectedArtist || "",
              event_type: "",
              event_date: "",
              event_location: "",
              estimated_budget: "",
              message: "",
              privacy: false,
            });
          }}
          className="mt-8 px-8 py-3 glass-panel rounded-full font-bold text-[var(--text-main)] hover:bg-[var(--glass)] transition-colors"
        >
          {t("booking.newRequest")}
        </button>
      </div>
    );
  }

  // --- Form ---
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Banner errore */}
      {status === "error" && (
        <div
          className="flex items-center gap-3 p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 text-rose-500"
          role="alert"
          id="booking-error"
        >
          <AlertCircle size={20} />
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Riga 1: Nome + Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          name="full_name"
          placeholder={t("booking.namePlaceholder")}
          value={formData.full_name}
          onChange={handleChange}
          required
          aria-required="true"
          aria-label={t("booking.nameLabel")}
          aria-describedby={status === "error" ? "booking-error" : undefined}
          className={inputClass}
        />
        <input
          type="email"
          name="email"
          placeholder={t("booking.emailPlaceholder")}
          value={formData.email}
          onChange={handleChange}
          required
          aria-required="true"
          aria-label={t("booking.emailLabel")}
          aria-describedby={status === "error" ? "booking-error" : undefined}
          className={inputClass}
        />
      </div>

      {/* Riga 2: Telefono + Artista */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="tel"
          name="phone"
          placeholder={t("booking.phonePlaceholder")}
          value={formData.phone}
          onChange={handleChange}
          aria-label={t("booking.phoneLabel")}
          className={inputClass}
        />
        <ArtistAutocomplete
          value={formData.requested_artist}
          onChange={(val) =>
            setFormData((prev) => ({ ...prev, requested_artist: val }))
          }
          locked={!!preselectedArtist}
          className={inputClass}
        />
      </div>

      {/* Riga 3: Tipo evento + Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select
          name="event_type"
          value={formData.event_type}
          onChange={handleChange}
          required
          aria-required="true"
          aria-label={t("booking.eventTypeLabel")}
          className={inputClass}
        >
          {EVENT_TYPE_KEYS.map((et) => (
            <option key={et.value} value={et.value}>
              {t(et.i18nKey)}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="event_date"
          value={formData.event_date}
          onChange={handleChange}
          required
          aria-required="true"
          aria-label={t("booking.eventDateLabel")}
          min={minDate}
          className={inputClass}
        />
      </div>

      {/* Riga 4: Luogo + Budget */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          name="event_location"
          placeholder={t("booking.locationPlaceholder")}
          value={formData.event_location}
          onChange={handleChange}
          required
          aria-required="true"
          aria-label={t("booking.locationLabel")}
          className={inputClass}
        />
        <select
          name="estimated_budget"
          value={formData.estimated_budget}
          onChange={handleChange}
          aria-label={t("booking.budgetLabel")}
          className={inputClass}
        >
          {BUDGET_RANGE_KEYS.map((b) => (
            <option key={b.value} value={b.value}>
              {t(b.i18nKey)}
            </option>
          ))}
        </select>
      </div>

      {/* Messaggio */}
      <textarea
        name="message"
        placeholder={t("booking.messagePlaceholder")}
        value={formData.message}
        onChange={handleChange}
        rows={4}
        aria-label={t("booking.messageLabel")}
        className={inputClass + " resize-none"}
      />

      {/* Checkbox GDPR privacy */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          name="privacy"
          checked={formData.privacy}
          onChange={handleChange}
          className="mt-1 accent-[var(--accent)]"
          required
          aria-required="true"
        />
        <span className="text-sm text-[var(--text-muted)]">
          {t("booking.privacyConsent")}{" "}
          <a
            href="/privacy"
            className="text-[var(--accent)] hover:underline"
          >
            {t("booking.privacyLink")}
          </a>
          .
        </span>
      </label>

      {/* Pulsante invio */}
      <button
        type="submit"
        disabled={!isValid() || status === "submitting"}
        className="w-full px-12 py-5 bg-[var(--text-main)] text-[var(--bg-color)] font-black tracking-widest rounded-full text-lg shadow-xl shadow-[var(--accent)]/10 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        {status === "submitting" ? (
          <>
            <Loader className="animate-spin" size={20} />
            {t("booking.submitting")}
          </>
        ) : (
          <>
            <Send size={20} />
            {t("booking.submitButton")}
          </>
        )}
      </button>
    </form>
  );
};

export default BookingForm;
