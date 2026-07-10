(function () {
  "use strict";

  function renderIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons({
        attrs: {
          "stroke-width": 2.2,
          "aria-hidden": "true"
        }
      });
    }
    renderYoutubeFallback();
  }

  function renderYoutubeFallback() {
    document.querySelectorAll('i[data-lucide="youtube"]').forEach((node) => {
      const icon = document.createElement("span");
      icon.className = "apll-youtube-fallback";
      icon.setAttribute("aria-hidden", "true");
      node.replaceWith(icon);
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
