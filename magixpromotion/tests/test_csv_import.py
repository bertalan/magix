"""Test per il management command di import CSV."""
import pytest
from io import StringIO

from django.core.management import call_command


@pytest.fixture
def csv_content():
    return (
        "Band Name,Musical genre,Bio,Video Promo Youtube,Tour,Richiesta Preventivo\n"
        "Red Moon,Dance Show Band,Una band energica.,https://www.youtube.com/watch?v=abc,,\n"
        "iPop,Dance Show Band,iPop e' la festa definitiva.,ttps://www.youtube.com/watch?v=def,,\n"
    )


@pytest.fixture
def csv_content_with_tribute():
    return (
        "Band Name,Musical genre,Bio,Video Promo Youtube,Tour,Richiesta Preventivo\n"
        "Queen Tribute,Tributo Internazionale,Tributo ai Queen. Grande spettacolo.,https://www.youtube.com/watch?v=qt,,\n"
    )


@pytest.mark.django_db
class TestCSVImport:
    def test_dry_run(self, home_page, artist_listing, csv_content, tmp_path):
        csv_file = tmp_path / "test.csv"
        csv_file.write_text(csv_content)

        out = StringIO()
        call_command("import_artists_csv", str(csv_file), "--dry-run", stdout=out)
        output = out.getvalue()
        assert "DRY" in output or "Red Moon" in output

    def test_import_creates_artists(
        self, home_page, artist_listing, csv_content, tmp_path
    ):
        from artists.models import ArtistPage

        csv_file = tmp_path / "test.csv"
        csv_file.write_text(csv_content)

        initial_count = ArtistPage.objects.count()
        call_command("import_artists_csv", str(csv_file))
        assert ArtistPage.objects.count() == initial_count + 2

    def test_youtube_url_fix(
        self, home_page, artist_listing, csv_content, tmp_path
    ):
        from artists.models import ArtistPage

        csv_file = tmp_path / "test.csv"
        csv_file.write_text(csv_content)

        call_command("import_artists_csv", str(csv_file))
        ipop = ArtistPage.objects.get(title="iPop")
        # URL with typo "ttps://" should be fixed to "https://"
        assert ipop.hero_video_url.startswith("https://")

    def test_genre_auto_creation(
        self, home_page, artist_listing, csv_content, tmp_path
    ):
        """Genres are auto-created during import."""
        from artists.models import Genre

        csv_file = tmp_path / "test.csv"
        csv_file.write_text(csv_content)

        call_command("import_artists_csv", str(csv_file))
        assert Genre.objects.filter(slug="dance-show-band").exists()

    def test_skip_existing(
        self, home_page, artist_listing, csv_content, tmp_path
    ):
        """Second import should skip existing artists."""
        from artists.models import ArtistPage

        csv_file = tmp_path / "test.csv"
        csv_file.write_text(csv_content)

        call_command("import_artists_csv", str(csv_file))
        count_after_first = ArtistPage.objects.count()

        out = StringIO()
        call_command("import_artists_csv", str(csv_file), stdout=out)
        assert ArtistPage.objects.count() == count_after_first
        assert "SKIP" in out.getvalue()

    def test_file_not_found(self, home_page, artist_listing):
        from django.core.management.base import CommandError

        with pytest.raises(CommandError, match="non trovato"):
            call_command("import_artists_csv", "/nonexistent/file.csv")

    def test_infer_artist_type_tribute(
        self, home_page, artist_listing, csv_content_with_tribute, tmp_path
    ):
        from artists.models import ArtistPage

        csv_file = tmp_path / "tribute.csv"
        csv_file.write_text(csv_content_with_tribute)

        call_command("import_artists_csv", str(csv_file))
        qt = ArtistPage.objects.get(title="Queen Tribute")
        assert qt.artist_type == "tribute"

    def test_import_from_fixture_file(self, home_page, artist_listing):
        """Test import using the bundled test fixture CSV."""
        import os

        from artists.models import ArtistPage

        fixture_path = os.path.join(
            os.path.dirname(__file__), "fixtures", "test_bands.csv"
        )
        initial_count = ArtistPage.objects.count()
        call_command("import_artists_csv", fixture_path)
        assert ArtistPage.objects.count() == initial_count + 3
