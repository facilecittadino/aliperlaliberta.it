(function () {
  "use strict";

  const cfg = window.APP_CONFIG?.PORTAL_API || {};
  const apiBase = (cfg.API_BASE_URL || "https://api.aliperlaliberta.it/api/portal").replace(/\/+$/, "");

  const authPanel = document.getElementById("authPanel");
  const dashboardPanel = document.getElementById("dashboardPanel");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const requestForm = document.getElementById("requestForm");
  const logoutButton = document.getElementById("logoutButton");
  const refreshButton = document.getElementById("refreshRequests");
  const googleAccess = document.getElementById("googleAccess");
  const appleAccess = document.getElementById("appleAccess");
  const requestsList = document.getElementById("requestsList");
  const clientName = document.getElementById("clientName");

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

  function setMessage(target, text, kind = "") {
    if (!target) return;
    target.textContent = text || "";
    target.dataset.kind = kind;
  }

  function showAuth() {
    authPanel.hidden = false;
    dashboardPanel.hidden = true;
  }

  function showDashboard(user) {
    authPanel.hidden = true;
    dashboardPanel.hidden = false;
    const username = user?.username ? ` (@${user.username})` : "";
    clientName.textContent = user?.name ? `Ciao, ${user.name}${username}` : "Area clienti";
  }

  function setProviderLink(link, enabled, provider) {
    if (!link) return;
    if (enabled) {
      link.href = `${apiBase}/oauth/${provider}/start?returnTo=${encodeURIComponent("/cliente/")}`;
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
    const params = new URLSearchParams(window.location.search);
    if (params.get("access") === "error") {
      setMessage(messages.oauth, params.get("reason") || "Accesso non completato.", "error");
    } else if (params.get("access") === "ok") {
      setMessage(messages.oauth, "Accesso completato.", "success");
    }
    if (params.has("access")) {
      const clean = `${window.location.pathname}${window.location.hash || ""}`;
      window.history.replaceState({}, document.title, clean);
    }
  }

  function switchTab(tab) {
    document.querySelectorAll("[data-auth-tab]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.authTab === tab);
    });
    loginForm.hidden = tab !== "login";
    registerForm.hidden = tab !== "register";
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

  function renderRequests(requests) {
    requestsList.replaceChildren();
    if (!requests.length) {
      requestsList.append(el("p", "portal-empty", "Non hai ancora inviato richieste."));
      return;
    }

    requests.forEach((request) => {
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

  async function loadRequests() {
    const data = await api("/requests");
    renderRequests(data.requests || []);
  }

  async function loadMe() {
    try {
      const data = await api("/auth/me");
      if (data.user?.role === "client") {
        showDashboard(data.user);
        await loadRequests();
      } else {
        showAuth();
      }
    } catch (error) {
      showAuth();
    }
  }

  document.querySelectorAll("[data-auth-tab]").forEach((button) => {
    button.addEventListener("click", () => switchTab(button.dataset.authTab));
  });

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage(messages.login, "Accesso in corso...");
    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify(formData(loginForm))
      });
      if (data.user?.role !== "client") throw new Error("Questo account non e cliente");
      loginForm.reset();
      showDashboard(data.user);
      await loadRequests();
      setMessage(messages.login, "");
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
      showDashboard(data.user);
      await loadRequests();
      setMessage(messages.register, "");
    } catch (error) {
      setMessage(messages.register, error.message, "error");
    }
  });

  requestForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage(messages.request, "Invio richiesta...");
    try {
      await api("/requests", {
        method: "POST",
        body: JSON.stringify(formData(requestForm))
      });
      requestForm.reset();
      setMessage(messages.request, "Richiesta inviata.", "success");
      await loadRequests();
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

  showOAuthResult();
  loadProviders();
  loadMe();
})();
