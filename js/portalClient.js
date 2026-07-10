(function () {
  "use strict";

  const cfg = window.APP_CONFIG?.PORTAL_API || {};
  const apiBase = (cfg.API_BASE_URL || "https://api.aliperlaliberta.it/api/portal").replace(/\/+$/, "");
  const initialParams = new URLSearchParams(window.location.search);

  const authPanel = document.getElementById("authPanel");
  const dashboardPanel = document.getElementById("dashboardPanel");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const requestForm = document.getElementById("requestForm");
  const bookingOverlay = document.getElementById("bookingOverlay");
  const bookingClose = document.getElementById("bookingClose");
  const bookingCancel = document.getElementById("bookingCancel");
  const bookingTitle = document.getElementById("bookingTitle");
  const bookingSubtitle = document.getElementById("bookingSubtitle");
  const logoutButton = document.getElementById("logoutButton");
  const refreshButton = document.getElementById("refreshRequests");
  const googleAccess = document.getElementById("googleAccess");
  const appleAccess = document.getElementById("appleAccess");
  const requestsList = document.getElementById("requestsList");
  const clientName = document.getElementById("clientName");
  const roleLabel = document.getElementById("roleLabel");
  const dashboardIntro = document.getElementById("dashboardIntro");

  const stats = {
    open: document.getElementById("statOpen"),
    working: document.getElementById("statWorking"),
    done: document.getElementById("statDone")
  };

  const messages = {
    login: document.getElementById("loginMessage"),
    register: document.getElementById("registerMessage"),
    request: document.getElementById("requestMessage"),
    oauth: document.getElementById("oauthMessage")
  };

  const statusLabels = {
    new: "Nuova",
    in_progress: "In lavorazione",
    waiting_client: "In attesa cliente",
    done: "Chiusa",
    cancelled: "Annullata"
  };

  const statusFlow = ["new", "in_progress", "waiting_client", "done"];
  let currentUser = null;
  let myRequests = [];
  let lastFocused = null;
  let pendingService = normalizeServiceName(initialParams.get("service"));

  function normalizeServiceName(value) {
    return (value || "").replace(/\s+/g, " ").trim().slice(0, 120);
  }

  function formData(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  async function api(path, options = {}) {
    const response = await fetch(`${apiBase}${path}`, {
      credentials: "include",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      ...options
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Operazione non riuscita");
    return data;
  }

  function hasPermission(permission) {
    return Boolean(currentUser?.permissions?.includes(permission));
  }

  function setMessage(target, text, kind = "") {
    if (!target) return;
    target.textContent = text || "";
    target.dataset.kind = kind;
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function meta(label, value) {
    const item = el("div", "portal-meta-item");
    item.append(el("span", "", label));
    item.append(el("strong", "", value || "-"));
    return item;
  }

  function formatDate(value) {
    if (!value) return "-";
    return new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  }

  function showAuth() {
    currentUser = null;
    authPanel.hidden = false;
    dashboardPanel.hidden = true;
    closeBooking();
    if (pendingService) {
      setMessage(messages.oauth, `Accedi o crea un account per prenotare: ${pendingService}.`, "");
    }
  }

  function showDashboard(user) {
    currentUser = user;
    authPanel.hidden = true;
    dashboardPanel.hidden = false;

    const username = user?.username ? ` (@${user.username})` : "";
    clientName.textContent = user?.name ? `Ciao, ${user.name}${username}` : "Area riservata";
    roleLabel.textContent = "Area personale";
    dashboardIntro.textContent = "Prenota un servizio, apri una pratica e segui ogni avanzamento.";
    switchView("servicesView");
  }

  function switchView(viewId) {
    const target = document.getElementById(viewId);
    if (!target) return;
    document.querySelectorAll(".portal-view").forEach((view) => {
      view.hidden = view.id !== viewId;
    });
    document.querySelectorAll("[data-view]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.view === viewId);
    });
  }

  function openBooking(service = "Altro") {
    if (!hasPermission("requests:create")) return;

    const serviceName = normalizeServiceName(service) || "Altro";
    lastFocused = document.activeElement;
    requestForm.reset();
    ensureServiceOption(serviceName);
    requestForm.elements.service.value = serviceName;
    requestForm.elements.subject.value = serviceName === "Altro"
      ? "Nuova richiesta"
      : `Prenotazione servizio ${serviceName}`;
    requestForm.elements.message.value = serviceName === "Altro"
      ? ""
      : `Vorrei prenotare un appuntamento per ${serviceName}.`;
    bookingTitle.textContent = serviceName === "Altro" ? "Apri una nuova pratica" : `Prenota ${serviceName}`;
    bookingSubtitle.textContent = serviceName === "Altro"
      ? "Descrivi cosa ti serve e scegli, se vuoi, una data preferita."
      : "Completa i dettagli: la pratica comparira subito nella tua area.";
    setMessage(messages.request, "");
    bookingOverlay.hidden = false;
    document.body.classList.add("overlay-lock");
    requestForm.elements.message.focus({ preventScroll: true });
  }

  function ensureServiceOption(service) {
    const select = requestForm?.elements?.service;
    if (!select || !service) return;
    const exists = Array.from(select.options).some((option) => option.value === service);
    if (exists) return;

    const option = document.createElement("option");
    option.value = service;
    option.textContent = service;
    select.insertBefore(option, select.firstElementChild);
  }

  function closeBooking() {
    if (!bookingOverlay || bookingOverlay.hidden) return;
    bookingOverlay.hidden = true;
    document.body.classList.remove("overlay-lock");
    lastFocused?.focus?.({ preventScroll: true });
  }

  function buildReturnTo() {
    const target = new URL("/cliente/", window.location.origin);
    if (pendingService) target.searchParams.set("service", pendingService);
    return `${target.pathname}${target.search}`;
  }

  function cleanClientUrl() {
    const clean = `${window.location.pathname}${window.location.hash || ""}`;
    window.history.replaceState({}, document.title, clean);
  }

  function maybeOpenPendingBooking() {
    if (!pendingService || !hasPermission("requests:create")) return;

    const service = pendingService;
    pendingService = "";
    cleanClientUrl();
    openBooking(service);
  }

  function setProviderLink(link, enabled, provider) {
    if (!link) return;
    if (enabled) {
      link.href = `${apiBase}/oauth/${provider}/start?returnTo=${encodeURIComponent(buildReturnTo())}`;
      link.classList.remove("is-disabled");
      link.removeAttribute("aria-disabled");
    } else {
      link.href = "#";
      link.classList.add("is-disabled");
      link.setAttribute("aria-disabled", "true");
    }
  }

  async function loadProviders() {
    try {
      const data = await api("/auth/providers");
      setProviderLink(googleAccess, Boolean(data.providers?.google), "google");
      setProviderLink(appleAccess, Boolean(data.providers?.apple), "apple");
      if (!data.providers?.google && !data.providers?.apple) {
        setMessage(messages.oauth, "Accesso Google/Apple non ancora configurato. Usa il primo accesso manuale.", "");
      }
    } catch (error) {
      setProviderLink(googleAccess, false, "google");
      setProviderLink(appleAccess, false, "apple");
      setMessage(messages.oauth, "Accesso Google/Apple momentaneamente non disponibile.", "error");
    }
  }

  function showOAuthResult() {
    const params = initialParams;
    if (params.get("access") === "error") {
      setMessage(messages.oauth, params.get("reason") || "Accesso non completato.", "error");
    } else if (params.get("access") === "ok") {
      setMessage(messages.oauth, "Accesso completato.", "success");
    }
    if (params.has("access")) {
      cleanClientUrl();
    }
  }

  function switchAuthTab(tab) {
    document.querySelectorAll("[data-auth-tab]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.authTab === tab);
    });
    loginForm.hidden = tab !== "login";
    registerForm.hidden = tab !== "register";
  }

  function renderStats() {
    const open = myRequests.filter((request) => request.status === "new").length;
    const working = myRequests.filter((request) => ["in_progress", "waiting_client"].includes(request.status)).length;
    const done = myRequests.filter((request) => ["done", "cancelled"].includes(request.status)).length;
    stats.open.textContent = String(open);
    stats.working.textContent = String(working);
    stats.done.textContent = String(done);
  }

  function statusTrack(status) {
    const track = el("div", "portal-status-track");
    if (status === "cancelled") {
      track.append(el("span", "is-done", "Creata"));
      track.append(el("span", "is-cancelled", "Annullata"));
      return track;
    }

    const currentIndex = Math.max(0, statusFlow.indexOf(status));
    statusFlow.forEach((item, index) => {
      const step = el("span", index <= currentIndex ? "is-done" : "", statusLabels[item]);
      if (item === status) step.classList.add("is-current");
      track.append(step);
    });
    return track;
  }

  function renderRequests() {
    requestsList.replaceChildren();
    if (!myRequests.length) {
      requestsList.append(el("p", "portal-empty", "Non hai ancora pratiche aperte."));
      return;
    }

    myRequests.forEach((request) => {
      const card = el("article", "portal-request-card");
      const head = el("div", "portal-request-head");
      const title = el("div");
      title.append(el("p", "portal-eyebrow", request.service));
      title.append(el("h3", "", request.subject));
      head.append(title);
      head.append(el("span", `portal-badge portal-badge-${request.status}`, statusLabels[request.status] || request.status));

      const metaRow = el("div", "portal-meta");
      metaRow.append(meta("Data preferita", request.preferredDate));
      metaRow.append(meta("Ora", request.preferredTime));
      metaRow.append(meta("Telefono", request.phone));
      metaRow.append(meta("Aggiornata", formatDate(request.updatedAt)));

      card.append(head);
      card.append(statusTrack(request.status));
      card.append(el("p", "portal-request-text", request.message));
      if (request.adminNote) {
        const note = el("p", "portal-admin-note", request.adminNote);
        note.prepend(el("strong", "", "Nota admin: "));
        card.append(note);
      }
      card.append(metaRow);
      requestsList.append(card);
    });
  }

  async function loadRequests() {
    const data = await api("/requests");
    myRequests = data.requests || [];
    renderRequests();
    renderStats();
  }

  async function loadMe() {
    try {
      const data = await api("/auth/me");
      if (data.user?.role === "admin") {
        window.location.replace("/admin/");
        return;
      }
      if (data.user?.role === "client") {
        showDashboard(data.user);
        await loadRequests();
        maybeOpenPendingBooking();
      } else {
        showAuth();
      }
    } catch (error) {
      showAuth();
    }
  }

  function startService(service) {
    openBooking(service);
  }

  document.querySelectorAll("[data-auth-tab]").forEach((button) => {
    button.addEventListener("click", () => switchAuthTab(button.dataset.authTab));
  });

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });

  document.querySelectorAll("[data-start-service]").forEach((button) => {
    button.addEventListener("click", () => startService(button.dataset.startService));
  });

  document.querySelectorAll("[data-open-booking]").forEach((button) => {
    button.addEventListener("click", () => openBooking(button.dataset.openBooking));
  });

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage(messages.login, "Accesso in corso...");
    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify(formData(loginForm))
      });
      if (data.user?.role === "admin") {
        window.location.replace("/admin/");
        return;
      }
      if (data.user?.role !== "client") throw new Error("Account non abilitato all'area clienti");
      loginForm.reset();
      setMessage(messages.login, "");
      showDashboard(data.user);
      await loadRequests();
      maybeOpenPendingBooking();
    } catch (error) {
      setMessage(messages.login, error.message, "error");
    }
  });

  registerForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage(messages.register, "Creazione account...");
    try {
      const data = await api("/auth/register", {
        method: "POST",
        body: JSON.stringify(formData(registerForm))
      });
      registerForm.reset();
      setMessage(messages.register, "");
      showDashboard(data.user);
      await loadRequests();
      maybeOpenPendingBooking();
    } catch (error) {
      setMessage(messages.register, error.message, "error");
    }
  });

  requestForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage(messages.request, "Apertura pratica...");
    try {
      await api("/requests", {
        method: "POST",
        body: JSON.stringify(formData(requestForm))
      });
      requestForm.reset();
      setMessage(messages.request, "Pratica aperta. Puoi seguirla nella sezione Le mie pratiche.", "success");
      await loadRequests();
      closeBooking();
      switchView("myPracticesView");
    } catch (error) {
      setMessage(messages.request, error.message, "error");
    }
  });

  logoutButton?.addEventListener("click", async () => {
    await api("/auth/logout", { method: "POST", body: "{}" }).catch(() => {});
    showAuth();
  });

  refreshButton?.addEventListener("click", () => {
    loadRequests().catch((error) => setMessage(messages.request, error.message, "error"));
  });

  bookingClose?.addEventListener("click", closeBooking);
  bookingCancel?.addEventListener("click", closeBooking);
  bookingOverlay?.addEventListener("click", (event) => {
    if (event.target === bookingOverlay) closeBooking();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeBooking();
  });

  showOAuthResult();
  loadProviders().finally(() => {
    loadMe();
  });
})();
