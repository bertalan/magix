# 2. Logica Navigazione & Internazionalizzazione (i18n)

Questo documento definisce la strategia per la gestione multi-lingua e la struttura di navigazione del sito. L'obiettivo è supportare plenamente Italiano (IT) e Inglese (EN) mantenendo un carico di lavoro editoriale gestibile e una SEO ottimizzata.

## 2.1 Strategia di Traduzione: `wagtail-localize`

Abbandoniamo l'approccio classico di mantenere due alberi di pagine separati e scollegati manualemente. Adotteremo **`wagtail-localize`**.

### Sync vs Traduzione
*   **Alberi Sincronizzati:** La struttura del sito (Albero delle pagine) è definita nella lingua principale (IT create/delete/move). Queste modifiche si riflettono automaticamente sull'albero EN.
*   **Routing:** 
    *   `/it/artista/mario-rossi`
    *   `/en/artist/mario-rossi` (Slug tradotto automaticamente o manualmente, mantenendo il riferimento all'oggetto originale).

### Gestione dei Campi (Translatable vs Synchronized)
Ogni campo nei modelli (`ArtistPage`, `EventPage`) deve essere configurato esplicitamente:
*   **Campi Traducibili (Translatable):** `title`, `description`, `StreamFields` (body). Questi campi avranno valori diversi per lingua.
*   **Campi Sincronizzati (Synchronized):** `tour_dates`, `spotify_id`, `main_image`, `genres`.
    *   *Logica:* Se cambia la data di un concerto o l'ID Spotify, deve cambiare istantaneamente su tutte le versioni linguistiche senza intervento del traduttore.

#### Analisi Scelta: `wagtail-localize`
*   **PRO:** Riduce drasticamente l'errore umano (dimenticare di aggiornare una data sul sito inglese). Permette l'integrazione futura con servizi di traduzione automatica (es. DeepL API).
*   **CONTRO:** Richiede una configurazione iniziale più attenta sui modelli per definire cosa si sincronizza e cosa si traduce.

---

## 2.2 Menu e Navigazione

La navigazione del sito non deve essere vincolata rigidamente alla struttura ad albero del database (Page Tree). Spesso le esigenze di marketing (es. "Landing page temporanea nel menu principale") divergono dalla struttura logica.

### Implementazione: Menu Cluster
Utilizzeremo un modello custom `NavigationMenu` gestito tramite Snippet.

*   **Header Menu:** Un'istanza dello snippet contenente link a pagine interne o URL esterne.
*   **Footer Menu:** Istanze multiple (es. "Legal", "Social", "Agency").

### Tecnologia: `Orderable` + `MainMenuItem`
Creeremo un modello `MainMenuItem` che può puntare a:
1.  **Page Link:** `ForeignKey` a una pagina Wagtail (link interno robusto, resiste se la pagina viene spostata o rinominata).
2.  **External URL:** Campo URL  per link esterni.
3.  **Title Override:** Possibilità di rinominare la voce di menu rispetto al titolo pagina (es. Pagina "Contatti Ufficio Stampa" -> Menu "Contatti").

#### Vantaggi
Questo disaccoppia il menu dall'albero. Possiamo spostare `EventPage` sotto una nuova sezione senza rompere i link nel menu principale.

---

## 2.3 Localizzazione URL (Slug)

Le URL devono essere localizzate per la SEO.
*   IT: `/artisti/`
*   EN: `/artists/`

Wagtail gestisce nativamente gli slug localizzati se configurato correttamente in `i18n_patterns`.
**Regola Fondamentale:** Gli slug devono essere univoci per livello e lingua.

---

## 2.4 Gestione Date e Formati

Oltre al testo, la localizzazione deve coprire i formati dati.
*   **Date:** 
    *   IT: `dd/mm/yyyy` (es. 14/02/2026)
    *   EN: `yyyy-mm-dd` o `Month dd, yyyy` (es. February 14, 2026)
    *   Uso del filtro template `{{ date|date:"SHORT_DATE_FORMAT" }}` di Django che rispetta il locale attivo.
