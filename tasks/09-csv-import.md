# TASK 09 — Management Command Import CSV

> **Agente:** Backend  
> **Fase:** 2 — Business Logic  
> **Dipendenze:** Task 02, Task 03  
> **Stima:** 30 min  

---

## OBIETTIVO

Creare un management command Django per importare i dati dal CSV `dati-band-Magixpromotion.csv` nel database Wagtail. Il comando deve:
1. Creare automaticamente gli Snippet Genre mancanti
2. Creare le ArtistPage sotto ArtistListingPage
3. Estrarre e normalizzare gli URL YouTube
4. Popolare bio e campi principali

---

## FILES_IN_SCOPE (da leggere)

- `dati-band-Magixpromotion.csv` — dati sorgente
- `idea/7-note-strategiche-progetto.md` — sezione 5 (Automazione import)
- Task 02 — struttura Genre snippet
- Task 03 — struttura ArtistPage

---

## STRUTTURA CSV

```csv
Band Name,Musical genre,Bio,Video Promo Youtube,Tour,Richiesta Preventivo
RED MOON,Dance Show Band,"...",https://www.youtube.com/watch?v=EpIhJzo7apY,,
```

**Note sui dati:**
- 24 band totali
- Generi: Dance Show Band, Beat Show Party Band, Glam Rock Night, Rock Band, Folk Band, Tributo Italiano, Tributo Internazionale, Dee-Jay
- Alcuni URL YouTube hanno typo (es: `ttps://` senza `h`)
- Campi Tour e Richiesta Preventivo sono vuoti nel CSV
- Alcune bio sono in italiano, altre in inglese

---

## OUTPUT_ATTESO

```
artists/
├── management/
│   └── commands/
│       └── import_artists_csv.py
```

---

## SPECIFICHE COMMAND

```python
"""Management command per importare artisti da CSV."""
import csv
import re
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.utils.text import slugify

from wagtail.models import Page


class Command(BaseCommand):
    help = "Importa artisti dal CSV MagixPromotion in Wagtail."

    def add_arguments(self, parser):
        parser.add_argument(
            "csv_path",
            type=str,
            help="Percorso al file CSV (es: dati-band-Magixpromotion.csv)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simula l'importazione senza scrivere nel DB.",
        )
        parser.add_argument(
            "--update-existing",
            action="store_true",
            help="Aggiorna artisti esistenti (match per slug).",
        )

    def handle(self, *args, **options):
        csv_path = Path(options["csv_path"])
        dry_run = options["dry_run"]
        update_existing = options["update_existing"]

        if not csv_path.exists():
            raise CommandError(f"File non trovato: {csv_path}")

        # Trova ArtistListingPage (deve esistere)
        from artists.models import ArtistListingPage, ArtistPage, Genre

        try:
            listing_page = ArtistListingPage.objects.live().first()
        except ArtistListingPage.DoesNotExist:
            raise CommandError(
                "ArtistListingPage non trovata. Creala prima nell'admin Wagtail."
            )

        if listing_page is None:
            raise CommandError("Nessuna ArtistListingPage live trovata.")

        stats = {"created": 0, "updated": 0, "skipped": 0, "genres_created": 0}

        with open(csv_path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)

            for row in reader:
                band_name = row.get("Band Name", "").strip()
                if not band_name:
                    continue

                genre_name = row.get("Musical genre", "").strip()
                bio = row.get("Bio", "").strip()
                youtube_url = self._fix_youtube_url(
                    row.get("Video Promo Youtube", "").strip()
                )

                # 1. Crea o trova Genre
                genre = self._get_or_create_genre(genre_name, stats, dry_run)

                # 2. Determina tipo artista dal genere
                artist_type = self._infer_artist_type(genre_name)

                # 3. Estrai eventuale "tribute_to"
                tribute_to = self._extract_tribute_to(band_name, bio, genre_name)

                # 4. Genera slug
                slug = slugify(band_name)

                # 5. Controlla se esiste già
                existing = ArtistPage.objects.filter(slug=slug).first()

                if existing and not update_existing:
                    self.stdout.write(
                        self.style.WARNING(f"  SKIP: {band_name} (esiste già)")
                    )
                    stats["skipped"] += 1
                    continue

                if dry_run:
                    self.stdout.write(
                        self.style.SUCCESS(f"  DRY-RUN: {band_name} [{genre_name}]")
                    )
                    stats["created"] += 1
                    continue

                if existing and update_existing:
                    # Aggiorna campi
                    existing.short_bio = bio[:500]
                    existing.hero_video_url = youtube_url
                    existing.artist_type = artist_type
                    existing.tribute_to = tribute_to
                    if genre:
                        existing.genres.add(genre)
                    existing.save_revision().publish()
                    stats["updated"] += 1
                    self.stdout.write(
                        self.style.SUCCESS(f"  UPDATED: {band_name}")
                    )
                else:
                    # Crea nuova ArtistPage
                    artist_page = ArtistPage(
                        title=band_name,
                        slug=slug,
                        short_bio=bio[:500],
                        hero_video_url=youtube_url,
                        artist_type=artist_type,
                        tribute_to=tribute_to,
                        base_region="lombardia",  # Default Nord Italia
                    )

                    listing_page.add_child(instance=artist_page)
                    
                    if genre:
                        artist_page.genres.add(genre)
                    
                    artist_page.save_revision().publish()
                    stats["created"] += 1
                    self.stdout.write(
                        self.style.SUCCESS(f"  CREATED: {band_name} [{genre_name}]")
                    )

        # Report finale
        self.stdout.write("\n" + "=" * 50)
        self.stdout.write(
            self.style.SUCCESS(
                f"Importazione completata:\n"
                f"  Creati: {stats['created']}\n"
                f"  Aggiornati: {stats['updated']}\n"
                f"  Saltati: {stats['skipped']}\n"
                f"  Generi creati: {stats['genres_created']}"
            )
        )

    def _fix_youtube_url(self, url: str) -> str:
        """Corregge URL YouTube con typo comuni."""
        if not url:
            return ""
        # Fix "ttps://" → "https://"
        if url.startswith("ttps://"):
            url = "h" + url
        # Fix spazi
        url = url.strip()
        # Normalizza youtu.be → youtube.com
        url = re.sub(
            r"https?://youtu\.be/([^\s?]+)",
            r"https://www.youtube.com/watch?v=\1",
            url,
        )
        # Fix dailymotion (non YouTube ma gestibile)
        # Lascia com'è se è dailymotion
        return url

    def _get_or_create_genre(self, genre_name, stats, dry_run):
        """Trova o crea uno Snippet Genre."""
        if not genre_name:
            return None

        from artists.models import Genre

        slug = slugify(genre_name)
        genre = Genre.objects.filter(slug=slug).first()

        if genre is None and not dry_run:
            genre = Genre.objects.create(name=genre_name, slug=slug)
            stats["genres_created"] += 1
            self.stdout.write(
                self.style.NOTICE(f"  NEW GENRE: {genre_name}")
            )
        elif genre is None:
            stats["genres_created"] += 1

        return genre

    def _infer_artist_type(self, genre_name: str) -> str:
        """Inferisce il tipo artista dal nome del genere."""
        genre_lower = genre_name.lower()
        if "tributo" in genre_lower or "tribute" in genre_lower:
            return "tribute"
        elif "dj" in genre_lower or "dee-jay" in genre_lower:
            return "dj"
        elif "show" in genre_lower or "party" in genre_lower:
            return "show_band"
        elif "rock" in genre_lower or "folk" in genre_lower:
            return "original"
        return "cover"

    def _extract_tribute_to(
        self, band_name: str, bio: str, genre_name: str
    ) -> str:
        """Tenta di estrarre il nome dell'artista tributato dalla bio."""
        if "tributo" not in genre_name.lower():
            return ""

        # Pattern comuni nelle bio del CSV
        # Es: "tributo agli 883", "tributo a Vasco Rossi"
        patterns = [
            r"tribut[oa]\s+(?:a|agli?|ai|dei|delle?)\s+(.+?)[\.\,\!]",
            r"omaggi(?:o|ando)\s+(?:i|gli|le|a)?\s*(.+?)[\.\,\!]",
            r"tribute.+?(?:to|of|band.+?)\s+(.+?)[\.\,\!]",
        ]

        for pattern in patterns:
            match = re.search(pattern, bio, re.IGNORECASE)
            if match:
                return match.group(1).strip()[:200]

        return ""
```

---

## ESEMPIO DI USO

```bash
# Dry run
python manage.py import_artists_csv dati-band-Magixpromotion.csv --dry-run

# Import effettivo
python manage.py import_artists_csv dati-band-Magixpromotion.csv

# Aggiornamento
python manage.py import_artists_csv dati-band-Magixpromotion.csv --update-existing
```

---

## NOTE IMPLEMENTATIVE

1. **Slug univoci:** Se due band hanno nomi simili, `slugify` potrebbe generare collisioni. Aggiungere suffisso numerico se necessario.
2. **URL fix:** Il CSV ha un typo reale (`ttps://` per The Funky Machine). Il fix è implementato.
3. **Dailymotion:** Alcune band hanno URL Dailymotion (`dai.ly`). Non sono YouTube, ma il campo `hero_video_url` li accetta comunque.
4. **Immagini:** Il CSV non contiene immagini. Andranno caricate manualmente o tramite un secondo script che scrapa le thumbnail YouTube.
5. **`save_revision().publish()`:** Obbligatorio in Wagtail per rendere le pagine live.
6. **`managing_group` (T27 §L210–232, §L460):** Le ArtistPage create dall'import avranno `managing_group=NULL` (solo staff può editarle — fallback sicuro). Dopo l'import, assegnare il `managing_group` dalla tab Settings di ogni ArtistPage. Opzionalmente, estendere il command con `--group <nome_gruppo>` per assegnazione automatica.

---

## CRITERI DI ACCETTAZIONE

- [ ] Command registrato: `python manage.py import_artists_csv --help` funziona
- [ ] `--dry-run` non scrive nel DB
- [ ] 24 ArtistPage create sotto ArtistListingPage
- [ ] 8 Genre snippet creati automaticamente
- [ ] URL YouTube corretti (prefix fix per `ttps://`)
- [ ] `artist_type` inferito correttamente (tribute, dj, show_band, etc.)
- [ ] `tribute_to` estratto dalle bio (almeno per i casi evidenti)
- [ ] `--update-existing` aggiorna senza duplicare
- [ ] Report finale con conteggi stampato a console

---

## SEZIONE TDD

```python
# tests/test_csv_import.py
import pytest
from io import StringIO
from django.core.management import call_command

@pytest.mark.django_db
class TestCSVImportSecurity:
    def test_rejects_malicious_csv(self, home_page, artist_listing, tmp_path):
        """CSV con contenuto malevolo non deve causare XSS/injection."""
        csv = tmp_path / "evil.csv"
        csv.write_text(
            'Band Name,Musical genre,Bio,Video Promo Youtube,Tour,Richiesta Preventivo\n'
            '<script>alert(1)</script>,Rock,<img onerror=alert(1)>,,,\n'
        )
        call_command("import_artists_csv", str(csv))
        from artists.models import ArtistPage
        page = ArtistPage.objects.last()
        assert '<script>' not in page.title

    def test_dry_run_no_changes(self, home_page, artist_listing, tmp_path):
        csv = tmp_path / "test.csv"
        csv.write_text(
            'Band Name,Musical genre,Bio,Video Promo Youtube,Tour,Richiesta Preventivo\n'
            'Test Band,Rock,Bio test.,,,\n'
        )
        from artists.models import ArtistPage
        count_before = ArtistPage.objects.count()
        call_command("import_artists_csv", str(csv), "--dry-run")
        assert ArtistPage.objects.count() == count_before
```

---

## SECURITY CHECKLIST

- [ ] Sanitizzazione input CSV: strip tag HTML dal titolo e bio
- [ ] URL YouTube validati (solo domini youtube.com e youtu.be)
- [ ] `--dry-run` non modifica il database
- [ ] Command accessibile solo da shell (non esposto via API/web)
