# TASK 18 — Frontend Booking Form

> **Agente:** Frontend  
> **Fase:** 4 — Frontend  
> **Dipendenze:** Task 13, Task 07 (backend form)  
> **Stima:** 25 min  

---

## OBIETTIVO

Creare il componente React per il form di richiesta preventivo (booking). Il form:
1. Invia i dati al backend Django via POST
2. Può essere prepopolato con artista/evento (da navigazione)
3. Include validazione client-side
4. Mostra stato di invio (loading, success, error)

---

## FILES_IN_SCOPE (da leggere)

- `tasks/07-booking-form.md` — Backend form fields e validazione
- `frontend/src/types.ts`
- `frontend/src/lib/api.ts`

---

## OUTPUT_ATTESO

```
frontend/src/components/
├── BookingForm.tsx         # Form completo con validazione
├── BookingPage.tsx         # Wrapper con hero section + form
```

Aggiungere in `frontend/src/lib/api.ts`:
```typescript
export async function submitBooking(data: BookingFormData): Promise<{ success: boolean; message: string }> { ... }
```

---

## SPECIFICHE

### 1. Tipo dati form

```typescript
// Aggiungere in types.ts
export interface BookingFormData {
  nome: string;
  email: string;
  telefono?: string;
  artista: string;           // Nome artista selezionato
  tipo_evento: string;       // matrimonio, corporate, festival, etc.
  data_evento: string;       // YYYY-MM-DD
  luogo: string;             // Città/provincia
  budget?: string;           // fascia di budget
  note?: string;
  privacy: boolean;
}
```

### 2. BookingForm.tsx

```tsx
import React from "react";
import { BookingFormData } from "@/types";
import { submitBooking } from "@/lib/api";
import { Send, CheckCircle, AlertCircle, Loader } from "lucide-react";

interface BookingFormProps {
  /** Nome artista preselezionato (da navigazione) */
  preselectedArtist?: string;
}

const EVENT_TYPES = [
  { value: "", label: "Seleziona tipo evento..." },
  { value: "matrimonio", label: "Matrimonio" },
  { value: "corporate", label: "Evento Aziendale" },
  { value: "festival", label: "Festival / Sagra" },
  { value: "privato", label: "Festa Privata" },
  { value: "locale", label: "Locale / Pub" },
  { value: "piazza", label: "Concerto in Piazza" },
  { value: "altro", label: "Altro" },
];

const BUDGET_RANGES = [
  { value: "", label: "Fascia di budget (opzionale)" },
  { value: "sotto-1000", label: "Fino a €1.000" },
  { value: "1000-2500", label: "€1.000 – €2.500" },
  { value: "2500-5000", label: "€2.500 – €5.000" },
  { value: "5000-10000", label: "€5.000 – €10.000" },
  { value: "oltre-10000", label: "Oltre €10.000" },
];

type FormStatus = "idle" | "submitting" | "success" | "error";

const BookingForm: React.FC<BookingFormProps> = ({ preselectedArtist }) => {
  const [formData, setFormData] = React.useState<BookingFormData>({
    nome: "",
    email: "",
    telefono: "",
    artista: preselectedArtist || "",
    tipo_evento: "",
    data_evento: "",
    luogo: "",
    budget: "",
    note: "",
    privacy: false,
  });
  const [status, setStatus] = React.useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = React.useState("");

  // Aggiorna artista se viene preselezionato dopo il mount
  React.useEffect(() => {
    if (preselectedArtist) {
      setFormData((prev) => ({ ...prev, artista: preselectedArtist }));
    }
  }, [preselectedArtist]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const isValid = () => {
    return (
      formData.nome.trim() !== "" &&
      formData.email.includes("@") &&
      formData.artista.trim() !== "" &&
      formData.tipo_evento !== "" &&
      formData.data_evento !== "" &&
      formData.luogo.trim() !== "" &&
      formData.privacy === true
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid()) return;

    setStatus("submitting");
    setErrorMessage("");

    try {
      const result = await submitBooking(formData);
      if (result.success) {
        setStatus("success");
      } else {
        setErrorMessage(result.message || "Errore nell'invio.");
        setStatus("error");
      }
    } catch (err) {
      setErrorMessage("Errore di connessione. Riprova più tardi.");
      setStatus("error");
    }
  };

  // Classe input condivisa
  const inputClass =
    "w-full bg-[var(--glass)] border border-[var(--glass-border)] px-5 py-4 rounded-2xl text-[var(--text-main)] placeholder:text-[var(--text-muted)]/40 focus:outline-none focus:border-[var(--accent)]/50 transition-all";

  if (status === "success") {
    return (
      <div className="text-center py-16">
        <CheckCircle className="mx-auto text-emerald-500 mb-6" size={64} />
        <h3 className="text-3xl font-heading font-extrabold text-[var(--text-main)] mb-4">
          Richiesta Inviata!
        </h3>
        <p className="text-[var(--text-muted)] text-lg max-w-md mx-auto">
          Ti risponderemo entro 24 ore con un preventivo personalizzato per il tuo evento.
        </p>
        <button
          onClick={() => {
            setStatus("idle");
            setFormData((prev) => ({ ...prev, nome: "", email: "", note: "" }));
          }}
          className="mt-8 px-8 py-3 glass-panel rounded-full font-bold text-[var(--text-main)] hover:bg-[var(--glass)] transition-colors"
        >
          NUOVA RICHIESTA
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Errore */}
      {status === "error" && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 text-rose-500">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Riga 1: Nome + Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text" name="nome"
          placeholder="Il tuo nome *"
          value={formData.nome}
          onChange={handleChange}
          required
          className={inputClass}
        />
        <input
          type="email" name="email"
          placeholder="Email *"
          value={formData.email}
          onChange={handleChange}
          required
          className={inputClass}
        />
      </div>

      {/* Riga 2: Telefono + Artista */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="tel" name="telefono"
          placeholder="Telefono (opzionale)"
          value={formData.telefono}
          onChange={handleChange}
          className={inputClass}
        />
        <input
          type="text" name="artista"
          placeholder="Artista / Band richiesta *"
          value={formData.artista}
          onChange={handleChange}
          required
          className={inputClass}
        />
      </div>

      {/* Riga 3: Tipo evento + Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select
          name="tipo_evento"
          value={formData.tipo_evento}
          onChange={handleChange}
          required
          className={inputClass}
        >
          {EVENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <input
          type="date" name="data_evento"
          value={formData.data_evento}
          onChange={handleChange}
          required
          min={new Date().toISOString().split("T")[0]}
          className={inputClass}
        />
      </div>

      {/* Riga 4: Luogo + Budget */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text" name="luogo"
          placeholder="Città / Provincia *"
          value={formData.luogo}
          onChange={handleChange}
          required
          className={inputClass}
        />
        <select
          name="budget"
          value={formData.budget}
          onChange={handleChange}
          className={inputClass}
        >
          {BUDGET_RANGES.map((b) => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </select>
      </div>

      {/* Note */}
      <textarea
        name="note"
        placeholder="Note aggiuntive (orario, location, richieste speciali...)"
        value={formData.note}
        onChange={handleChange}
        rows={4}
        className={inputClass + " resize-none"}
      />

      {/* Privacy checkbox */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          name="privacy"
          checked={formData.privacy}
          onChange={handleChange}
          className="mt-1 accent-[var(--accent)]"
          required
        />
        <span className="text-sm text-[var(--text-muted)]">
          Acconsento al trattamento dei dati personali ai sensi del GDPR (Reg. UE 2016/679).
          Leggi la <a href="/privacy" className="text-[var(--accent)] hover:underline">Privacy Policy</a>.
        </span>
      </label>

      {/* Submit */}
      <button
        type="submit"
        disabled={!isValid() || status === "submitting"}
        className="w-full px-12 py-5 bg-[var(--text-main)] text-[var(--bg-color)] font-black tracking-widest rounded-full text-lg shadow-xl shadow-[var(--accent)]/10 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        {status === "submitting" ? (
          <>
            <Loader className="animate-spin" size={20} />
            INVIO IN CORSO...
          </>
        ) : (
          <>
            <Send size={20} />
            INVIA RICHIESTA
          </>
        )}
      </button>
    </form>
  );
};

export default BookingForm;
```

### 3. BookingPage.tsx

```tsx
import React from "react";
import BookingForm from "./BookingForm";
import { Mail } from "lucide-react";

interface BookingPageProps {
  preselectedArtist?: string;
}

const BookingPage: React.FC<BookingPageProps> = ({ preselectedArtist }) => {
  return (
    <div className="max-w-3xl mx-auto px-6 py-24">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 glass-panel rounded-full text-[var(--accent)] text-sm font-bold tracking-widest mb-6">
          <Mail size={16} />
          RICHIESTA PREVENTIVO
        </div>
        <h2 className="text-4xl md:text-6xl font-heading font-extrabold tracking-tighter mb-6 text-[var(--text-main)]">
          PRENOTA LA TUA <span className="gradient-text">BAND</span>
        </h2>
        <p className="text-[var(--text-muted)] text-lg max-w-xl mx-auto">
          Compila il form e riceverai un preventivo personalizzato entro 24 ore. 
          Nessun impegno, solo la musica giusta per il tuo evento.
        </p>
      </div>

      {/* Form */}
      <div className="glass-panel rounded-[2rem] p-8 md:p-12 border border-[var(--glass-border)]">
        <BookingForm preselectedArtist={preselectedArtist} />
      </div>

      {/* Info contatto alternativo */}
      <div className="mt-12 text-center text-[var(--text-muted)] text-sm">
        <p>
          Preferisci parlare direttamente? Scrivici a{" "}
          <a href="mailto:info@magixpromotion.it" className="text-[var(--accent)] hover:underline">
            info@magixpromotion.it
          </a>
        </p>
      </div>
    </div>
  );
};

export default BookingPage;
```

### 4. API submitBooking — Aggiungere a `lib/api.ts`

```typescript
/* ---------- Booking ---------- */
export async function submitBooking(
  data: import("@/types").BookingFormData
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/api/v2/booking/submit/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCsrfToken(),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { success: false, message: err.detail || "Errore di invio" };
  }

  return { success: true, message: "Richiesta inviata con successo" };
}

/** Legge il CSRF token dal cookie Django */
function getCsrfToken(): string {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : "";
}
```

---

## NOTE IMPLEMENTATIVE

1. **CSRF Token:** Il form fa POST al backend Django, che richiede CSRF. Il token viene letto dal cookie `csrftoken` settato da Django.
2. **Prepopolazione artista:** Quando l'utente clicca "Richiedi Preventivo" dal dettaglio artista, il nome viene passato come prop `preselectedArtist`.
3. **Data minima:** Il campo data ha `min={today}` per impedire date passate.
4. **Privacy GDPR:** Checkbox obbligatorio per conformità GDPR. Testo include link alla privacy policy.
5. **Budget opzionale:** Le fasce di budget sono indicative, utili per il preventivo ma non obbligatorie.
6. **Status machine:** `idle → submitting → success/error`. Lo stato `success` mostra conferma, `error` mostra messaggio con opzione di retry.
7. **Stile coerente:** Input, select e textarea usano le stesse classi glass-panel del template per coerenza visiva.

---

## CRITERI DI ACCETTAZIONE

- [ ] Form mostra tutti i campi (nome, email, tel, artista, tipo, data, luogo, budget, note, privacy)
- [ ] Campi obbligatori evidenziati (*) e validati
- [ ] Data non accetta date passate
- [ ] Artista prepopolato se arriva da ArtistDetail
- [ ] CSRF token incluso nella request POST
- [ ] Stato "submitting" mostra spinner
- [ ] Stato "success" mostra messaggio di conferma
- [ ] Stato "error" mostra errore con possibilità di retry
- [ ] Privacy checkbox obbligatorio con link GDPR
- [ ] Layout responsive (2 colonne desktop, 1 mobile)
- [ ] Stile visivo coerente con glassmorphism del template
