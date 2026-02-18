/**
 * Icon Picker – Selettore visuale di icone Lucide per Wagtail admin.
 *
 * Si auto-inizializza su tutti gli elementi .icon-picker-wrapper presenti
 * nel DOM al caricamento della pagina o aggiunti dinamicamente da Wagtail
 * (InlinePanel, StreamField, ecc.).
 */
(function () {
  "use strict";

  /* ── Elenco curato di icone Lucide rilevanti ────────── */
  var ICONS = [
    // Musica & Audio
    "music","music-2","music-3","music-4","guitar","drum","mic","mic-2",
    "headphones","radio","volume-2","speaker","disc","disc-2","disc-3",
    "audio-waveform","audio-lines",
    // Calendario & Tempo
    "calendar","calendar-days","calendar-check","calendar-clock",
    "calendar-heart","calendar-plus","clock","timer","hourglass",
    "alarm-clock",
    // Luoghi & Venue
    "map-pin","map","navigation","compass","globe","globe-2","building",
    "building-2","home","warehouse","church","castle","tent","landmark",
    "store","hotel",
    // Celebrazioni
    "party-popper","gift","cake","heart","star","sparkles","sparkle",
    "flame","zap","trophy","crown","medal","award",
    // Persone
    "users","user","user-plus","user-check","contact","handshake",
    "baby","person-standing",
    // Comunicazione
    "mail","phone","send","message-circle","message-square","at-sign",
    "inbox","bell","bell-ring",
    // Media
    "camera","image","video","film","tv","play","circle-play",
    "clapperboard","aperture","focus",
    // Arte & Creatività
    "palette","brush","pen-tool","paint-bucket","wand-2","scissors",
    // Finance & Booking
    "ticket","banknote","credit-card","wallet","dollar-sign","euro",
    "coins","receipt",
    // Marketing
    "megaphone","newspaper","share-2","link","external-link","rss",
    // Natura & Meteo
    "sun","moon","cloud","umbrella","snowflake","tree-pine","flower",
    "leaf","trees",
    // Trasporti
    "car","bus","train-front","plane","bike","ship",
    // Cibo & Bevande
    "utensils","coffee","wine","beer","pizza","chef-hat","grape",
    "glass-water",
    // Generale
    "check","x","plus","minus","search","filter","settings","sliders",
    "info","alert-triangle","bookmark","tag","hash","flag","eye",
    "shield","lock","key","database","server","wifi","bluetooth",
    "battery","download","upload","refresh-cw","power","wrench",
    "hammer","lightbulb","bolt","grid-3x3","layout-grid","list",
    "clipboard","file-text","folder","archive","trash-2","copy",
    "move","maximize-2","minimize-2","chevron-right","arrow-right",
    "arrow-up-right","circle","square","triangle","hexagon","diamond",
    "hand-metal","thumbs-up","thumbs-down","smile","laugh","frown",
    "meh","angry","glasses","scan-face"
  ];

  var CDN_BASE = "https://unpkg.com/lucide-static@latest/icons/";

  /* ── Inizializza un singolo wrapper ─────────────────── */
  function initPicker(wrapper) {
    if (wrapper._iconPickerInit) return;
    wrapper._iconPickerInit = true;

    var input     = wrapper.querySelector(".icon-picker-input");
    var preview   = wrapper.querySelector(".icon-picker-preview");
    var btnOpen   = wrapper.querySelector(".icon-picker-btn");
    var btnClear  = wrapper.querySelector(".icon-picker-clear-btn");
    var dropdown  = wrapper.querySelector(".icon-picker-dropdown");
    var searchBox = wrapper.querySelector(".icon-picker-search");
    var grid      = wrapper.querySelector(".icon-picker-grid");

    if (!input || !grid) return;

    /* ── Popola la griglia ──────────────────────────────── */
    function buildGrid() {
      grid.innerHTML = "";
      ICONS.forEach(function (iconName) {
        var item = document.createElement("div");
        item.className = "icon-picker-item";
        item.setAttribute("data-icon", iconName);
        item.setAttribute("title", iconName);
        item.innerHTML =
          '<img src="' + CDN_BASE + iconName + '.svg" alt="" loading="lazy" />' +
          "<span>" + iconName + "</span>";
        grid.appendChild(item);
      });
      highlightSelected();
    }

    function highlightSelected() {
      var current = input.value;
      grid.querySelectorAll(".icon-picker-item").forEach(function (el) {
        el.classList.toggle("selected", el.getAttribute("data-icon") === current);
      });
    }

    /* ── Aggiorna anteprima ─────────────────────────────── */
    function updatePreview(value) {
      if (value) {
        preview.innerHTML =
          '<img src="' + CDN_BASE + value + '.svg" alt="' + value +
          '" class="icon-picker-preview-img" />' +
          '<span class="icon-picker-preview-name">' + value + "</span>";
      } else {
        preview.innerHTML = "";
      }
    }

    /* ── Toggle dropdown ────────────────────────────────── */
    function openDropdown() {
      dropdown.style.display = "flex";
      searchBox.value = "";
      filterIcons("");
      highlightSelected();
      searchBox.focus();
    }

    function closeDropdown() {
      dropdown.style.display = "none";
    }

    function toggleDropdown() {
      if (dropdown.style.display === "none") {
        openDropdown();
      } else {
        closeDropdown();
      }
    }

    /* ── Filtra icone ───────────────────────────────────── */
    function filterIcons(query) {
      var q = query.toLowerCase().trim();
      var items = grid.querySelectorAll(".icon-picker-item");
      var visible = 0;
      items.forEach(function (el) {
        var name = el.getAttribute("data-icon");
        var show = !q || name.indexOf(q) !== -1;
        el.style.display = show ? "" : "none";
        if (show) visible++;
      });
      // Messaggio "nessun risultato"
      var empty = grid.querySelector(".icon-picker-empty");
      if (visible === 0) {
        if (!empty) {
          empty = document.createElement("div");
          empty.className = "icon-picker-empty";
          empty.textContent = "Nessuna icona trovata";
          grid.appendChild(empty);
        }
      } else if (empty) {
        empty.remove();
      }
    }

    /* ── Seleziona icona ────────────────────────────────── */
    function selectIcon(iconName) {
      input.value = iconName;
      // Trigger Django/Wagtail change detection
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      updatePreview(iconName);
      highlightSelected();
      closeDropdown();
    }

    /* ── Clear ──────────────────────────────────────────── */
    function clearIcon() {
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      updatePreview("");
      highlightSelected();
    }

    /* ── Event listeners ────────────────────────────────── */
    btnOpen.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggleDropdown();
    });

    btnClear.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      clearIcon();
    });

    searchBox.addEventListener("input", function () {
      filterIcons(this.value);
    });

    // Click su icona nella griglia (event delegation)
    grid.addEventListener("click", function (e) {
      var item = e.target.closest(".icon-picker-item");
      if (item) {
        selectIcon(item.getAttribute("data-icon"));
      }
    });

    // Chiudi dropdown cliccando fuori
    document.addEventListener("click", function (e) {
      if (!wrapper.contains(e.target)) {
        closeDropdown();
      }
    });

    // Chiudi con Escape
    dropdown.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeDropdown();
        btnOpen.focus();
      }
    });

    // Sincronizza anteprima se l'utente edita il campo testo a mano
    input.addEventListener("input", function () {
      updatePreview(this.value);
    });

    /* ── Init ───────────────────────────────────────────── */
    buildGrid();
  }

  /* ── Auto-init al caricamento e su mutazioni DOM ─────── */
  function initAll() {
    document.querySelectorAll(".icon-picker-wrapper").forEach(initPicker);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }

  // Osserva il DOM per widget aggiunti dinamicamente (InlinePanel, ecc.)
  var observer = new MutationObserver(function (mutations) {
    var shouldInit = false;
    mutations.forEach(function (m) {
      if (m.addedNodes.length) shouldInit = true;
    });
    if (shouldInit) initAll();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
