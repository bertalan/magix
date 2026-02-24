#!/bin/bash
# =============================================================
# Scarica le foto dal vecchio sito Joomla magixpromotion.com,
# le rinomina col nome-band e le converte in WebP.
# =============================================================
# Requisiti: cwebp (brew install webp)
# Uso:  cd magixpromotion && ./scripts/download_old_site_images.sh
# =============================================================

set -euo pipefail

BASE_URL="https://magixpromotion.com/images/Band"
DEST_DIR="media/imported_from_joomla"

mkdir -p "$DEST_DIR"

# --- Verifica che cwebp sia disponibile ---
if ! command -v cwebp &>/dev/null; then
  echo "⚠  cwebp non trovato. Installo libwebp via Homebrew..."
  brew install webp
fi

# ---------------------------------------------------------------
# Helper: scarica → rinomina <band>-<n>.webp → rimuove originale
# Uso: dl <band_slug> <url_remoto> <numero>
# ---------------------------------------------------------------
dl() {
  local band="$1" url="$2" n="$3"
  local ext
  ext="$(echo "${url##*.}" | tr '[:upper:]' '[:lower:]')"
  local tmp="$DEST_DIR/${band}-${n}_tmp.${ext}"
  local out="$DEST_DIR/${band}-${n}.webp"

  curl -sS -o "$tmp" "$url"

  # Se il file è vuoto o troppo piccolo (<1KB) probabilmente 404
  if [[ ! -s "$tmp" ]] || [[ $(wc -c < "$tmp") -lt 1024 ]]; then
    echo "  ✗ skip ${band}-${n} (file vuoto o < 1KB)"
    rm -f "$tmp"
    return
  fi

  cwebp -quiet -q 82 "$tmp" -o "$out" 2>/dev/null && rm -f "$tmp" || {
    mv "$tmp" "$DEST_DIR/${band}-${n}.${ext,,}"
    echo "  ⚠ ${band}-${n}: conversione WebP fallita, mantenuto originale"
  }
}

echo "=== Download e conversione WebP dal vecchio sito magixpromotion.com ==="
echo ""

# ═══════════════════════════════════════════════════════════════
#  BAND PRESENTI NEL DB LOCALE  (priorità alta)
# ═══════════════════════════════════════════════════════════════

# AC/DI (= ACiDI sul vecchio sito)
dl "acdi"      "$BASE_URL/acidi/acidi-sito-magix.png"                                                   1
dl "acdi"      "$BASE_URL/acidi/13626960_1032501073523762_8704927558498649825_n.jpg"                     2
dl "acdi"      "$BASE_URL/acidi/13781856_1042920892481780_7649178547700497135_o.jpg"                     3
echo "✓ AC/DI"

# BLISS
dl "bliss"     "$BASE_URL/bliss/bliss-sito-1.png"                                                       1
dl "bliss"     "$BASE_URL/bliss/bliss-sito-2.png"                                                       2
dl "bliss"     "$BASE_URL/bliss/54730854_2277798245586972_6804960913497923584_n.jpg"                     3
echo "✓ BLISS"

# BMB
dl "bmb"       "$BASE_URL/bmb/bmb-sito-magix.png"                                                       1
dl "bmb"       "$BASE_URL/bmb/bmb-0027.jpg"                                                             2
dl "bmb"       "$BASE_URL/bmb/Foto1.jpg"                                                                3
echo "✓ BMB"

# FLOYD ANIMALS
dl "floyd-animals"  "$BASE_URL/floydanimals/floyd-sito-magix.png"                                        1
dl "floyd-animals"  "$BASE_URL/floydanimals/floyd.jpg"                                                   2
echo "✓ FLOYD ANIMALS"

# HAPPY HOUR
dl "happy-hour"     "$BASE_URL/happyhour/happyh-sito-magix.png"                                         1
dl "happy-hour"     "$BASE_URL/happyhour/DSC03005-1_risultato.jpg"                                       2
dl "happy-hour"     "$BASE_URL/happyhour/DSC03098-1_risultato.jpg"                                       3
dl "happy-hour"     "$BASE_URL/happyhour/DSC02749-1_risultato.jpg"                                       4
dl "happy-hour"     "$BASE_URL/happyhour/DSC02980-1_risultato.jpg"                                       5
echo "✓ HAPPY HOUR"

# NORD SUD OVEST BAND
dl "nord-sud-ovest-band"  "$BASE_URL/nordsud/nsob-sito-magix.png"                                        1
dl "nord-sud-ovest-band"  "$BASE_URL/nordsud/nsob_1.jpg"                                                 2
dl "nord-sud-ovest-band"  "$BASE_URL/nordsud/nordsud_1.jpg"                                              3
echo "✓ NORD SUD OVEST BAND"

# PENSIERI POSITIVI
dl "pensieri-positivi"    "$BASE_URL/pensieripositivi/pensieri-sito-magix.png"                            1
dl "pensieri-positivi"    "$BASE_URL/pensieripositivi/jova-mail.jpg"                                      2
dl "pensieri-positivi"    "$BASE_URL/pensieripositivi/1268517_10201908486215195_1405272408_o.jpg"          3
echo "✓ PENSIERI POSITIVI"

# QUEENESSENCE
dl "queenessence"         "$BASE_URL/queenessence/manifesto-sito.jpg"                                     1
dl "queenessence"         "$BASE_URL/queenessence/9eca01ee-dd8b-44c4-acee-9b01f13c5aaf.jpg"               2
dl "queenessence"         "$BASE_URL/queenessence/9f754720-6b60-42b4-848f-7d52e3adeabf.jpg"               3
echo "✓ QUEENESSENCE"

# SNEAKERS
dl "sneakers"             "$BASE_URL/sneakers/sneakers-sito-magix.png"                                    1
dl "sneakers"             "$BASE_URL/sneakers/19665152_1461744383870556_1927660637063506556_n.jpg"         2
echo "✓ SNEAKERS"

echo ""
echo "---------------------------------------------------------------"
echo " BAND SUL VECCHIO SITO MA NON NEL DB LOCALE (bonus)"
echo "---------------------------------------------------------------"

# THE TURNER SHOW
dl "the-turner-show"      "$BASE_URL/turner/turner-sito-magix.png"                                        1
dl "the-turner-show"      "$BASE_URL/turner/turner_2_n.jpg"                                               2
echo "✓ THE TURNER SHOW"

# SAD
dl "sad"                  "$BASE_URL/sad/Sad-sito-magix.png"                                              1
dl "sad"                  "$BASE_URL/sad/sad-1.jpg"                                                       2
echo "✓ SAD"

# TOO FIGHTERS
dl "too-fighters"         "$BASE_URL/toofighters/tooFighters-sito-magix.png"                              1
dl "too-fighters"         "$BASE_URL/toofighters/TF-low.jpg"                                              2
dl "too-fighters"         "$BASE_URL/toofighters/too_600_400.jpg"                                         3
echo "✓ TOO FIGHTERS"

# MOTORHELL
dl "motorhell"            "$BASE_URL/motorhell/Motorhell-sito-magix.png"                                  1
echo "✓ MOTORHELL"

# POOTTANA
dl "poottana"             "$BASE_URL/poottana/poottana-sito-magix.png"                                    1
dl "poottana"             "$BASE_URL/poottana/DSC_7076-Modifica.jpg"                                      2
dl "poottana"             "$BASE_URL/poottana/DSC_1434.jpg"                                               3
echo "✓ POOTTANA"

# THE PRESENCE
dl "the-presence"         "$BASE_URL/thepresence/presence-sito-magix.png"                                 1
dl "the-presence"         "$BASE_URL/thepresence/presence-2.jpg"                                          2
echo "✓ THE PRESENCE"

# MUPPET SUICIDE
dl "muppet-suicide"       "$BASE_URL/muppet/muppet-sito-magix.png"                                       1
dl "muppet-suicide"       "$BASE_URL/muppet/muppet_area51_9.jpg"                                         2
echo "✓ MUPPET SUICIDE"

# LIZBERRIES
dl "lizberries"           "$BASE_URL/lizberries/lizberries-sito-magix.png"                                1
dl "lizberries"           "$BASE_URL/lizberries/Lizberries1.jpg"                                          2
echo "✓ LIZBERRIES"

# GOLDRUSH
dl "goldrush"             "$BASE_URL/goldrush/goldRush-sito-magix.png"                                    1
echo "✓ GOLDRUSH"

# REDHOTRIBU
dl "redhotribu"           "$BASE_URL/redhotribu/redHot-sito-magix.png"                                    1
dl "redhotribu"           "$BASE_URL/redhotribu/foto-dipinta2.jpg"                                        2
dl "redhotribu"           "$BASE_URL/redhotribu/foto-dipinta3.jpg"                                        3
echo "✓ REDHOTRIBU"

# DIRE STRATO
dl "dire-strato"          "$BASE_URL/direstraits/direStrato-sito-magix.png"                               1
echo "✓ DIRE STRATO"

# UTOPIA
dl "utopia"               "$BASE_URL/utopia/utopia-manif-sito.png"                                        1
dl "utopia"               "$BASE_URL/utopia/5.png"                                                        2
dl "utopia"               "$BASE_URL/utopia/6.png"                                                        3
echo "✓ UTOPIA"

# CARO LUCIO TI SCRIVO
dl "caro-lucio-ti-scrivo" "$BASE_URL/carolucio/poster-2.png"                                              1
dl "caro-lucio-ti-scrivo" "$BASE_URL/carolucio/2.png"                                                     2
dl "caro-lucio-ti-scrivo" "$BASE_URL/carolucio/3.png"                                                     3
echo "✓ CARO LUCIO TI SCRIVO"

# THE WOMEN IN ROCK
dl "the-women-in-rock"    "$BASE_URL/Italian-Women/TheWomenInRock_copertina.png"                           1
dl "the-women-in-rock"    "$BASE_URL/Italian-Women/04_DVD1982.jpg"                                        2
dl "the-women-in-rock"    "$BASE_URL/Italian-Women/05_DVD1827.jpg"                                        3
echo "✓ THE WOMEN IN ROCK"

# EXODUS
dl "exodus"               "$BASE_URL/exodus/exodus-sito-magix.png"                                        1
dl "exodus"               "$BASE_URL/exodus/SETTIMO_MIL._CONCERTO_LUGLIO_2018.jpg"                        2
dl "exodus"               "$BASE_URL/exodus/nicola_2.jpg"                                                 3
echo "✓ EXODUS"

# GREYGOOSE BAND
dl "greygoose-band"       "$BASE_URL/greygoose/greyGoosebanner-sito-magix.png"                            1
echo "✓ GREYGOOSE BAND"

# MONDO MENGONI
dl "mondo-mengoni"        "$BASE_URL/mondomengoni/mengoni-sito-magix.png"                                  1
echo "✓ MONDO MENGONI"

# A TESTA IN GIU'
dl "a-testa-in-giu"       "$BASE_URL/a-testa-in-giu/aTestaingiu-sito-magix.png"                           1
dl "a-testa-in-giu"       "$BASE_URL/a-testa-in-giu/DSC_3792.jpg"                                         2
echo "✓ A TESTA IN GIU'"

# ARTICOLO J
dl "articolo-j"           "$BASE_URL/articoloj/articoloJ-sito-magix.png"                                   1
dl "articolo-j"           "$BASE_URL/articoloj/13102752_915921858517064_4145837920236995792_n.jpg"          2
echo "✓ ARTICOLO J"

# AMICIDALFREDO 2.0
dl "amicidalfredo"        "$BASE_URL/amicialfredo/amici2.0-sito-magix.jpg"                                 1
echo "✓ AMICIDALFREDO 2.0"

# ATOMIKA
dl "atomika"              "$BASE_URL/atomika/atomika-sito-magix.png"                                       1
dl "atomika"              "$BASE_URL/atomika/atomika_1.jpg"                                                2
echo "✓ ATOMIKA"

# FLY BLUE'S
dl "fly-blues"            "$BASE_URL/flyblues/flyBlues-sito-magix.png"                                     1
dl "fly-blues"            "$BASE_URL/flyblues/fly.Blues.jpg"                                               2
echo "✓ FLY BLUE'S"

# EFFETTO MODA'
dl "effetto-moda"         "$BASE_URL/effettomoda/effettoModa_sito-magix.png"                               1
dl "effetto-moda"         "$BASE_URL/effettomoda/DSC_5969-1.jpg"                                           2
dl "effetto-moda"         "$BASE_URL/effettomoda/Foto%20effetto%20MODA%20live%202.jpg"                     3
echo "✓ EFFETTO MODA'"

# STUPIDO HOTEL
dl "stupido-hotel"        "$BASE_URL/stupido/Stupido-Sito-1.jpg"                                           1
echo "✓ STUPIDO HOTEL"

# LA NOTTE DEI TRIBUTI
dl "la-notte-dei-tributi" "$BASE_URL/nottetributi/notte-tributi-sito-magix.jpg"                            1
dl "la-notte-dei-tributi" "$BASE_URL/nottetributi/notte-tributi.jpg"                                       2
echo "✓ LA NOTTE DEI TRIBUTI"

echo ""
echo "=== Download e conversione completati! ==="
echo ""
echo "File WebP salvati in: $DEST_DIR/"
TOTAL=$(ls -1 "$DEST_DIR"/*.webp 2>/dev/null | wc -l | tr -d ' ')
echo "  Totale file WebP: $TOTAL"
echo ""
echo "Formato nomi:  <nome-band>-<n>.webp"
echo "  Es: acdi-1.webp, bliss-2.webp, happy-hour-3.webp"
echo ""
echo "Per caricarli in Wagtail → http://localhost:8000/admin/images/"
