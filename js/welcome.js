// js/welcome.js
(function () {
  "use strict";

  const STORAGE_KEY = (window.APP_CONFIG?.STORAGE_KEYS?.LANG) || "apll.lang";
  const EXPIRY_MS   = (window.APP_CONFIG?.EXPIRY_MS) ?? (60 * 60 * 1000);

  const FALLBACK_LANGS = {
    it: "🇮🇹 Italiano",
    sq: "🇦🇱 Shqip",
    en: "🇬🇧 English",
    pa: "🇮🇳 ਪੰਜਾਬੀ",
    hi: "🇮🇳 हिन्दी",
    "hi-Latn": "🇮🇳 Hinglish"
  };

  // -------- storage (expiry-aware) --------
  function getLangFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    if (raw[0] !== "{") { localStorage.removeItem(STORAGE_KEY); return null; }
    try {
      const obj = JSON.parse(raw);
      if (!obj || typeof obj.v !== "string" || typeof obj.exp !== "number") {
        localStorage.removeItem(STORAGE_KEY); return null;
      }
      if (Date.now() > obj.exp) { localStorage.removeItem(STORAGE_KEY); return null; }
      return obj.v;
    } catch {
      localStorage.removeItem(STORAGE_KEY); return null;
    }
  }

  function setLangWithExpiry(lang, ttl = EXPIRY_MS) {
    const langs = getLangs();
    if (!langs[lang]) return;
    const payload = JSON.stringify({ v: lang, exp: Date.now() + ttl });
    localStorage.setItem(STORAGE_KEY, payload);
    syncAllSelectors(lang);
  }

  // -------- language helpers --------
  function getLangs() {
    try {
      if (window.LanguageSelector?.LANGS) return window.LanguageSelector.LANGS;
    } catch {}
    return FALLBACK_LANGS;
  }

  function populateSelect(selectEl, langs) {
    if (!selectEl || selectEl.dataset.populated) return;
    Object.entries(langs).forEach(([value, label]) => {
      const opt = document.createElement("option");
      opt.value = value; opt.textContent = label;
      selectEl.appendChild(opt);
    });
    selectEl.dataset.populated = "true";
  }

  function syncAllSelectors(lang) {
    document.querySelectorAll("select.lang-select").forEach(sel => {
      if (!sel.dataset.populated) populateSelect(sel, getLangs());
      sel.value = lang;
    });
  }

  // -------- overlay control --------
  function hideOverlayNow(overlay) {
    if (!overlay) return;
    overlay.setAttribute("hidden", "");
    overlay.style.display = "none";
    document.body.classList.remove("overlay-lock");
  }

  function showOverlay(overlay) {
    if (!overlay) return;
    overlay.removeAttribute("hidden");
    overlay.style.display = "";
    document.body.classList.add("overlay-lock");
  }

  // -------- init --------
  function init() {
    const overlay  = document.getElementById("welcomeOverlay");
    const btn      = document.getElementById("welcomeContinue");
    const selectEl = document.getElementById("welcomeLang");
    if (!overlay || !btn || !selectEl) return;

    const existing = getLangFromStorage();
    if (existing) {
      hideOverlayNow(overlay);
      syncAllSelectors(existing);
      return;
    }

    // New visitors enter directly in Italian. The language can always
    // be changed from the selector in the top navigation.
    const initial = "it";
    setLangWithExpiry(initial, EXPIRY_MS);
    hideOverlayNow(overlay);

    if (window.LanguageSelector && typeof window.LanguageSelector.set === "function") {
      window.LanguageSelector.set(initial, EXPIRY_MS);
    } else {
      document.dispatchEvent(new CustomEvent("language:change", { detail: { lang: initial } }));
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
