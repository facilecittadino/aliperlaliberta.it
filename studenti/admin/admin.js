(() => {
  const apiBase = "https://api.aliperlaliberta.it/api/portal";
  const login = document.querySelector("[data-admin-login]");
  const dashboard = document.querySelector("[data-admin-dashboard]");
  const list = document.querySelector("[data-students]");
  const message = document.querySelector("[data-admin-message]");

  async function api(path, options = {}) {
    const response = await fetch(`${apiBase}${path}`, { credentials: "include", headers: { "Content-Type": "application/json", "Accept": "application/json" }, ...options });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "Operazione non riuscita");
    return body;
  }
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  const date = (value) => value ? new Intl.DateTimeFormat("it-IT", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "-";

  function renderUnitAnswers(item) {
    const entries = Object.entries(item.answers || {}).filter(([, value]) => String(value).trim());
    const answers = entries.length
      ? entries.map(([question, answer]) => `<div class="answer-row"><span>${escapeHtml(question)}</span><p>${escapeHtml(answer)}</p></div>`).join("")
      : '<p class="no-answers">Nessuna risposta scritta in questa unità.</p>';
    return `<article class="student-answer">
      <div class="answer-head"><strong>${escapeHtml(item.level || "A1")} · Unità ${item.unit}</strong><span class="answer-status ${item.completed ? "done" : ""}">${item.completed ? "Completata" : "In corso"}</span></div>
      <div class="unit-answer-list">${answers}</div>
      <small>Ultimo salvataggio: ${date(item.updatedAt)}</small>
    </article>`;
  }

  async function load() {
    message.textContent = "Caricamento…";
    try { const body = await api("/students"); render(body.students || []); message.textContent = ""; }
    catch (error) { message.textContent = error.message; }
  }

  function render(students) {
    if (!students.length) { list.innerHTML = '<div class="waiting-card">Nessuno studente registrato.</div>'; return; }
    list.innerHTML = students.map((student) => {
      const progress = student.progress || [];
      const responseCount = progress.reduce((total, item) => total + Object.values(item.answers || {}).filter((value) => String(value).trim()).length, 0);
      const responses = progress.length ? progress.map(renderUnitAnswers).join("") : '<p class="no-answers">Lo studente non ha ancora salvato risposte.</p>';
      const unitTotal = student.courseLevel === "A2" ? 14 : student.courseLevel === "A1" ? 12 : 0;
      return `<article class="student-admin-card" data-id="${student.id}">
        <div><h3>${escapeHtml(student.name)}</h3><p>${escapeHtml(student.username)} · ${escapeHtml(student.email)}</p><small>${student.completedUnits}/${unitTotal || "-"} unità completate nel livello assegnato</small></div>
        <form><label>Nazionalità<select name="nationality"><option value="Albanese" ${student.nationality === "Albanese" ? "selected" : ""}>Albanese</option><option value="Indiana" ${student.nationality === "Indiana" ? "selected" : ""}>Indiana</option></select></label><label>Livello assegnato<select name="courseLevel"><option value="" ${!student.courseLevel ? "selected" : ""}>Non assegnato</option><option value="A1" ${student.courseLevel === "A1" ? "selected" : ""}>A1</option><option value="A2" ${student.courseLevel === "A2" ? "selected" : ""}>A2</option><option value="B1" ${student.courseLevel === "B1" ? "selected" : ""}>B1</option></select></label><button class="save-button" type="submit">Salva assegnazione</button><p class="save-message"></p></form>
        <details class="answers-panel"><summary>Vedi risposte ed esercizi (${responseCount})</summary><div class="answers-list">${responses}</div></details>
        <button class="danger-button" type="button" data-delete-student>Elimina studente</button>
        <p class="save-message" data-delete-message></p>
      </article>`;
    }).join("");
    document.querySelectorAll(".student-admin-card form").forEach((form) => form.addEventListener("submit", save));
    document.querySelectorAll("[data-delete-student]").forEach((button) => button.addEventListener("click", removeStudent));
  }

  async function removeStudent(event) {
    const card = event.currentTarget.closest("[data-id]");
    const name = card.querySelector("h3").textContent;
    if (!window.confirm(`Eliminare definitivamente lo studente "${name}"? Verranno cancellati anche i suoi progressi ed esercizi salvati.`)) return;
    const status = card.querySelector("[data-delete-message]");
    event.currentTarget.disabled = true;
    status.textContent = "Eliminazione…";
    try {
      await api(`/students/${card.dataset.id}`, { method: "DELETE" });
      card.remove();
    } catch (error) {
      status.textContent = error.message;
      event.currentTarget.disabled = false;
    }
  }

  async function save(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const card = form.closest("[data-id]");
    const status = form.querySelector(".save-message");
    status.textContent = "Salvataggio…";
    try {
      await api(`/students/${card.dataset.id}`, { method: "PATCH", body: JSON.stringify({ nationality: form.elements.nationality.value, courseLevel: form.elements.courseLevel.value }) });
      status.textContent = "Assegnazione salvata.";
    } catch (error) { status.textContent = error.message; }
  }

  async function open(user) { if (user?.role !== "admin") throw new Error("Account non autorizzato"); login.hidden = true; dashboard.hidden = false; await load(); }
  document.querySelector("[data-admin-login-form]").addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget; const status = document.querySelector("[data-admin-login-message]");
    try { const body = await api("/auth/login", { method: "POST", body: JSON.stringify({ identifier: form.elements.identifier.value, password: form.elements.password.value }) }); status.textContent = ""; await open(body.user); }
    catch (error) { status.textContent = error.message; }
  });
  document.querySelector("[data-refresh]").addEventListener("click", load);
  document.querySelector("[data-admin-logout]").addEventListener("click", async () => { await api("/auth/logout", { method: "POST", body: "{}" }).catch(() => {}); dashboard.hidden = true; login.hidden = false; });
  api("/auth/me").then((body) => { if (body.user?.role === "admin") return open(body.user); }).catch(() => {});
})();
