# 5. Frontend UX & Concept Inclusivo

Questo documento definisce i requisiti non funzionali relativi all'esperienza utente, all'accessibilità e all'ottimizzazione per i motori di ricerca (SEO Tecnico).

## 5.1 Accessibilità Nativa (No Overlay)
Non utilizzeremo "Overlay di Accessibilità" (plugin magici che "fixano" il sito). L'accessibilità deve essere costruita nel codice (Design for All).
* i18n: ogni feature testata in entrambe le lingue, URL corretti, switch senza loss of context
* a11y: Lighthouse 100% su entrambi i template, navigabile keyboard-only, screen reader friendly

**Obiettivo:** WCAG 2.1 Livello AA.

### Requisiti Tecnici
1.  **Semantic HTML:** Gli StreamBlock devono generare HTML semantico.
    *   Un blocco "Titolo" deve permettere all'editor di scegliere il livello (`h2`, `h3`, `h4`) ma mai `h1` (riservato al titolo pagina).
2.  **Color Contrast:** Verifica automatica del contrasto (minimo 4.5:1 per testo normale) nel CSS base.
3.  **Keyboard Navigation:** Tutto il sito, specialmente i menu a tendina e gli slider (caroselli artisti), deve essere navigabile via `Tab` e `Enter`.
4.  **Reduced Motion:** Supporto media query `@media (prefers-reduced-motion: reduce)`.
    *   Se attivo: disabilitare autoplay video e transizioni slider.

---

## 5.2 SEO Tecnico Automatizzato

Il CMS deve lavorare per la SEO senza che l'editor debba essere un esperto SEO.

### Dati Strutturati (JSON-LD)
Implementazione automatica di Schema.org nel template base.

*   **ArtistPage:** Genera automaticamente `MusicGroup` o `Person`.
    *   `name`: Titolo pagina.
    *   `genre`: Valori dal campo `genres`.
    *   `image`: Main image.
*   **EventPage:** Genera automaticamente `Event`.
    *   `startDate`: Dal campo data inizio.
    *   `location`: Dati estrapolati dallo Snippet `Venue` (Nome, Indirizzo).
    *   `offers`: Link al ticket provider.

### Meta Tags & OpenGraph
Utilizzare `wagtail-metadata-mixin` per gestire automaticamente i tag per Facebook/Twitter/LinkedIn.
*   **Fallback:** Se l'editor non carica un'immagine specifica per i social, il sistema usa automaticamente la `main_image` della pagina, ritagliata 1200x630px.

---

## 5.3 UX Mobile-First
Dato il target (fan musicali), prevediamo >70% traffico da mobile.

*   **Touch Targets:** Bottoni e link con area cliccabile minima 44x44px.
*   **Priorità Contenuto:** Su mobile, la call-to-action "Book Now" o "Buy Tickets" deve essere visibile "above the fold" (nella prima schermata) senza scroll eccessivo.
*   **Performance:** Code splitting CSS/JS per caricare solo il necessario per la pagina corrente (es. non caricare libreria Google Maps se non siamo nella pagina Contatti).
