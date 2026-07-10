(function () {
  "use strict";

  window.tailwind = window.tailwind || {};
  window.tailwind.config = {
    corePlugins: {
      preflight: false
    },
    theme: {
      extend: {
        colors: {
          apll: {
            ink: "#0A2E5C",
            blue: "#0B5ED7",
            sky: "#E9F2FF",
            mint: "#0E9F6E",
            amber: "#F59E0B",
            coral: "#E85D4F"
          }
        },
        boxShadow: {
          soft: "0 18px 50px rgba(10, 46, 92, 0.10)",
          lifted: "0 22px 70px rgba(15, 23, 42, 0.14)"
        },
        borderRadius: {
          apll: "8px"
        }
      }
    }
  };
})();
