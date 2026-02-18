# 3. Funzionalità Booking & Business Logic

Questo documento descrive le logiche di business applicative, in particolare la gestione delle richieste di booking e l'automazione del calendario eventi.

## 3.1 Contextual Booking Form

Il form di contatto/booking non è una pagina statica isolata. Deve "capire" da dove proviene l'utente per migliorare la UX e la qualità dei lead.

### Estensione `Wagtail FormBuilder`
Non useremo form hardcoded in Django, ma estenderemo il `FormBuilder` di Wagtail per permettere agli editor di modificare campi non critici (es. aggiungere checkbox privacy).

### Logica "Context-Aware"
Quando il form viene caricato, controllerà i parametri GET o la pagina referrer.
*   **Scenario:** Utente clicca "Book Artist" sulla pagina *Mario Rossi*.
*   **Azione:** Il form di destinazione riceve `?artist_id=123`.
*   **Risultato:**
    *   Il campo "Artista Richiesto" (Select) viene pre-selezionato su "Mario Rossi".
    *   Il campo viene reso `readonly` o visivamente bloccato per evitare errori.
    *   Se il form è integrato nella pagina stessa (es. in un modale), il contesto viene passato direttamente dal `get_context` della `ArtistPage`.

---

## 3.2 Integrazione Calendario & Tour Dates

La gestione delle date dei tour è critica. Gli eventi passati non devono sparire, ma nemmeno confondere l'utente.

### Logica Passato/Futuro
Il `QuerySet` degli eventi nella `EventListingPage` (e nei blocchi "Prossime Date" nelle `ArtistPage`) deve essere filtrato dinamicamente:

1.  **Front-end (Pubblico):** 
    *   Default: Mostra eventi con `start_date >= today`.
    *   Archivio: Sezione separata o toggle per mostrare `start_date < today`.
2.  **Ordinamento:**
    *   Futuri: Ordine cronologico ascendente (più vicino -> più lontano).
    *   Passati: Ordine cronologico discendente (più recente -> più vecchio).

### Automazione (Celery/Django-Cron)
Implementeremo un job schedulato (ogni notte alle 03:00) per la manutenzione degli eventi.

*   **Task:** `archive_past_events`
*   **Logica:** Cerca tutti gli eventi con `end_date < yesterday` e stato `Live`.
*   **Azione:** 
    *   NON unpublish (per non perdere SEO e 404).
    *   Cambio stato custom o flag `is_archived = True`.
    *   Spostamento automatico sotto una pagina genitore "Archivio Eventi" (Opzionale, se l'albero diventa troppo grande).

---

## 3.3 Gestione Disponibilità (Opzionale/Fase 2)
In questa fase **NON** implementiamo un calendario disponibilità in tempo reale (gestione complessa sincrona con Google Calendar degli artisti).
*   Il sistema è "Request based".
*   Messaggio chiaro all'utente: "Availability subject to confirmation".

## 3.4 Notifiche Admin
Le richieste di booking devono essere instradate correttamente.
*   Configurazione custom del `FormPage` per inviare email a destinatari diversi in base all'artista selezionato (es. Manager A per Artista X, Manager B per Artista Y).
*   Routing basato su logica condizionale nel metodo `process_form_submission`.
