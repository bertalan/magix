# 4. Dev Guidelines (Istruzioni per i Programmatori)

Questo documento stabilisce gli standard tecnici per il team di sviluppo. L'aderenza è obbligatoria per garantire manutenibilità e scalabilità del codice Python/Django e Wagtail.

## 4.1 Standard di Codice & Tooling

### Stack Python
*   **Formatter:** `Black` (lunghezza riga 88 caratteri). Eseguire pre-commit hook o su save.
*   **Linter:** `Flake8` per individuare errori di sintassi e stile (es. import non usati).
*   **Type Hinting:** Uso estensivo di Type Hints (Python 3.10+). Controllo statico con `Mypy` in modalità strict opzionale.
*   **Testing:** `Pytest` preferito a `unittest`. Copertura minima richiesta: 80% su business logic custom (non testare codice nativo Wagtail).

### Stack Django/Wagtail
*   **Logica:** "Fat Models, Thin Views". La logica di business (es. calcolo stato evento) risiede nel Modello, non nella View o nel Template.
*   **Views:** Dove non si usano le View native di Wagtail, usare esclusivamente **Class-Based Views (CBV)**. Evitare Function-Based Views se non per utility banali.

---

## 4.2 Ottimizzazione Immagini & Performance

Wagtail offre potenti strumenti per le immagini, ma vanno usati con giudizio per evitare pagine pesanti (LCP penalty).

### Regola del Tag `{% image %}`
Mai inserire immagini raw. Usare sempre il tag image con filtri di ridimensionamento e conversione formato.

```django
{# Esempio Obbligatorio #}
{% image page.photo fill-800x600 format-webp as photo_webp %}
<img src="{{ photo_webp.url }}" 
     width="{{ photo_webp.width }}" 
     height="{{ photo_webp.height }}" 
     alt="{{ page.photo.title }}"
     loading="lazy">
```

*   **Renditions:** Definire le rendition più usate in `WAGTAIL_IMAGES_CHOOSER_REDITIONS` per pre-generarle al caricamento (background task).

### Caching
*   **Template Fragment Caching:** Per elementi pesanti come il Footer o menu complessi che non cambiano spesso per utente.
    `{% load cache %}` -> `{% cache 600 sidebar %} ... {% endcache %}`
*   **QuerySets:** Usare `select_related` e `prefetch_related` nelle view custom (`get_context`) per evitare il problema N+1 query, tipico quando si iterano liste di artisti con i loro generi (Many-to-Many).

---

## 4.3 Search Backend

Configurazione del motore di ricerca interno.

*   **Development:** `wagtail.search.backends.db` (Database search semplice).
*   **Production:** 
    *   Se traffico < 10k visite/mese: **PostgreSQL Search** (modulo `wagtail.contrib.postgres_search`). È robusto, supporta stemming e ranking base, zero infrastructure overhead.
    *   Se traffico > 10k: **Elasticsearch 7/8**.

### Indicizzazione
Ogni Page Model deve definire esplicitamente `search_fields`.
*   Indicizzare: Titolo, Bio, Generi (come testo).
*   Filtrare: Generi (come ID), Data Evento.
*   Escludere: Campi tecnici, JSON raw, ID esterni.

---

## 4.4 Sicurezza & Deployment
*   **Variabili d'Ambiente:** Mai committare secret key, password DB o API Keys. Usare `python-dotenv` o variabili d'ambiente di sistema.
*   **Wagtail Admin:** URL `/admin/` mascherata o protetta da VPN/IP whitelist se possibile.
*   **User Permissions:** Non usare l'utente Superuser per l'editing quotidiano. Creare ruoli "Editor" e "Moderator" con permessi minimi necessari (Least Privilege).
