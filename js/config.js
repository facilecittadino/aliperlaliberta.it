// js/config.js
// =========================================================
// AliPerLaLiberta — Global App Configuration
// =========================================================

window.APP_CONFIG = Object.freeze({

  // ---------------------------
  // Layout Breakpoints
  // ---------------------------
  LARGE_BP: 992,  // Desktop breakpoint (px)

  // ---------------------------
  // Local-storage expiry time for language preference
  // Default: 60 × 1000 = 1 minute
  // You can change to 3600 × 1000 = 1 hour when stable
  // ---------------------------
  EXPIRY_MS: 24 * 60 * 60 * 1000,

  // ---------------------------
  // Storage Keys
  // ---------------------------
  STORAGE_KEYS: Object.freeze({
    LANG: "apll.lang"
  }),

  // ---------------------------
  // Google Calendar public appointment pages.
  // Paste ONLY public booking URLs when ready.
  // Example: https://calendar.google.com/calendar/appointments/...
  // Do not use private Calendar dashboard URLs such as /calendar/u/2/r.
  // Until these are set, booking buttons keep using the current form fallback.
  // ---------------------------
  GOOGLE_CALENDAR_BOOKING_URLS: Object.freeze({
    PRACTICES: "https://calendar.google.com/calendar/appointments/AcZssZ0LoGIBYbkMUStTFJnxKM847ncXM2KBwzro1lU%3D",
    ITALIAN_COURSE: "https://calendar.google.com/calendar/appointments/AcZssZ0LoGIBYbkMUStTFJnxKM847ncXM2KBwzro1lU%3D"
  }),

  // ---------------------------
  // Optional advanced form server.
  // The old https://app.apll.it server is no longer reachable, so the site
  // uses the local WhatsApp fallback form until a new VPS is online.
  // ---------------------------
  FORM_SERVER: Object.freeze({
    ENABLED: false,
    STATUS_URL: "",
    ADVANCED_FORM_URL: ""
  }),

  // ---------------------------
  // Secure backend calendar booking.
  // Keep ENABLED=false until backend/calendar-api is deployed and configured.
  // The browser calls only these public API endpoints; Google credentials stay
  // on the backend as environment variables.
  // ---------------------------
  CALENDAR_BOOKING: Object.freeze({
    ENABLED: false,
    API_BASE_URL: "https://api.aliperlaliberta.it",
    ENDPOINTS: Object.freeze({
      AVAILABILITY: "/api/calendar/availability",
      BOOK: "/api/calendar/book"
    })
  }),

  // ---------------------------
  // Customer/admin portal API.
  // ---------------------------
  PORTAL_API: Object.freeze({
    API_BASE_URL: "https://api.aliperlaliberta.it/api/portal"
  })
});
