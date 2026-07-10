(function () {
  "use strict";

  const cfg = window.APP_CONFIG?.PORTAL_API || {};
  const apiBase = (cfg.API_BASE_URL || "https://api.aliperlaliberta.it/api/portal").replace(/\/+$/, "");

  const setupPanel = document.getElementById("setupPanel");
  const authPanel = document.getElementById("authPanel");
  const dashboardPanel = document.getElementById("dashboardPanel");
  const setupForm = document.getElementById("setupForm");
  const loginForm = document.getElementById("loginForm");
  const logoutButton = document.getElementById("logoutButton");
  const refreshButton = document.getElementById("refreshRequests");
  const refreshUsersButton = document.getElementById("refreshUsers");
  const statusFilter = document.getElementById("statusFilter");
  const requestsList = document.getElementById("requestsList");
  const usersList = document.getElementById("usersList");
  const statNew = document.getElementById("adminStatNew");
  const statWorking = document.getElementById("adminStatWorking");
  const statDone = document.getElementById("adminStatDone");

  const setupMessage = document.getElementById("setupMessage");
  const loginMessage = document.getElementById("loginMessage");
  let allRequests = [];
  let allUsers = [];

  const statusLabels = {
    new: "Nuova",
    in_progress: "In lavorazione",
    waiting_client: "In attesa cliente",
    done: "Chiusa",
    cancelled: "Annullata"
  };
  const statusFlow = ["new", "in_progress", "waiting_client", "done"];

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

  function showDashboard() {
    authPanel.hidden = true;
    setupPanel.hidden = true;
    dashboardPanel.hidden = false;
    switchView("adminPracticesView");
  }

  function switchView(viewId) {
    const target = document.getElementById(viewId);
    if (!target) return;
    document.querySelectorAll(".portal-view").forEach((view) => {
      view.hidden = view.id !== viewId;
    });
    document.querySelectorAll("[data-admin-view]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.adminView === viewId);
    });
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function field(label, value) {
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

  function renderStats() {
    statNew.textContent = String(allRequests.filter((request) => request.status === "new").length);
    statWorking.textContent = String(allRequests.filter((request) => ["in_progress", "waiting_client"].includes(request.status)).length);
    statDone.textContent = String(allRequests.filter((request) => ["done", "cancelled"].includes(request.status)).length);
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
    const filter = statusFilter.value;
    const requests = filter ? allRequests.filter((request) => request.status === filter) : allRequests;
    requestsList.replaceChildren();

    if (!requests.length) {
      requestsList.append(el("p", "portal-empty", "Nessuna richiesta trovata."));
      return;
    }

    requests.forEach((request) => {
      const card = el("article", "portal-request-card portal-admin-card");
      const head = el("div", "portal-request-head");
      const title = el("div");
      title.append(el("p", "portal-eyebrow", request.service));
      title.append(el("h3", "", request.subject));
      head.append(title);
      head.append(el("span", `portal-badge portal-badge-${request.status}`, statusLabels[request.status] || request.status));

      const customer = request.customer || {};
      const meta = el("div", "portal-meta");
      meta.append(field("Cliente", customer.name));
      meta.append(field("Username", customer.username ? `@${customer.username}` : ""));
      meta.append(field("Email", customer.email));
      meta.append(field("Telefono", request.phone || customer.phone));
      meta.append(field("Data", request.preferredDate));
      meta.append(field("Ora", request.preferredTime));
      meta.append(field("Creata", formatDate(request.createdAt)));

      const controls = el("form", "portal-admin-controls");
      controls.dataset.requestId = request.id;

      const statusLabel = el("label");
      statusLabel.append(el("span", "", "Stato"));
      const select = el("select");
      select.name = "status";
      Object.entries(statusLabels).forEach(([value, label]) => {
        const option = el("option", "", label);
        option.value = value;
        option.selected = value === request.status;
        select.append(option);
      });
      statusLabel.append(select);

      const noteLabel = el("label");
      noteLabel.append(el("span", "", "Nota admin"));
      const note = el("textarea");
      note.name = "adminNote";
      note.rows = 3;
      note.value = request.adminNote || "";
      noteLabel.append(note);

      const button = el("button", "btn btn-primary portal-submit", "Salva");
      button.type = "submit";
      controls.append(statusLabel, noteLabel, button);

      card.append(head);
      card.append(statusTrack(request.status));
      card.append(el("p", "portal-request-text", request.message));
      card.append(meta);
      card.append(controls);
      requestsList.append(card);
    });
  }

  function renderUsers() {
    usersList.replaceChildren();
    if (!allUsers.length) {
      usersList.append(el("p", "portal-empty", "Nessun utente trovato."));
      return;
    }

    allUsers.forEach((user) => {
      const card = el("article", "portal-user-card");
      const title = el("div");
      title.append(el("h3", "", user.name || user.username));
      title.append(el("p", "", `@${user.username} - ${user.email}`));

      const badge = el("span", `portal-badge ${user.role === "admin" ? "portal-badge-in_progress" : "portal-badge-new"}`, user.role);
      const permissions = el("div", "portal-permissions");
      (user.permissions || []).forEach((permission) => {
        permissions.append(el("span", "", permission));
      });

      card.append(title, badge, permissions);
      usersList.append(card);
    });
  }

  async function loadRequests() {
    const data = await api("/requests");
    allRequests = data.requests || [];
    renderStats();
    renderRequests();
  }

  async function loadUsers() {
    const data = await api("/users");
    allUsers = data.users || [];
    renderUsers();
  }

  async function loadSetupStatus() {
    const data = await api("/setup-status");
    setupPanel.hidden = data.adminExists || !data.setupEnabled;
  }

  async function loadMe() {
    try {
      const data = await api("/auth/me");
      if (data.user?.role === "admin") {
        showDashboard();
        await Promise.all([loadRequests(), loadUsers()]);
      } else {
        showAuth();
      }
    } catch (error) {
      showAuth();
    }
  }

  setupForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage(setupMessage, "Creazione admin...");
    try {
      await api("/setup-admin", {
        method: "POST",
        body: JSON.stringify(formData(setupForm))
      });
      setupForm.reset();
      setMessage(setupMessage, "");
      showDashboard();
      await Promise.all([loadRequests(), loadUsers()]);
    } catch (error) {
      setMessage(setupMessage, error.message, "error");
    }
  });

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage(loginMessage, "Accesso in corso...");
    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify(formData(loginForm))
      });
      if (data.user?.role !== "admin") throw new Error("Questo account non e admin");
      loginForm.reset();
      setMessage(loginMessage, "");
      showDashboard();
      await Promise.all([loadRequests(), loadUsers()]);
    } catch (error) {
      setMessage(loginMessage, error.message, "error");
    }
  });

  requestsList?.addEventListener("submit", async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    event.preventDefault();
    const button = form.querySelector("button[type='submit']");
    button.disabled = true;
    try {
      await api(`/requests/${encodeURIComponent(form.dataset.requestId)}`, {
        method: "PATCH",
        body: JSON.stringify(formData(form))
      });
      await loadRequests();
    } catch (error) {
      alert(error.message);
    } finally {
      button.disabled = false;
    }
  });

  logoutButton?.addEventListener("click", async () => {
    await api("/auth/logout", { method: "POST", body: "{}" }).catch(() => {});
    showAuth();
  });

  refreshButton?.addEventListener("click", () => {
    loadRequests().catch((error) => alert(error.message));
  });

  refreshUsersButton?.addEventListener("click", () => {
    loadUsers().catch((error) => alert(error.message));
  });

  statusFilter?.addEventListener("change", renderRequests);

  document.querySelectorAll("[data-admin-view]").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.adminView));
  });

  Promise.all([loadSetupStatus(), loadMe()]).catch(() => showAuth());
})();
