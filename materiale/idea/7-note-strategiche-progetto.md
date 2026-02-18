# Note Strategiche e Integrazioni al Progetto

Analisi basata sul dataset artisti e contesto operativo (Nord Italia).

## 1. Architettura dell'Informazione (IA)
Struttura rivista per accogliere le macro-categorie emerse dal CSV:
- **Show & Party Bands:** Focus su impatto visivo (costumi, coreografie).
- **Tribute Bands:** Necessità di distinguere tra band tributo (es. Queen, Vasco) e originali.
- **DJ & Solisti:** Gestione scheda tecnica semplificata.

**Nuova Alberatura Suggerita:**
* **Home Page:** Vetrina video emozionale + Ricerca rapida (Cosa cerchi? -> Tributo, Party Band, ecc.).
* **Artisti (Catalog):**
    * Filtri dinamici: Genere, Tipologia (Tribute/Cover/Original), Target (Matrimonio/Piazza/Club).
* **Calendario Live:** Cruciale per presenza territoriale (Nord Italia).

## 2. Modifiche al Data Model (Wagtail)
### ArtistPage
* **Video Hero:** Promozione del video da semplice blocco a campo primario (`hero_video_id`). Se presente, l'header della pagina deve essere video-first (loop o preview).
* **Attributo Tribute:** Aggiunta campo `tribute_to` (Char o Snippet Relation) per migliorare la SEO (es. intercettare "Cover band Queen").
* **Geolocalizzazione:** Campo `base_location` (es. Provincia/Regione) per supportare filtri "Vicino a me" (essenziale per operatività locale).

### Snippets
* **Venue:** Aggiunta campo `region`/`province` per filtrare gli eventi nel Nord Italia.

## 3. UX & Design
* **Video-First:** Le band si vendono visivamente. L'interfaccia deve dare priorità ai video rispetto al testo nelle schede "Show Band".
* **Navigazione:** Implementare filtri faccettati (Genere + Location + Tipo Evento).

## 4. Business Logic (Booking)
* **Preventivi Contestuali:** Il form di contatto ("Richiesta Preventivo") deve raccogliere:
    * Tipologia evento (Matrimonio vs Piazza vs Club).
    * Data e Luogo (per calcolo trasferta e disponibilità).
* Il bottone preventivo deve passare questi contesti se cliccato dalla pagina artista.

## 5. Automazione
* **Importazione Dati:** Creare management command per importare il CSV fornito:
    * Auto-creazione Snippet Generi.
    * Parsing URL YouTube per estrarre ID.
    * Popolamento automatico Bio.

Queste note serviranno da guida per la compilazione dei documenti tecnici esecutivi e l'adattamento ai template.
