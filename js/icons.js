(function () {
  "use strict";

  function renderIcons() {
    if (!window.lucide || typeof window.lucide.createIcons !== "function") return;
    window.lucide.createIcons({
      attrs: {
        "stroke-width": 2.2,
        "aria-hidden": "true"
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderIcons, { once: true });
  } else {
    renderIcons();
  }

  window.addEventListener("load", renderIcons, { once: true });
  document.addEventListener("language:change", renderIcons);
})();
