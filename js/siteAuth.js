(function () {
  "use strict";

  const cfg = window.APP_CONFIG?.PORTAL_API || {};
  const apiBase = (cfg.API_BASE_URL || "https://api.aliperlaliberta.it/api/portal").replace(/\/+$/, "");
  const oauthParams = new URLSearchParams(window.location.search);
  const ACTION_PARAM = "apllAction";
  const SERVICE_PARAM = "apllService";
  const KIND_PARAM = "apllKind";

  const statusLabels = {
    new: "Nuova",
    in_progress: "In lavorazione",
    waiting_client: "In attesa cliente",
    done: "Chiusa",
    cancelled: "Annullata"
  };

  let currentUser = null;
  let authOverlay = null;
  let requestOverlay = null;
  let requestsOverlay = null;
  let usersOverlay = null;
  let lastFocused = null;
  let pendingAction = null;
  let clientActionNodes = [];
  let adminActionNodes = [];
  let readyDone = false;
  let readyResolve;

  const ready = new Promise((resolve) => {
    readyResolve = resolve;
  });

  function resolveReady() {
    if (readyDone) return;
    readyDone = true;
    readyResolve(currentUser);
  }

  function normalize(value, max = 120) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
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

  function isClient() {
    return currentUser?.role === "client";
  }

  function isAdmin() {
    return currentUser?.role === "admin";
  }

  function setMessage(node, text, kind = "") {
    if (!node) return;
    node.textContent = text || "";
    node.dataset.kind = kind;
  }

  function setUser(user) {
    currentUser = user || null;
    document.documentElement.classList.toggle("apll-client-authenticated", isClient());
    document.documentElement.classList.toggle("apll-admin-authenticated", isAdmin());
    updateClientActions();
    updateAdminActions();
    document.dispatchEvent(new CustomEvent("apll:auth-change", {
      detail: { user: currentUser }
    }));
  }

  function lockPage(lock) {
    document.body.classList.toggle("overlay-lock", Boolean(lock));
  }

  function hasOpenOverlay() {
    return [authOverlay, requestOverlay, requestsOverlay, usersOverlay].some((overlay) => overlay && !overlay.hidden);
  }

  function cleanOauthUrl() {
    const params = new URLSearchParams(window.location.search);
    ["access", "reason", ACTION_PARAM, SERVICE_PARAM, KIND_PARAM].forEach((key) => {
      params.delete(key);
    });

    const query = params.toString();
    const clean = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash || ""}`;
    window.history.replaceState({}, document.title, clean);
  }

  function buildReturnTo(options = {}) {
    if (options.returnTo) return options.returnTo;

    const url = new URL(window.location.href);
    if (options.action === "request") {
      url.searchParams.set(ACTION_PARAM, "request");
      url.searchParams.set(SERVICE_PARAM, options.serviceName || "Servizio");
      url.searchParams.set(KIND_PARAM, options.calendarKind || "practices");
    }
    return `${url.pathname}${url.search}${url.hash}`;
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function renderDynamicIcons() {
    if (!window.lucide || typeof window.lucide.createIcons !== "function") return;
    window.lucide.createIcons({
      attrs: {
        "stroke-width": 2.2,
        "aria-hidden": "true"
      }
    });
  }

  function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  function metaItem(label, value) {
    const item = el("div", "apll-my-request-meta-item");
    item.append(el("span", "", label));
    item.append(el("strong", "", value || "-"));
    return item;
  }

  function ensureClientActions() {
    if (clientActionNodes.length) return;

    document.querySelectorAll("[data-auth-link]").forEach((authLink) => {
      const item = authLink.closest("li");
      if (!item || !item.parentElement) return;
      if (item.nextElementSibling?.dataset?.clientRequestsItem === "true") return;

      const requestsItem = document.createElement("li");
      requestsItem.className = "apll-client-requests-item";
      requestsItem.dataset.clientRequestsItem = "true";
      requestsItem.hidden = true;

      const button = document.createElement("button");
      button.type = "button";
      button.className = authLink.classList.contains("nav-icon-link")
        ? "nav-icon-link apll-client-requests-link"
        : "apll-client-requests-link apll-client-requests-link--drawer";
      button.setAttribute("aria-label", "Le tue richieste");
      button.setAttribute("title", "Le tue richieste");
      button.innerHTML = `
        <i data-lucide="clipboard-list"></i>
        <span class="apll-client-requests-label">Le tue richieste</span>
      `;
      button.addEventListener("click", () => {
        window.Navbar?.closeDrawer?.();
        openMyRequests();
      });

      requestsItem.append(button);
      item.insertAdjacentElement("afterend", requestsItem);
      clientActionNodes.push(requestsItem);
    });

    renderDynamicIcons();
  }

  function updateClientActions() {
    ensureClientActions();
    const show = isClient();
    clientActionNodes.forEach((node) => {
      node.hidden = !show;
    });
    if (show) renderDynamicIcons();
  }

  function ensureAdminActions() {
    if (adminActionNodes.length) return;

    document.querySelectorAll("[data-auth-link]").forEach((authLink) => {
      const item = authLink.closest("li");
      if (!item || !item.parentElement) return;
      if (item.nextElementSibling?.dataset?.adminUsersItem === "true") return;

      const usersItem = document.createElement("li");
      usersItem.className = "apll-admin-users-item";
      usersItem.dataset.adminUsersItem = "true";
      usersItem.hidden = true;

      const button = document.createElement("button");
      button.type = "button";
      button.className = authLink.classList.contains("nav-icon-link")
        ? "nav-icon-link apll-admin-users-link"
        : "apll-admin-users-link apll-admin-users-link--drawer";
      button.setAttribute("aria-label", "Lista utenti");
      button.setAttribute("title", "Lista utenti");
      button.innerHTML = `
        <i data-lucide="users"></i>
        <span class="apll-admin-users-label">Utenti</span>
      `;
      button.addEventListener("click", () => {
        window.Navbar?.closeDrawer?.();
        openUsersList();
      });

      usersItem.append(button);
      item.insertAdjacentElement("afterend", usersItem);
      adminActionNodes.push(usersItem);
    });

    renderDynamicIcons();
  }

  function updateAdminActions() {
    ensureAdminActions();
    const show = isAdmin();
    adminActionNodes.forEach((node) => {
      node.hidden = !show;
    });
    if (show) renderDynamicIcons();
  }

  function ensureAuthOverlay() {
    if (authOverlay) return authOverlay;

    authOverlay = document.createElement("div");
    authOverlay.className = "apll-auth-overlay";
    authOverlay.hidden = true;
    authOverlay.innerHTML = `
      <section class="apll-auth-dialog" role="dialog" aria-modal="true" aria-labelledby="apllAuthTitle">
        <button class="apll-auth-close" type="button" aria-label="Chiudi">&times;</button>
        <div class="apll-auth-head">
          <span class="apll-auth-kicker">Area cliente</span>
          <h2 id="apllAuthTitle">Accedi per continuare</h2>
          <p id="apllAuthReason">Per usare servizi e assistente serve un account cliente.</p>
        </div>

        <div class="apll-auth-providers" id="apllAuthProviders" hidden>
          <a id="apllGoogleAccess" class="apll-auth-provider" href="#">Continua con Google</a>
          <a id="apllAppleAccess" class="apll-auth-provider" href="#">Continua con Apple</a>
        </div>

        <div class="apll-auth-tabs" role="tablist" aria-label="Accesso cliente">
          <button type="button" class="apll-auth-tab is-active" data-site-auth-tab="login">Login</button>
          <button type="button" class="apll-auth-tab" data-site-auth-tab="register">Primo accesso</button>
        </div>

        <form id="apllSiteLoginForm" class="apll-auth-form" autocomplete="on">
          <label>
            Username o email
            <input name="identifier" type="text" autocomplete="username" required>
          </label>
          <label>
            Password
            <input name="password" type="password" autocomplete="current-password" required>
          </label>
          <button class="btn btn-primary apll-auth-submit" type="submit">Entra</button>
          <p id="apllSiteLoginMessage" class="apll-auth-message" role="status"></p>
        </form>

        <form id="apllSiteRegisterForm" class="apll-auth-form" autocomplete="on" hidden>
          <label>
            Nome e cognome
            <input name="name" type="text" autocomplete="name" required>
          </label>
          <label>
            Username
            <input name="username" type="text" autocomplete="username" minlength="3" maxlength="40" pattern="[A-Za-z0-9._-]+" required>
          </label>
          <label>
            Email
            <input name="email" type="email" autocomplete="email" required>
          </label>
          <label>
            Telefono
            <input name="phone" type="tel" autocomplete="tel">
          </label>
          <label>
            Password
            <input name="password" type="password" autocomplete="new-password" minlength="10" required>
          </label>
          <button class="btn btn-primary apll-auth-submit" type="submit">Crea account</button>
          <p id="apllSiteRegisterMessage" class="apll-auth-message" role="status"></p>
        </form>
      </section>
    `;

    document.body.appendChild(authOverlay);

    const loginForm = authOverlay.querySelector("#apllSiteLoginForm");
    const registerForm = authOverlay.querySelector("#apllSiteRegisterForm");
    const loginMessage = authOverlay.querySelector("#apllSiteLoginMessage");
    const registerMessage = authOverlay.querySelector("#apllSiteRegisterMessage");

    authOverlay.querySelector(".apll-auth-close").addEventListener("click", closeAuth);
    authOverlay.addEventListener("click", (event) => {
      if (event.target === authOverlay) closeAuth();
    });

    authOverlay.querySelectorAll("[data-site-auth-tab]").forEach((button) => {
      button.addEventListener("click", () => switchAuthTab(button.dataset.siteAuthTab));
    });

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      setMessage(loginMessage, "Accesso in corso...");
      try {
        const data = await api("/auth/login", {
          method: "POST",
          body: JSON.stringify(formData(loginForm))
        });
        if (data.user?.role === "admin") {
          loginForm.reset();
          setMessage(loginMessage, "");
          completeAuth(data.user, () => openUsersList());
          return;
        }
        if (data.user?.role !== "client") throw new Error("Account cliente richiesto");
        loginForm.reset();
        setMessage(loginMessage, "");
        completeAuth(data.user);
      } catch (error) {
        setMessage(loginMessage, error.message, "error");
      }
    });

    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      setMessage(registerMessage, "Creazione account...");
      try {
        const data = await api("/auth/register", {
          method: "POST",
          body: JSON.stringify(formData(registerForm))
        });
        if (data.user?.role !== "client") throw new Error("Account cliente richiesto");
        registerForm.reset();
        setMessage(registerMessage, "");
        completeAuth(data.user);
      } catch (error) {
        setMessage(registerMessage, error.message, "error");
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && authOverlay && !authOverlay.hidden) closeAuth();
    });

    loadProviders().catch(() => {});
    return authOverlay;
  }

  function switchAuthTab(tab) {
    if (!authOverlay) return;
    const loginForm = authOverlay.querySelector("#apllSiteLoginForm");
    const registerForm = authOverlay.querySelector("#apllSiteRegisterForm");

    authOverlay.querySelectorAll("[data-site-auth-tab]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.siteAuthTab === tab);
    });
    loginForm.hidden = tab !== "login";
    registerForm.hidden = tab !== "register";
  }

  async function loadProviders() {
    const box = authOverlay?.querySelector("#apllAuthProviders");
    const google = authOverlay?.querySelector("#apllGoogleAccess");
    const apple = authOverlay?.querySelector("#apllAppleAccess");
    if (!box || !google || !apple) return;

    const data = await api("/auth/providers");
    const providers = data.providers || {};
    const returnTo = encodeURIComponent(buildReturnTo(pendingAction?.oauth || {}));

    google.hidden = !providers.google;
    apple.hidden = !providers.apple;
    google.href = providers.google ? `${apiBase}/oauth/google/start?returnTo=${returnTo}` : "#";
    apple.href = providers.apple ? `${apiBase}/oauth/apple/start?returnTo=${returnTo}` : "#";
    box.hidden = !(providers.google || providers.apple);
  }

  function openAuth(options = {}) {
    ensureAuthOverlay();
    lastFocused = document.activeElement;
    pendingAction = options.afterLogin ? {
      run: options.afterLogin,
      oauth: options.oauth || {}
    } : pendingAction;

    const reason = authOverlay.querySelector("#apllAuthReason");
    setMessage(reason, options.reason || "Per usare servizi e assistente serve un account cliente.");
    setMessage(authOverlay.querySelector("#apllSiteLoginMessage"), "");
    setMessage(authOverlay.querySelector("#apllSiteRegisterMessage"), "");
    switchAuthTab(options.tab || "login");
    authOverlay.hidden = false;
    lockPage(true);
    loadProviders().catch(() => {});
    setTimeout(() => {
      authOverlay.querySelector("input")?.focus({ preventScroll: true });
    }, 40);
  }

  function closeAuth() {
    if (!authOverlay || authOverlay.hidden) return;
    authOverlay.hidden = true;
    lockPage(hasOpenOverlay());
    pendingAction = null;
    lastFocused?.focus?.({ preventScroll: true });
  }

  function completeAuth(user, nextAction) {
    setUser(user);
    const action = typeof nextAction === "function" ? nextAction : pendingAction?.run;
    pendingAction = null;
    if (authOverlay) authOverlay.hidden = true;
    lockPage(false);
    document.dispatchEvent(new CustomEvent("apll:client-login", {
      detail: { user: currentUser }
    }));
    if (typeof action === "function") {
      setTimeout(() => action(currentUser), 30);
    }
  }

  async function requireClient(options = {}) {
    if (!readyDone) await ready;
    if (isClient()) {
      options.afterLogin?.(currentUser);
      return currentUser;
    }
    if (isAdmin()) {
      openUsersList();
      return null;
    }
    openAuth(options);
    return null;
  }

  function ensureRequestOverlay() {
    if (requestOverlay) return requestOverlay;

    requestOverlay = document.createElement("div");
    requestOverlay.className = "apll-request-overlay";
    requestOverlay.hidden = true;
    requestOverlay.innerHTML = `
      <section class="apll-request-dialog" role="dialog" aria-modal="true" aria-labelledby="apllRequestTitle">
        <button class="apll-request-close" type="button" aria-label="Chiudi">&times;</button>
        <div class="apll-request-head">
          <span class="apll-auth-kicker">Servizio cliente</span>
          <h2 id="apllRequestTitle">Apri una richiesta</h2>
          <p id="apllRequestSubtitle">La pratica comparira nella tua area cliente.</p>
        </div>
        <form id="apllSiteRequestForm" class="apll-auth-form">
          <label>
            Servizio
            <input name="service" type="text" maxlength="80" required>
          </label>
          <label>
            Oggetto pratica
            <input name="subject" type="text" maxlength="160" required>
          </label>
          <label>
            Cosa ti serve
            <textarea name="message" rows="5" maxlength="3000" required></textarea>
          </label>
          <div class="apll-request-two">
            <label>
              Data preferita
              <input name="preferredDate" type="date">
            </label>
            <label>
              Ora preferita
              <input name="preferredTime" type="time">
            </label>
          </div>
          <label>
            Telefono
            <input name="phone" type="tel" autocomplete="tel">
          </label>
          <div class="apll-request-actions">
            <button class="btn btn-outline" type="button" id="apllRequestCancel">Annulla</button>
            <button class="btn btn-primary" type="submit">Invia richiesta</button>
          </div>
          <p id="apllSiteRequestMessage" class="apll-auth-message" role="status"></p>
          <a class="apll-request-area-link" href="/cliente/">Apri area cliente</a>
        </form>
      </section>
    `;

    document.body.appendChild(requestOverlay);

    requestOverlay.querySelector(".apll-request-close").addEventListener("click", closeRequest);
    requestOverlay.querySelector("#apllRequestCancel").addEventListener("click", closeRequest);
    requestOverlay.addEventListener("click", (event) => {
      if (event.target === requestOverlay) closeRequest();
    });
    requestOverlay.querySelector("#apllSiteRequestForm").addEventListener("submit", submitRequest);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && requestOverlay && !requestOverlay.hidden) closeRequest();
    });

    return requestOverlay;
  }

  function openRequestForm(options = {}) {
    ensureRequestOverlay();
    const serviceName = normalize(options.serviceName || "Servizio", 80);
    const form = requestOverlay.querySelector("#apllSiteRequestForm");
    const title = requestOverlay.querySelector("#apllRequestTitle");
    const subtitle = requestOverlay.querySelector("#apllRequestSubtitle");
    const message = requestOverlay.querySelector("#apllSiteRequestMessage");
    const areaLink = requestOverlay.querySelector(".apll-request-area-link");

    form.reset();
    form.querySelectorAll("input, textarea, button[type='submit']").forEach((node) => {
      node.disabled = false;
    });
    form.elements.service.value = serviceName;
    form.elements.subject.value = `Prenotazione servizio ${serviceName}`;
    form.elements.message.value = `Vorrei prenotare un appuntamento per ${serviceName}.`;
    form.elements.phone.value = currentUser?.phone || "";
    title.textContent = `Prenota ${serviceName}`;
    subtitle.textContent = "Compila i dettagli: la richiesta sara visibile nella tua area cliente.";
    areaLink.hidden = true;
    setMessage(message, "");

    lastFocused = document.activeElement;
    requestOverlay.hidden = false;
    lockPage(true);
    setTimeout(() => {
      form.elements.message.focus({ preventScroll: true });
    }, 40);
  }

  async function openRequest(options = {}) {
    const serviceName = normalize(options.serviceName || "Servizio", 80);
    const calendarKind = normalize(options.calendarKind || "practices", 40);
    if (!isClient()) {
      await requireClient({
        reason: `Accedi per prenotare: ${serviceName}.`,
        oauth: { action: "request", serviceName, calendarKind },
        afterLogin: () => openRequestForm({ serviceName, calendarKind })
      });
      return;
    }
    openRequestForm({ serviceName, calendarKind });
  }

  function closeRequest() {
    if (!requestOverlay || requestOverlay.hidden) return;
    requestOverlay.hidden = true;
    lockPage(hasOpenOverlay());
    lastFocused?.focus?.({ preventScroll: true });
  }

  async function submitRequest(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const message = requestOverlay.querySelector("#apllSiteRequestMessage");
    const submit = form.querySelector("button[type='submit']");
    const areaLink = requestOverlay.querySelector(".apll-request-area-link");
    let sent = false;

    if (!hasPermission("requests:create")) {
      setMessage(message, "Sessione non valida. Accedi di nuovo.", "error");
      await refresh();
      if (!isClient()) openAuth({ reason: "Accedi per inviare la richiesta." });
      return;
    }

    submit.disabled = true;
    setMessage(message, "Invio richiesta...");
    try {
      await api("/requests", {
        method: "POST",
        body: JSON.stringify(formData(form))
      });
      setMessage(message, "Richiesta inviata. Puoi seguirla nella tua area cliente.", "success");
      areaLink.hidden = false;
      sent = true;
      form.querySelectorAll("input, textarea, button[type='submit']").forEach((node) => {
        node.disabled = true;
      });
    } catch (error) {
      setMessage(message, error.message, "error");
    } finally {
      if (!sent) submit.disabled = false;
    }
  }

  function ensureRequestsOverlay() {
    if (requestsOverlay) return requestsOverlay;

    requestsOverlay = document.createElement("div");
    requestsOverlay.className = "apll-requests-overlay";
    requestsOverlay.hidden = true;
    requestsOverlay.innerHTML = `
      <section class="apll-requests-dialog" role="dialog" aria-modal="true" aria-labelledby="apllRequestsTitle">
        <button class="apll-requests-close" type="button" aria-label="Chiudi">&times;</button>
        <h2 id="apllRequestsTitle" class="sr-only">Le tue richieste</h2>
        <div id="apllRequestsList" class="apll-my-requests-list"></div>
      </section>
    `;

    document.body.appendChild(requestsOverlay);

    requestsOverlay.querySelector(".apll-requests-close").addEventListener("click", closeMyRequests);
    requestsOverlay.addEventListener("click", (event) => {
      if (event.target === requestsOverlay) closeMyRequests();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && requestsOverlay && !requestsOverlay.hidden) closeMyRequests();
    });

    renderDynamicIcons();
    return requestsOverlay;
  }

  function renderMyRequests(requests) {
    const list = requestsOverlay.querySelector("#apllRequestsList");
    list.replaceChildren();

    if (!requests.length) {
      const empty = el("div", "apll-my-requests-empty");
      empty.append(el("h3", "", "Nessuna richiesta aperta"));
      empty.append(el("p", "", "Quando prenoti un servizio dal sito, la richiesta comparira qui."));
      list.append(empty);
      return;
    }

    requests.forEach((request) => {
      const card = el("article", "apll-my-request-card");
      const head = el("div", "apll-my-request-head");
      const title = el("div");
      title.append(el("p", "apll-my-request-service", request.service || "Servizio"));
      title.append(el("h3", "", request.subject || "Richiesta"));
      head.append(title);
      head.append(el("span", `apll-my-request-status apll-status-${request.status || "new"}`, statusLabels[request.status] || request.status || "Nuova"));

      const details = el("div", "apll-my-request-meta");
      details.append(metaItem("Data preferita", request.preferredDate));
      details.append(metaItem("Ora", request.preferredTime));
      details.append(metaItem("Telefono", request.phone));
      details.append(metaItem("Aggiornata", formatDate(request.updatedAt)));

      card.append(head);
      card.append(el("p", "apll-my-request-text", request.message || ""));
      if (request.adminNote) {
        const note = el("p", "apll-my-request-note", request.adminNote);
        note.prepend(el("strong", "", "Nota admin: "));
        card.append(note);
      }
      card.append(details);
      list.append(card);
    });
  }

  async function loadMyRequests() {
    if (!requestsOverlay) return;
    const list = requestsOverlay.querySelector("#apllRequestsList");
    list.replaceChildren();
    const loading = el("div", "apll-my-requests-empty");
    loading.append(el("p", "", "Caricamento richieste..."));
    list.append(loading);

    try {
      const data = await api("/requests");
      renderMyRequests(Array.isArray(data.requests) ? data.requests : []);
    } catch (error) {
      list.replaceChildren();
      const errorBox = el("div", "apll-my-requests-empty apll-my-requests-empty--error");
      errorBox.append(el("p", "", error.message));
      list.append(errorBox);
    }
  }

  async function openMyRequests() {
    if (!isClient()) {
      await requireClient({
        reason: "Accedi per vedere le tue richieste.",
        afterLogin: () => openMyRequests()
      });
      return;
    }

    ensureRequestsOverlay();
    lastFocused = document.activeElement;
    requestsOverlay.hidden = false;
    lockPage(true);
    loadMyRequests();
  }

  function closeMyRequests() {
    if (!requestsOverlay || requestsOverlay.hidden) return;
    requestsOverlay.hidden = true;
    lockPage(hasOpenOverlay());
    lastFocused?.focus?.({ preventScroll: true });
  }

  function ensureUsersOverlay() {
    if (usersOverlay) return usersOverlay;

    usersOverlay = document.createElement("div");
    usersOverlay.className = "apll-users-overlay";
    usersOverlay.hidden = true;
    usersOverlay.innerHTML = `
      <section class="apll-users-dialog" role="dialog" aria-modal="true" aria-labelledby="apllUsersTitle">
        <button class="apll-users-close" type="button" aria-label="Chiudi">&times;</button>
        <h2 id="apllUsersTitle" class="sr-only">Lista utenti</h2>
        <div id="apllUsersList" class="apll-users-list"></div>
      </section>
    `;

    document.body.appendChild(usersOverlay);

    usersOverlay.querySelector(".apll-users-close").addEventListener("click", closeUsersList);
    usersOverlay.addEventListener("click", (event) => {
      if (event.target === usersOverlay) closeUsersList();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && usersOverlay && !usersOverlay.hidden) closeUsersList();
    });

    renderDynamicIcons();
    return usersOverlay;
  }

  function userMeta(label, value) {
    const item = el("div", "apll-user-list-meta-item");
    item.append(el("span", "", label));
    item.append(el("strong", "", value || "-"));
    return item;
  }

  function roleLabel(role) {
    return role === "admin" ? "Admin" : "Cliente";
  }

  function renderUsersList(users) {
    const list = usersOverlay.querySelector("#apllUsersList");
    list.replaceChildren();

    if (!users.length) {
      const empty = el("div", "apll-users-empty");
      empty.append(el("h3", "", "Nessun utente registrato"));
      list.append(empty);
      return;
    }

    users.forEach((user) => {
      const card = el("article", "apll-user-list-card");
      const head = el("div", "apll-user-list-head");
      const title = el("div");
      title.append(el("h3", "", user.name || user.username || user.email || "Utente"));
      title.append(el("p", "", user.email || "-"));
      head.append(title);
      head.append(el("span", `apll-user-role apll-user-role-${user.role || "client"}`, roleLabel(user.role)));

      const permissions = Array.isArray(user.permissions) && user.permissions.length
        ? user.permissions.join(", ")
        : "-";
      const providers = Array.isArray(user.providers) && user.providers.length
        ? user.providers.join(", ")
        : "manuale";

      const meta = el("div", "apll-user-list-meta");
      meta.append(userMeta("Username", user.username));
      meta.append(userMeta("Telefono", user.phone));
      meta.append(userMeta("Permessi", permissions));
      meta.append(userMeta("Accesso", providers));
      meta.append(userMeta("Creato", formatDate(user.createdAt)));

      card.append(head);
      card.append(meta);
      list.append(card);
    });
  }

  async function loadUsersList() {
    if (!usersOverlay) return;
    const list = usersOverlay.querySelector("#apllUsersList");
    list.replaceChildren();
    const loading = el("div", "apll-users-empty");
    loading.append(el("p", "", "Caricamento utenti..."));
    list.append(loading);

    try {
      const data = await api("/users");
      renderUsersList(Array.isArray(data.users) ? data.users : []);
    } catch (error) {
      list.replaceChildren();
      const errorBox = el("div", "apll-users-empty apll-users-empty--error");
      errorBox.append(el("p", "", error.message));
      list.append(errorBox);
    }
  }

  async function openUsersList() {
    if (!isAdmin()) {
      await openAuth({
        reason: "Accedi con le credenziali admin per vedere la lista utenti.",
        afterLogin: () => openUsersList()
      });
      return;
    }

    ensureUsersOverlay();
    lastFocused = document.activeElement;
    usersOverlay.hidden = false;
    lockPage(true);
    loadUsersList();
  }

  function closeUsersList() {
    if (!usersOverlay || usersOverlay.hidden) return;
    usersOverlay.hidden = true;
    lockPage(hasOpenOverlay());
    lastFocused?.focus?.({ preventScroll: true });
  }

  async function refresh() {
    try {
      const data = await api("/auth/me");
      setUser(data.user || null);
    } catch {
      setUser(null);
    } finally {
      resolveReady();
    }
    return currentUser;
  }

  function wireLinks() {
    document.addEventListener("click", (event) => {
      const link = event.target.closest?.("[data-auth-link]");
      if (!link) return;
      if (isClient()) return;
      event.preventDefault();
      requireClient({
        reason: "Accedi per aprire la tua area cliente.",
        oauth: { returnTo: "/cliente/" },
        afterLogin: () => {
          window.location.href = link.href;
        }
      });
    });
  }

  function handleOauthReturn() {
    const action = oauthParams.get(ACTION_PARAM);
    const serviceName = oauthParams.get(SERVICE_PARAM);
    const calendarKind = oauthParams.get(KIND_PARAM);
    const oauthError = oauthParams.get("access") === "error";

    if (oauthError) {
      openAuth({
        reason: oauthParams.get("reason") || "Accesso non completato. Riprova."
      });
      cleanOauthUrl();
      return;
    }

    if (action === "request" && serviceName) {
      ready.then(() => {
        if (isClient()) {
          openRequestForm({ serviceName, calendarKind });
          cleanOauthUrl();
        }
      });
    } else if (oauthParams.has("access")) {
      cleanOauthUrl();
    }
  }

  window.apllAuth = {
    ready,
    refresh,
    getUser: () => currentUser,
    isClient,
    isAdmin,
    requireClient,
    open: openAuth,
    close: closeAuth,
    openRequest,
    openRequestForm,
    openMyRequests,
    openUsersList
  };

  wireLinks();
  refresh().then(handleOauthReturn);
})();
