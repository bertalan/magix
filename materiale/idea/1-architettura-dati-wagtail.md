# 1. Architettura Dati Wagtail (Backend & Data Model)

Questo documento traccia le linee guida definitive per l'implementazione dei modelli di dati (Data Models) del sito. L'obiettivo è sfruttare l'architettura gerarchica nativa di Wagtail per garantire integrità referenziale, facilità di gestione editoriale e scalabilità futura, evitando le "trappole" comuni di un setup Django standard non ottimizzato per CMS.

## 1.1 Gerarchia delle Pagine (Page Tree Structure)

La struttura del database deve riflettere rigorosamente la sitemap logica. In Wagtail, ogni pagina è un nodo di un albero.

### Definizione dei Modelli
*   **HomePage (Root):** Punto di ingresso unico. Non contiene contenuti editoriali complessi ma funge da aggregatore.
*   **ArtistListingPage (Index):** Contenitore logico per gli artisti. Non deve avere contenuto proprio significativo (se non titolo e intro SEO).
*   **ArtistPage (Detail):** Scheda di dettaglio dell'artista. È il fulcro del sito.
*   **EventListingPage (Index):** Contenitore logico per il calendario (Tour dates).
*   **EventPage (Detail):** Singola data o evento.

### Regole di Contenimento (`subpage_types` e `parent_page_types`)
Imporremo regole rigide su dove ogni tipo di pagina può essere creato.
*   *Esempio:* Una `EventPage` può essere creata **solo** sotto `EventListingPage`.
*   *Esempio:* Una `ArtistPage` non può avere pagine figlie (è una "foglia" dell'albero).

#### Analisi Scelta: Gerarchia Rigida
*   **PRO:**
    *   **Sicurezza Editoriale:** Impedisce agli editor di "rompere" l'architettura (es. creare un evento dentro la bio di un artista).
    *   **Routing Automatico:** Le URL sono generate automaticamente dalla posizione nell'albero (`/artisti/nome-artista`), eliminando la necessità di gestire `urls.py` complessi manuali.
    *   **Query Ottimizzate:** Permette query veloci sull'albero (es. `ArtistListingPage.get_children().live()`).
*   **CONTRO:**
    *   **Minore Flessibilità:** Se in futuro un artista necessita di una "sotto-sezione" dedicata (es. un microsito per un album), sarà necessario l'intervento degli sviluppatori per modificare le regole di contenimento.

---

## 1.2 Gestione Tassonomie: Snippets vs Tags

Per gestire entità trasversali come **Generi Musicali**, **Venue (Locali/Teatri)** e **Promoter**, utilizzeremo il sistema degli **Snippets** di Wagtail, collegati tramite relazioni *Many-to-Many* (o *One-to-Many*).

### Entità Definite
*   **Genre (Snippet):** Nome univoco e Slug. Collegato agli artisti tramite `ParentalManyToManyField`.
*   **Venue (Snippet):** Nome, Città, Capienza, Indirizzo. Collegato agli eventi tramite `ForeignKey`.
*   **Promoter (Snippet):** Dati anagrafici riservati. Collegato agli eventi.

#### Analisi Scelta: Snippets vs Wagtail Tags (Taggit)
La scelta è ricaduta sugli **Snippets** (modelli Django standard registrati in Wagtail) invece dei semplici **Tags** testuali.

*   **PRO (Snippets):**
    *   **Dati Strutturati:** Un "Venue" non è solo una stringa di testo; ha una città, una capienza e una mappa. Gli Snippet permettono campi extra.
    *   **Integrità dei Dati:** Se il nome di un locale cambia, aggiornando lo Snippet si aggiorna ovunque. Con i tag testuali, si rischiano duplicati ("Teatro Scala" vs "La Scala").
    *   **Interfaccia Admin:** Gli editor hanno un pannello dedicato "Venues" separato dall'albero delle pagine.
*   **CONTRO:**
    *   **Setup Iniziale:** Richiede la definizione di modelli Django completi e pannelli di amministrazione, diversamente dai tag che sono "out-of-the-box".

---

## 1.3 Modellazione Contenuto: StreamFields vs RichText

Per il corpo delle pagine (`ArtistPage`), abbandoniamo il classico "campo di testo unico" (WYSIWYG) in favore degli **StreamFields**.

### Blocchi Custom (StructBlocks)
Invece di HTML libero, l'editor comporrà la pagina impilando blocchi predefiniti:
1.  **ArtistBioBlock:** Testo formattato + una citazione/frase di lancio opzionale.
2.  **DiscographyBlock:** Lista ripetibile di Album (Titolo, Anno, Cover, Link Spotify).
3.  **VideoEmbedBlock:** URL YouTube/Vimeo + Didascalia.
4.  **GalleryBlock:** Carosello di immagini.

#### Analisi Scelta: StreamFields (Blocchi)
*   **PRO:**
    *   **Design System Enforcement:** L'editor non può "rompere" il layout grafico. Non può cambiare font, colori o margini arbitrariamente. Il frontend ha controllo totale sul rendering HTML.
    *   **Dati Semantici:** Un album nella discografia non è "un'immagine seguita da testo", ma un oggetto dati strutturato. Questo è cruciale per generare JSON-LD per la SEO (Schema.org/MusicAlbum).
    *   **Portabilità:** Se domani si passa a un frontend React/Next.js, i dati dello StreamField vengono esposti via API come JSON strutturato, non come blob di HTML sporco.
*   **CONTRO:**
    *   **Database Pesante:** Gli StreamField salvano i dati come JSON nel database. Su pagine estremamente lunghe e complesse, le query possono diventare più pesanti rispetto a un semplice campo testo.
    *   **Rigidità Percepita:** Gli editor abituati a Word/WordPress potrebbero lamentare la mancanza di libertà totale di formattazione (es. "Voglio mettere questa parola in rosso").

---

## 1.4 Gestione Media e Permessi (Area EPK)

L'area **EPK (Electronic Press Kit)** richiede il download di file ad alta risoluzione (foto TIFF, loghi vettoriali, rider tecnici PDF) che non devono essere indicizzati da Google o accessibili al pubblico generalista.

### Strategia: Wagtail Collections + Groups
Non useremo una password unica per pagina, ma i permessi nativi sulle Collezioni di media.

1.  Creazione di una **Root Collection "Press/EPK"**.
2.  Creazione di un **Gruppo Utente "Press"** nel CMS.
3.  Configurazione permessi: Gli asset caricati nella collezione "Press/EPK" sono visibili solo agli utenti nel gruppo "Press" e agli Admin.

#### Analisi Scelta: Native Permissions vs Password Protection
*   **PRO:**
    *   **Granularità:** Possiamo revocare l'accesso a un singolo giornalista disattivando il suo utente, senza dover cambiare una password condivisa per tutti.
    *   **Sicurezza dei File Diretti:** Wagtail protegge non solo la pagina che contiene il link, ma l'URL stesso del file media statico (servendolo tramite una view Django protetta invece che direttamente dal web server pubblico, se configurato con `WAGTAIL_SERVE_ACTION`).
*   **CONTRO:**
    *   **Performance:** Servire file media statici pesanti tramite Python/Django è molto più lento rispetto a Nginx/S3 diretto.
    *   **Soluzione:** Per file molto grandi (>50MB), useremo un URL firmato (Signed URL) verso S3 generato al volo, mantenendo la logica di protezione nel backend ma scaricando il trasferimento dati sullo storage cloud.

---

## 1.5 Campi Immagine e Rendition

Ogni modello che include immagini (`ArtistPage`, `EventPage`) deve usare il campo `ForeignKey` verso `wagtailimages.Image`.

### Policy di Rendition
Non permetteremo il caricamento arbitrario di dimensioni nel template.
*   Ogni immagine caricata dall'editor (che può essere 4000px) verrà ridimensionata automaticamente alla richiesta.
*   Definiremo filtri specifici nel codice:
    *   `fill-800x600`: Per le card nelle liste (ritaglio intelligente centrato sul punto di interesse).
    *   `width-1920`: Per gli header full-width (ridimensionamento proporzionale).
    *   `format-webp`: Conversione automatica per performance web.

Questa strategia centralizza la gestione delle performance visive, togliendo la responsabilità all'editor.
