// js/calendarBooking.js
(function () {
  "use strict";

  const cfg = () => window.APP_CONFIG?.CALENDAR_BOOKING || {};
  const state = {
    serviceName: "Servizio",
    calendarKind: "practices",
    selectedDate: "",
    selectedSlot: null
  };

  let overlay;

  function apiUrl(endpointKey) {
    const base = (cfg().API_BASE_URL || "").replace(/\/+$/, "");
    const path = cfg().ENDPOINTS?.[endpointKey] || "";
    return `${base}${path}`;
  }

  function todayIso() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }

  function addDaysIso(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }

  function createOverlay() {
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.className = "calendar-booking-overlay";
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="calendar-booking-dialog" role="dialog" aria-modal="true" aria-labelledby="calendarBookingTitle">
        <button class="calendar-booking-close" type="button" aria-label="Chiudi">×</button>
        <div class="calendar-booking-head">
          <span class="calendar-booking-kicker">Prenotazione sicura</span>
          <h2 id="calendarBookingTitle">Prenota appuntamento</h2>
          <p id="calendarBookingService">Servizio</p>
        </div>

        <div class="calendar-booking-step">
          <label for="calendarBookingDate">Scegli una data</label>
          <input id="calendarBookingDate" type="date" />
        </div>

        <div class="calendar-booking-step">
          <p class="calendar-booking-label">Orari disponibili</p>
          <div class="calendar-booking-slots" id="calendarBookingSlots">
            <span class="calendar-booking-muted">Seleziona una data per vedere gli orari.</span>
          </div>
        </div>

        <form id="calendarBookingForm" class="calendar-booking-form">
          <label>
            Nome e cognome
            <input name="name" autocomplete="name" required />
          </label>
          <label>
            Email
            <input name="email" type="email" autocomplete="email" required />
          </label>
          <label>
            Telefono / WhatsApp
            <input name="phone" type="tel" autocomplete="tel" required />
          </label>
          <label>
            Note
            <textarea name="notes" rows="3" placeholder="Scrivi eventuali dettagli utili"></textarea>
          </label>
          <button class="btn btn-primary" type="submit">Conferma prenotazione</button>
          <p class="calendar-booking-privacy">
            I dati vengono inviati al backend sicuro solo per gestire la prenotazione.
          </p>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector(".calendar-booking-close").addEventListener("click", close);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close();
    });
    overlay.querySelector("#calendarBookingDate").addEventListener("change", (event) => {
      state.selectedDate = event.currentTarget.value;
      state.selectedSlot = null;
      loadAvailability();
    });
    overlay.querySelector("#calendarBookingForm").addEventListener("submit", submitBooking);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && overlay && !overlay.hidden) close();
    });

    return overlay;
  }

  function open({ serviceName, calendarKind }) {
    createOverlay();

    state.serviceName = serviceName || "Servizio";
    state.calendarKind = calendarKind || "practices";
    state.selectedDate = todayIso();
    state.selectedSlot = null;

    overlay.querySelector("#calendarBookingService").textContent = state.serviceName;
    const dateInput = overlay.querySelector("#calendarBookingDate");
    dateInput.min = todayIso();
    dateInput.max = addDaysIso(60);
    dateInput.value = state.selectedDate;

    overlay.hidden = false;
    document.body.classList.add("calendar-booking-lock");
    loadAvailability();
  }

  function close() {
    if (!overlay) return;
    overlay.hidden = true;
    document.body.classList.remove("calendar-booking-lock");
  }

  function setSlotsStatus(message) {
    overlay.querySelector("#calendarBookingSlots").innerHTML =
      `<span class="calendar-booking-muted">${message}</span>`;
  }

  async function loadAvailability() {
    if (!state.selectedDate) return;
    setSlotsStatus("Caricamento orari disponibili…");

    const url = new URL(apiUrl("AVAILABILITY"));
    url.searchParams.set("kind", state.calendarKind);
    url.searchParams.set("date", state.selectedDate);
    url.searchParams.set("service", state.serviceName);

    try {
      const res = await fetch(url.toString(), {
        method: "GET",
        headers: { "Accept": "application/json" },
        credentials: "omit"
      });
      if (!res.ok) throw new Error(`Availability failed: ${res.status}`);
      const data = await res.json();
      renderSlots(Array.isArray(data.slots) ? data.slots : []);
    } catch (error) {
      console.error("[calendarBooking] availability error", error);
      setSlotsStatus("Non riesco a caricare gli orari. Riprova più tardi o contattaci su WhatsApp.");
    }
  }

  function renderSlots(slots) {
    const box = overlay.querySelector("#calendarBookingSlots");
    if (!slots.length) {
      setSlotsStatus("Nessun orario disponibile per questa data.");
      return;
    }

    box.innerHTML = "";
    slots.forEach((slot) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "calendar-booking-slot";
      btn.textContent = slot.label || slot.start;
      btn.addEventListener("click", () => {
        state.selectedSlot = slot;
        box.querySelectorAll(".calendar-booking-slot").forEach((el) => {
          el.classList.toggle("is-selected", el === btn);
        });
      });
      box.appendChild(btn);
    });
  }

  async function submitBooking(event) {
    event.preventDefault();
    if (!state.selectedSlot) {
      alert("Seleziona prima un orario disponibile.");
      return;
    }

    const form = event.currentTarget;
    const submit = form.querySelector("button[type='submit']");
    const data = new FormData(form);
    const payload = {
      kind: state.calendarKind,
      service: state.serviceName,
      slot: state.selectedSlot,
      customer: {
        name: String(data.get("name") || "").trim(),
        email: String(data.get("email") || "").trim(),
        phone: String(data.get("phone") || "").trim()
      },
      notes: String(data.get("notes") || "").trim(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Rome"
    };

    submit.disabled = true;
    submit.textContent = "Invio in corso…";

    try {
      const res = await fetch(apiUrl("BOOK"), {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        credentials: "omit",
        body: JSON.stringify(payload)
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || `Booking failed: ${res.status}`);

      alert("Prenotazione inviata. Ti contatteremo per conferma.");
      form.reset();
      close();
    } catch (error) {
      console.error("[calendarBooking] booking error", error);
      alert("Non riesco a completare la prenotazione. Riprova più tardi o contattaci su WhatsApp.");
    } finally {
      submit.disabled = false;
      submit.textContent = "Conferma prenotazione";
    }
  }

  window.apllCalendarBooking = { open };
})();
