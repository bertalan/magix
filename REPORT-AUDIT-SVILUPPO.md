# 🔍 REPORT AUDIT SVILUPPO — MagixPromotion

> **Data:** 18 febbraio 2026  
> **Scope:** Analisi file-per-file di tutto il codice sorgente vs specifica task  
> **Obiettivo:** Identificare bug, mancanze e disallineamenti per debug e correzione

---

## Indice

1. [Issue Critiche (bloccanti)](#1-issue-critiche-bloccanti)
2. [Issue Alte (da risolvere prima del deploy)](#2-issue-alte-da-risolvere-prima-del-deploy)
3. [Issue Medie (funzionalità incompleta)](#3-issue-medie-funzionalità-incompleta)
4. [Issue Basse (miglioramenti)](#4-issue-basse-miglioramenti)
5. [Stato per App/Modulo](#5-stato-per-appmodulo)
6. [Stato File per File](#6-stato-file-per-file)
7. [Checklist Correzioni](#7-checklist-correzioni)

---

## 1. Issue Critiche (bloccanti)

### 🔴 BUG-001 — Nomi campi BookingForm vs test disallineati

**File coinvolti:**
- `booking/forms.py` → definisce campi: `full_name`, `requested_artist`, `event_type`, `message`, `phone`, `company`, `event_date`, `event_location`, `estimated_budget`
- `tests/test_booking.py` → usa nomi diversi: `nome_cognome`, `artista_richiesto`, `tipo_evento`, `messaggio`, `telefono`, `azienda`, `data_evento`, `luogo_evento`, `budget_indicativo`

**Impatto:** Tutti i 12 test della classe `TestBookingForm` falliscono. Il form riceve campi sconosciuti e li ignora, quindi `form.is_valid()` fallisce anche per dati "validi".

**Fix:** Allineare i nomi nel test a quelli del form (`full_name`, `requested_artist`, `event_type`, `message`, ecc.) oppure rinominare i campi nel form ai nomi italiani. La scelta dipende dalla convenzione (l'indice master dice "variabili in inglese").

---

### 🔴 BUG-002 — Dipendenze Python mancanti nei requirements

**File:** `requirements/base.txt`

| Pacchetto mancante | Usato in | Errore atteso |
|---------------------|----------|---------------|
| `requests` | `core/gemini_translator.py` (riga 3: `import requests`) | `ModuleNotFoundError: No module named 'requests'` |
| `django-cors-headers` | `config/settings/dev.py`, `docker_dev.py` (CORS_ALLOWED_ORIGINS) | CORS bloccato in dev — il frontend non può chiamare l'API |

**File:** `requirements/test.txt`

| Pacchetto mancante | Usato in | Errore atteso |
|---------------------|----------|---------------|
| `freezegun` | `tests/test_tasks.py` (riga 4: `from freezegun import freeze_time`) | `ModuleNotFoundError: No module named 'freezegun'` (5 test saltano) |
| `wagtail-factories` | `tests/factories.py` (riga 3: `import wagtail_factories`) | `ModuleNotFoundError: No module named 'wagtail_factories'` (tutte le fixture falliscono) |

**Fix:** Aggiungere le dipendenze mancanti ai rispettivi file requirements.

---

## 2. Issue Alte (da risolvere prima del deploy)

### 🟠 SEC-001 — API Key Gemini esposta lato client

**File:** `frontend/src/services/geminiService.ts`

La funzione `scoutTalent()` chiama direttamente l'API Gemini dal browser usando `import.meta.env.VITE_GEMINI_API_KEY`. Chiunque può estrarre la chiave dagli strumenti sviluppatore del browser.

**Fix consigliato:** Creare un endpoint proxy backend (`/api/v2/band-finder/`) che riceve la query, chiama Gemini server-side e restituisce il risultato. Rimuovere `VITE_GEMINI_API_KEY` dal frontend.

---

### 🟠 CI-001 — Test frontend non eseguiti in CI

**File:** `.github/workflows/ci.yml` (righe 83-95)

Il job `frontend-test` esegue solo `npm run build`, non `npm run test`. I 12 test Vitest frontend non vengono mai eseguiti in pipeline.

**Fix:** Aggiungere `- run: npm run test` prima o dopo il build nel job `frontend-test`.

---

### 🟠 CI-002 — CI installa `requirements/production.txt` ma non `dev.txt`

**File:** `.github/workflows/ci.yml` (riga 45)

```yaml
pip install -r requirements/production.txt
pip install -r requirements/test.txt
```

Questo potenzialmente manca pacchetti da `dev.txt` come `django-debug-toolbar`. Inoltre `test.txt` non include `freezegun` e `wagtail-factories` (vedi BUG-002).

---

### 🟠 CORS-001 — django-cors-headers mancante ma configurato

**File:** `config/settings/dev.py`, `config/settings/docker_dev.py`

Entrambi definiscono `CORS_ALLOWED_ORIGINS` ma `django-cors-headers` non è nei requirements e `corsheaders` non è in `INSTALLED_APPS` né in `MIDDLEWARE`.

**Impatto:** Le richieste cross-origin dal frontend Vite (porta 3000/5173) verso Django (porta 8000) saranno bloccate dal browser. Il proxy Vite mitiga questo in dev, ma non copre tutti i casi (es. WebSocket, richieste dirette).

**Fix:** Aggiungere `django-cors-headers` a `requirements/base.txt`, `corsheaders` a `INSTALLED_APPS` e `corsheaders.middleware.CorsMiddleware` a `MIDDLEWARE` (prima di `CommonMiddleware`).

---

## 3. Issue Medie (funzionalità incompleta)

### ✅ FUNC-001 — Directory `locale/` popolata

~~Nessun file `.po` / `.mo` generato.~~ **RISOLTO:** Tutte le stringhe UI (211 msgid) wrappate con `gettext_lazy()` in 8 file (models, forms, views, blocks). Generati `django.po` e `django.mo` per `it` e `en`. Traduzioni inglesi complete.

---

### 🟡 FUNC-002 — Email routing artista non implementato

**File:** `booking/email_routing.py`

`ARTIST_MANAGER_MAP` è un dizionario vuoto `{}`. Tutte le email di booking vanno sempre all'indirizzo default `booking@magixpromotion.it`, ignorando il manager specifico dell'artista.

**Fix consigliato:** Popolare la mappa dal database, leggendo il campo `managing_group` degli artisti o creando un modello `ArtistManager` con email per artista.

---

### 🟡 FUNC-003 — docker_dev.py troppo minimale

**File:** `config/settings/docker_dev.py`

Contiene solo `from .base import *`, `DEBUG`, `ALLOWED_HOSTS`, `SECRET_KEY`, `EMAIL_BACKEND`, `CORS_ALLOWED_ORIGINS`. Il `base.py` gestisce DB/Redis via `os.environ` — funziona ma solo se tutte le variabili sono passate correttamente dal `docker-compose.yml`.

**Rischio:** Nessun fallback o validazione delle variabili d'ambiente Docker.

---

### 🟡 FUNC-004 — Event API non espone venue/artista nei campi detail

**File:** `events/api.py`

L'`EventAPIViewSet` definisce `body_fields` e `listing_default_fields` ma non include serializer custom per venue (nome, città, coordinate) e artista (nome, slug, immagine). Il frontend deve fare chiamate aggiuntive per ottenere questi dati.

**Fix:** Aggiungere field serializer custom (come fatto per `ArtistAPIViewSet`) per `venue` e `related_artist`.

---

### 🟡 FUNC-005 — Management command artisti — mancanza verifica allineamento con CSV

**File:** `artists/management/commands/import_artists_csv.py`

Il comando esiste e i test lo coprono, ma non è stato verificato l'allineamento con il CSV reale (`dati-band-Magixpromotion.csv`) — le colonne del CSV potrebbero avere nomi diversi da quelli attesi dal comando.

---

## 4. Issue Basse (miglioramenti)

### 🔵 STYLE-001 — URL hardcoded in seo.py

**File:** `core/seo.py`

L'URL `https://www.magixpromotion.it` è hardcoded. Dovrebbe provenire da `WAGTAILADMIN_BASE_URL` o `Site.root_url`.

---

### 🔵 STYLE-002 — f-string nei logger

**File:** `core/geocoding.py`, `booking/tasks.py`

Usano `logger.error(f"...")` e `logger.info(f"...")`. Best practice: `logger.error("Errore: %s", e)` per lazy evaluation.

---

### 🔵 STYLE-003 — except Exception generico in seo.py

**File:** `core/seo.py`

`except Exception: settings = None` — dovrebbe catturare `Site.DoesNotExist` specificamente.

---

### 🔵 PERF-001 — N+1 query possibile in search_api

**File:** `core/search.py`

Per ogni risultato artista, fa `page.genres.all()` e potenzialmente `page.main_image.get_rendition()`. Manca `prefetch_related("genres")`.

---

## 5. Stato per App/Modulo

### Backend

| App | Models | API | SEO | Translation | Tests | Stato |
|-----|:------:|:---:|:---:|:-----------:|:-----:|:-----:|
| `core` | ✅ HomePage, MagixSiteSettings, EPKPackage | ✅ site-settings, EPK download | ✅ JSON-LD | ✅ (vuoto intenzionale) | ✅ (in test_api, test_models) | **Completo** |
| `artists` | ✅ Genre, TargetEvent, ArtistListingPage, ArtistPage | ✅ Custom ViewSet con filtri | ✅ MusicGroup JSON-LD | ✅ | ✅ 5 test | **Completo** |
| `events` | ✅ Venue, Promoter, EventListingPage, EventPage | ⚠️ Manca serializer venue/artist | ✅ MusicEvent JSON-LD | ✅ | ✅ 10 test | **Quasi completo** |
| `booking` | ✅ BookingFormField, BookingFormPage | ✅ booking_submit_api | — | — | 🔴 12 test ROTTI | **Bug critico** |
| `navigation` | ✅ NavigationMenu, MenuItem | ✅ menu_api | — | — | ✅ 3 test | **Completo** |

### Moduli trasversali

| Modulo | File | Stato |
|--------|------|:-----:|
| StreamField blocks | `core/blocks.py` (7 block types) | ✅ Completo |
| Cache/Performance | `core/cache.py`, `core/middleware.py` | ✅ Completo |
| Geocoding | `core/geocoding.py` | ✅ Completo (Nominatim) |
| Gemini Translator | `core/gemini_translator.py` | ✅ Completo |
| Celery Tasks | `booking/tasks.py` | ✅ Completo (2 task) |
| Wagtail Hooks (T27) | `core/wagtail_hooks.py` | ✅ Completo (5 hook) |
| CSV Import | `artists/management/commands/import_artists_csv.py` | ✅ Completo |
| Search | `core/search.py` | ✅ Completo (search + autocomplete) |

### Frontend

| Componente | File | Righe | Stato |
|------------|------|:-----:|:-----:|
| Layout + Header + Footer | `Layout.tsx`, `Header.tsx`, `Footer.tsx` | — | ✅ |
| Hero + HomePage | `Hero.tsx`, `HomePage.tsx` | — | ✅ |
| ArtistCard + Grid + Detail | `ArtistCard.tsx`, `ArtistGrid.tsx`, `ArtistDetail.tsx`, `ArtistFilters.tsx`, `FeaturedArtists.tsx` | — | ✅ |
| EventCard + EventsPage | `EventCard.tsx`, `EventsPage.tsx`, `EventFilters.tsx` | — | ✅ |
| BookingForm + Page | `BookingForm.tsx`, `BookingPage.tsx` | — | ✅ |
| BandFinder (Gemini) | `BandFinder.tsx` | — | ⚠️ API key esposta |
| SearchBar | `SearchBar.tsx` | — | ✅ |
| A11y | `SkipLink.tsx`, `useFocusTrap.ts`, `useReducedMotion.ts` | — | ✅ |
| SEO | `SEOHead.tsx` | — | ✅ |
| Immagini | `OptimizedImage.tsx` | — | ✅ |
| ThemeToggle | `ThemeToggle.tsx` | — | ✅ |
| MobileMenu | `MobileMenu.tsx` | — | ✅ |
| AddressLink (OSM) | `AddressLink.tsx` | — | ✅ |

**Totali:** 23 componenti (2.441 righe), 7 hook (408 righe), 12 file test, 1 service

### Infrastruttura

| Elemento | File | Stato |
|----------|------|:-----:|
| Dockerfile (multi-stage) | `deploy/Dockerfile` | ✅ |
| docker-compose dev | `deploy/docker-compose.yml` | ✅ |
| docker-compose prod | `deploy/docker-compose.prod.yml` | ✅ |
| Nginx config | `deploy/nginx/`, `deploy/live/magix-nginx.conf` | ✅ |
| Gunicorn systemd | `deploy/live/gunicorn.service`, `gunicorn.socket` | ✅ |
| Deploy script live | `deploy/live/deploy-live.sh` | ✅ |
| CI workflow | `.github/workflows/ci.yml` | ⚠️ Test FE mancanti |
| Deploy workflow | `.github/workflows/deploy.yml` | ✅ |
| Migrations | 5 app × initial + groups/workflow | ✅ |
| Templates (block) | 7 template HTML per blocks | ✅ |
| File .po / .mo | `locale/` | 🔴 Vuota |

---

## 6. Stato File per File

### Backend — 35 file Python

| File | Righe | Stato | Note |
|------|:-----:|:-----:|------|
| `config/settings/base.py` | 166 | ✅ | — |
| `config/settings/dev.py` | 46 | ⚠️ | CORS senza django-cors-headers |
| `config/settings/production.py` | 146 | ✅ | — |
| `config/settings/test.py` | 47 | ✅ | — |
| `config/settings/docker_dev.py` | 14 | ⚠️ | Minimale, no validazione env vars |
| `config/urls.py` | 57 | ✅ | — |
| `config/celery.py` | 9 | ✅ | — |
| `core/models.py` | 233 | ✅ | — |
| `core/blocks.py` | 192 | ✅ | 7 block types |
| `core/api.py` | 43 | ✅ | site_settings_view |
| `core/api_urls.py` | 7 | ✅ | — |
| `core/epk_urls.py` | 9 | ✅ | — |
| `core/views.py` | 35 | ✅ | EPK download con permessi |
| `core/seo.py` | 87 | 🔵 | URL hardcoded |
| `core/cache.py` | 49 | ✅ | — |
| `core/search.py` | 124 | 🔵 | N+1 possibile |
| `core/geocoding.py` | 46 | ✅ | Rate limit Nominatim OK |
| `core/gemini_translator.py` | 119 | ✅ | — |
| `core/middleware.py` | 32 | ✅ | Cache-Control API |
| `core/wagtail_hooks.py` | 104 | ✅ | 5 hook per-band |
| `core/translation.py` | 5 | ✅ | Vuoto intenzionale |
| `artists/models.py` | 397 | ✅ | — |
| `artists/api.py` | 157 | ✅ | 5 custom fields |
| `artists/seo.py` | 75 | ✅ | MusicGroup |
| `artists/translation.py` | 26 | ✅ | — |
| `events/models.py` | 420 | ✅ | — |
| `events/api.py` | 67 | ⚠️ | Manca serializer venue/artist |
| `events/seo.py` | 82 | ✅ | MusicEvent |
| `events/translation.py` | 24 | ✅ | — |
| `booking/models.py` | 104 | ✅ | — |
| `booking/forms.py` | 76 | ✅ | Campi in inglese |
| `booking/views.py` | 57 | ✅ | — |
| `booking/tasks.py` | 82 | ✅ | 2 task |
| `booking/email_routing.py` | 14 | ⚠️ | Mappa vuota |
| `navigation/models.py` | 127 | ✅ | — |
| `navigation/api.py` | 33 | ✅ | — |

### Test — 6 file

| File | Righe | Stato | Note |
|------|:-----:|:-----:|------|
| `conftest.py` | 63 | ✅ | 6 fixture |
| `tests/factories.py` | 91 | ✅ | 9 factory (richiede wagtail-factories) |
| `tests/test_models.py` | 173 | ✅ | 28 test |
| `tests/test_api.py` | 121 | ✅ | 12 test |
| `tests/test_booking.py` | 113 | 🔴 | **12 test ROTTI** — nomi campi errati |
| `tests/test_csv_import.py` | 100 | ✅ | 8 test |
| `tests/test_tasks.py` | 96 | ⚠️ | 5 test OK ma manca freezegun |

### Frontend — 23 componenti + 7 hook + 12 test

| File | Stato | Note |
|------|:-----:|------|
| `src/types.ts` | ✅ | 139 righe, 12 interfacce |
| `src/App.tsx` | ✅ | 97 righe |
| `src/main.tsx` | ✅ | 14 righe |
| `src/lib/api.ts` | ✅ | 137 righe, CSRF helper |
| `src/services/geminiService.ts` | 🟠 | API key esposta lato client |
| Tutti i 23 componenti in `src/components/` | ✅ | 2.441 righe totali |
| Tutti i 7 hook in `src/hooks/` | ✅ | 408 righe totali |
| 12 file test in `src/__tests__/` | ✅ | Struttura MSW completa |

### Infrastruttura — 12 file

| File | Stato | Note |
|------|:-----:|------|
| `deploy/Dockerfile` | ✅ | Multi-stage, non-root |
| `deploy/docker-compose.yml` | ✅ | 5 servizi |
| `deploy/docker-compose.prod.yml` | ✅ | Con certbot |
| `deploy/nginx/nginx.conf` | ✅ | — |
| `deploy/nginx/conf.d/magix.conf` | ✅ | — |
| `deploy/live/magix-nginx.conf` | ✅ | — |
| `deploy/live/gunicorn.service` | ✅ | — |
| `deploy/live/gunicorn.socket` | ✅ | — |
| `deploy/live/deploy-live.sh` | ✅ | — |
| `deploy/scripts/entrypoint.sh` | ✅ | — |
| `deploy/scripts/wait-for-it.sh` | ✅ | — |
| `.github/workflows/ci.yml` | ⚠️ | Test FE non eseguiti |
| `.github/workflows/deploy.yml` | ✅ | — |

---

## 7. Checklist Correzioni

### Priorità 1 — Bloccanti (da fare subito)

- [x] **BUG-001:** ~~Allineare nomi campi in `tests/test_booking.py` a quelli di `booking/forms.py`~~ ✅ CORRETTO
- [x] **BUG-002a:** ~~Aggiungere `requests`, `django-cors-headers` a `requirements/base.txt`~~ ✅ CORRETTO
- [x] **BUG-002b:** ~~Aggiungere `freezegun`, `wagtail-factories` a `requirements/test.txt`~~ ✅ CORRETTO
- [x] **BUG-002c:** ~~Aggiungere `freezegun`, `wagtail-factories` a `requirements/dev.txt`~~ ✅ CORRETTO

### Priorità 2 — Alte (prima del deploy)

- [x] **CORS-001:** ~~Aggiungere `corsheaders` a `INSTALLED_APPS` e `CorsMiddleware` a `MIDDLEWARE`~~ ✅ CORRETTO
- [x] **SEC-001:** ~~Creare endpoint proxy backend per Gemini (`/api/v2/band-finder/`)~~ ✅ CORRETTO — creato `core/band_finder.py`, aggiornato `config/urls.py`, riscritto `frontend/src/services/geminiService.ts`
- [x] **CI-001:** ~~Aggiungere `npm run test` nel job `frontend-test`~~ ✅ CORRETTO

### Priorità 3 — Medie (funzionalità)

- [x] **FUNC-001:** ~~Generare file `.po`~~ ✅ CORRETTO — 211 stringhe wrappate con `gettext_lazy()`, `.po`/`.mo` generati per it/en
- [x] **FUNC-002:** ~~Implementare routing email per artista in `booking/email_routing.py`~~ ✅ CORRETTO — lookup dinamico da DB con cache 5 min
- [x] **FUNC-004:** ~~Aggiungere serializer custom per `venue` e `related_artist` in `events/api.py`~~ ✅ CORRETTO — VenueField, ArtistField, FeaturedImageField
- [x] **FUNC-005:** ~~Verificare allineamento colonne CSV~~ ✅ NON NECESSARIO — confermato dal committente

### Priorità 4 — Basse (quality)

- [x] **STYLE-001:** ~~Sostituire URL hardcoded in `core/seo.py` con `Site.root_url`~~ ✅ CORRETTO
- [x] **STYLE-002:** ~~Usare lazy formatting nei logger~~ ✅ CORRETTO (`geocoding.py`, `tasks.py`)
- [x] **STYLE-003:** ~~Catturare `Site.DoesNotExist` invece di `Exception` generico~~ ✅ CORRETTO
- [x] **PERF-001:** ~~Aggiungere `prefetch_related("genres")` in `core/search.py`~~ ✅ CORRETTO

---

## Statistiche Progetto

| Metrica | Valore |
|---------|--------|
| File Python backend | 35 |
| File TypeScript/TSX frontend | 43 (23 componenti + 7 hook + 12 test + 1 service) |
| Righe Python (stima) | ~3.200 |
| Righe TS/TSX (stima) | ~3.300 |
| Test backend | 65 (di cui 12 rotti) |
| Test frontend | 12 file |
| Modelli Django | 10 (3 Page, 5 Snippet, 2 Form) |
| Endpoint API | 7 (artists, events, pages, images, documents, menu, search + autocomplete + site-settings + booking) |
| StreamField blocks | 7 |
| Migrations | 7 (5 app × initial + 1 groups + 1 workflow) |
| Componenti React | 23 |
| Hook React | 7 |
| Issue totali trovate | 14 (2 critiche, 4 alte, 5 medie, 4 basse) |
