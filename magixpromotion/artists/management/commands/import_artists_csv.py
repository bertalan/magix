"""Management command per importare artisti da CSV."""
import csv
import re
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.utils.text import slugify


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

        from artists.models import ArtistListingPage, ArtistPage, Genre

        listing_page = ArtistListingPage.objects.live().first()

        if listing_page is None:
            raise CommandError("Nessuna ArtistListingPage live trovata. Creala prima nell'admin Wagtail.")

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

                genre = self._get_or_create_genre(genre_name, stats, dry_run)
                artist_type = self._infer_artist_type(genre_name)
                tribute_to = self._extract_tribute_to(band_name, bio, genre_name)
                slug = slugify(band_name)

                existing = ArtistPage.objects.filter(slug=slug).first()

                if existing and not update_existing:
                    self.stdout.write(
                        self.style.WARNING(f"  SKIP: {band_name} (esiste gia)")
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
                    artist_page = ArtistPage(
                        title=band_name,
                        slug=slug,
                        short_bio=bio[:500],
                        hero_video_url=youtube_url,
                        artist_type=artist_type,
                        tribute_to=tribute_to,
                        base_region="Piemonte",
                    )

                    listing_page.add_child(instance=artist_page)

                    if genre:
                        artist_page.genres.add(genre)

                    artist_page.save_revision().publish()
                    stats["created"] += 1
                    self.stdout.write(
                        self.style.SUCCESS(f"  CREATED: {band_name} [{genre_name}]")
                    )

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
        # Rimuovi spazi interni e esterni (typo frequente nei dati CSV)
        url = url.strip().replace(" ", "")
        if url.startswith("ttps://"):
            url = "h" + url
        url = re.sub(
            r"https?://youtu\.be/([^\s?]+)",
            r"https://www.youtube.com/watch?v=\1",
            url,
        )
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
            self.stdout.write(self.style.NOTICE(f"  NEW GENRE: {genre_name}"))
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

    def _extract_tribute_to(self, band_name: str, bio: str, genre_name: str) -> str:
        """Tenta di estrarre il nome dell'artista tributato dalla bio."""
        if "tributo" not in genre_name.lower():
            return ""

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
