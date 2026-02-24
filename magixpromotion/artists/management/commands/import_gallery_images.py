"""
Management command: importa le immagini scaricate dal vecchio sito Joomla
nella gallery di ciascun ArtistPage, associandole per slug.

Uso:
    python manage.py import_gallery_images [--source media/imported_from_joomla] [--dry-run]
"""

import re
from collections import defaultdict
from pathlib import Path

from django.core.files.images import ImageFile
from django.core.management.base import BaseCommand

from wagtail.images import get_image_model

from artists.models import ArtistGalleryImage, ArtistPage


Image = get_image_model()

# Pattern: <slug>-<n>.webp  →  cattura lo slug (tutto tranne l'ultimo -<n>)
FILENAME_RE = re.compile(r"^(.+)-(\d+)\.webp$")


class Command(BaseCommand):
    help = "Importa le immagini WebP dal vecchio sito nella gallery degli artisti."

    def add_arguments(self, parser):
        parser.add_argument(
            "--source",
            default="media/imported_from_joomla",
            help="Cartella contenente le immagini WebP (default: media/imported_from_joomla)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Mostra cosa verrebbe importato senza scrivere nel DB.",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Rimuovi le gallery_images esistenti prima di importare.",
        )

    def handle(self, *args, **options):
        source_dir = Path(options["source"])
        dry_run = options["dry_run"]
        clear = options["clear"]

        if not source_dir.is_dir():
            self.stderr.write(self.style.ERROR(f"Cartella non trovata: {source_dir}"))
            return

        # -----------------------------------------------------------
        # 1. Raggruppa i file per slug
        # -----------------------------------------------------------
        slug_files: dict[str, list[Path]] = defaultdict(list)
        for f in sorted(source_dir.iterdir()):
            m = FILENAME_RE.match(f.name)
            if m:
                slug_files[m.group(1)].append(f)

        self.stdout.write(
            f"Trovati {sum(len(v) for v in slug_files.values())} file "
            f"per {len(slug_files)} slug nella cartella {source_dir}"
        )

        # -----------------------------------------------------------
        # 2. Carica gli artisti esistenti per slug
        # -----------------------------------------------------------
        artists_by_slug: dict[str, ArtistPage] = {
            a.slug: a for a in ArtistPage.objects.live()
        }

        matched = 0
        skipped_no_artist = []
        imported = 0

        for slug, files in sorted(slug_files.items()):
            artist = artists_by_slug.get(slug)
            if artist is None:
                skipped_no_artist.append(slug)
                continue

            matched += 1

            if dry_run:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"  [DRY-RUN] {artist.title} ({slug}): "
                        f"{len(files)} immagini da importare"
                    )
                )
                continue

            # Rimuovi le gallery_images esistenti se --clear
            if clear:
                old_count = artist.gallery_images.count()
                if old_count:
                    artist.gallery_images.all().delete()
                    self.stdout.write(
                        f"  Rimosse {old_count} immagini esistenti per {artist.title}"
                    )

            existing_count = artist.gallery_images.count()

            for i, filepath in enumerate(files):
                # Crea l'oggetto Wagtail Image
                with open(filepath, "rb") as fh:
                    wagtail_image = Image(
                        title=f"{artist.title} – gallery {existing_count + i + 1}",
                        file=ImageFile(fh, name=filepath.name),
                    )
                    wagtail_image.save()

                # Crea la relazione gallery
                ArtistGalleryImage.objects.create(
                    page=artist,
                    image=wagtail_image,
                    sort_order=existing_count + i,
                )
                imported += 1

            self.stdout.write(
                self.style.SUCCESS(
                    f"  ✓ {artist.title}: {len(files)} immagini importate"
                )
            )

        # -----------------------------------------------------------
        # 3. Report
        # -----------------------------------------------------------
        self.stdout.write("")
        self.stdout.write(f"Artisti matchati: {matched}/{len(slug_files)}")
        self.stdout.write(f"Immagini importate: {imported}")
        if skipped_no_artist:
            self.stdout.write(
                self.style.WARNING(
                    f"Slug senza artista nel DB ({len(skipped_no_artist)}): "
                    + ", ".join(skipped_no_artist)
                )
            )
        if dry_run:
            self.stdout.write(self.style.NOTICE("Nessuna modifica (dry-run)."))
