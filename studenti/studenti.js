(() => {
  const apiBase = "https://api.aliperlaliberta.it/api/portal";
  const authPanel = document.querySelector("[data-auth-panel]");
  const dashboard = document.querySelector("[data-dashboard]");
  const waiting = document.querySelector("[data-waiting]");
  const coursePanel = document.querySelector("[data-course]");
  const dashboardMessage = document.querySelector("[data-dashboard-message]");
  let course = null;
  let progress = [];
  let installPrompt = null;

  const languageUi = {
    albanese: {
      label: "Italiano con spiegazioni e traduzioni in albanese",
      support: "Shpjegimi në shqip",
      instruction: "Plotëso ushtrimet drejtpërdrejt në faqe dhe ruaj përgjigjet.",
      vocabularyHeaders: ["Italiano", "Shqip"]
    },
    hindi: {
      label: "Italiano con pronuncia in devanagari e spiegazioni in hindi",
      support: "हिंदी में व्याख्या",
      instruction: "अभ्यास सीधे पेज पर पूरा करें और उत्तर सेव करें।",
      vocabularyHeaders: ["Italiano", "Pronuncia", "हिंदी"]
    }
  };

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[char]);

  async function api(path, options = {}) {
    const response = await fetch(`${apiBase}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json", "Accept": "application/json", ...(options.headers || {}) },
      ...options
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "Operazione non riuscita");
    return body;
  }

  const courseLevel = () => String(course?.level || "A1").toLowerCase();
  const audioUrl = (filename) => `${apiBase}/courses/${courseLevel()}/materials/audio/${encodeURIComponent(filename)}`;
  const savedFor = (unit) => progress.find((item) => item.unit === unit) || { answers: {}, completed: false };

  function updateProgress() {
    const completed = progress.filter((item) => item.completed).length;
    document.querySelector("[data-progress-count]").textContent = `${completed}/${course.unitCount} unità`;
    document.querySelector("[data-progress-bar]").style.width = `${Math.round(completed / course.unitCount * 100)}%`;
  }

  function answerField(section, number, prompt, savedAnswers, multiline = false, locked = false) {
    const key = `${section} ${number} - ${prompt}`;
    const value = savedAnswers?.[key] || "";
    const disabled = locked ? "disabled" : "";
    const control = multiline
      ? `<textarea rows="6" data-answer-key="${escapeHtml(key)}" ${disabled}>${escapeHtml(value)}</textarea>`
      : `<input type="text" data-answer-key="${escapeHtml(key)}" value="${escapeHtml(value)}" autocomplete="off" ${disabled}>`;
    return `<label class="answer-field"><span><b>${number}.</b> ${escapeHtml(prompt)}</span>${control}</label>`;
  }

  function vocabularyTable(rows, language) {
    const ui = languageUi[language];
    const headers = ui.vocabularyHeaders.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
    const body = rows.map(([italian, albanian, pronunciation, hindi]) => {
      const cells = language === "hindi" ? [italian, pronunciation, hindi] : [italian, albanian];
      return `<tr>${cells.map((cell, index) => `<td${index === 0 ? ' lang="it"' : ""}>${escapeHtml(cell)}</td>`).join("")}</tr>`;
    }).join("");
    return `<div class="table-scroll"><table class="vocabulary-table"><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table></div>`;
  }

  function renderUnit(unit) {
    const content = unit.content;
    const saved = savedFor(unit.number);
    const locked = Boolean(saved.completed);
    const language = course.language;
    const ui = languageUi[language] || languageUi.hindi;
    const readingFields = content.reading.questions.map((question, index) => answerField("Lettura", index + 1, question, saved.answers, false, locked)).join("");
    const listening = content.listening.map((track, trackIndex) => {
      const fields = track.questions.map((question, index) => answerField(`Ascolto ${trackIndex + 1}`, index + 1, question, saved.answers, false, locked)).join("");
      return `<section class="audio-card">
        <div class="audio-title"><span>Audio ${trackIndex + 1}</span><strong>${escapeHtml(track.title)}</strong></div>
        <audio controls controlsList="nodownload noplaybackrate" disablePictureInPicture preload="none" crossorigin="use-credentials"><source src="${audioUrl(track.file)}" type="audio/mpeg"></audio>
        <p class="support-note">Ascolta due volte: prima comprendi la situazione, poi rispondi.</p>
        <div class="answer-grid">${fields}</div>
      </section>`;
    }).join("");
    const grammarFields = content.grammarExercises.map((exercise, index) => answerField("Grammatica", index + 1, exercise, saved.answers, false, locked)).join("");
    const writingField = answerField("Produzione scritta", 1, content.writing, saved.answers, true, locked);
    const savePanel = locked
      ? `<div class="save-panel is-locked">
          <p class="locked-note">🔒 Hai già inviato questa unità: le risposte sono salvate e non sono più modificabili.</p>
        </div>`
      : `<div class="save-panel">
          <label class="complete-check"><input type="checkbox" name="completed"><span>Ho completato l’unità e tutti gli esercizi. (Dopo il salvataggio non sarà più modificabile)</span></label>
          <button class="save-button" type="submit">Salva tutte le risposte</button>
          <p class="save-message" aria-live="polite"></p>
        </div>`;

    return `<article class="unit-card ${locked ? "is-complete" : ""}" data-unit="${unit.number}">
      <button class="unit-heading" type="button" aria-expanded="false">
        <span class="unit-number">Unità ${unit.number}</span>
        <span><strong>${escapeHtml(content.title)}</strong><small>${escapeHtml(content.lessons)} · ${escapeHtml(content.subtitle)}</small></span>
        <span class="chevron" aria-hidden="true">⌄</span>
      </button>
      <div class="unit-content" hidden>
        <div class="lesson-intro"><p>${escapeHtml(content.introduction[language])}</p><small>${escapeHtml(ui.instruction)}</small></div>

        <section class="lesson-section"><h4><span>1</span> Obiettivi</h4><ul>${content.objectives.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>

        <section class="lesson-section grammar-box"><h4><span>2</span> Grammatica</h4><p lang="it">${escapeHtml(content.grammar.it)}</p><p class="translation"><b>${escapeHtml(ui.support)}:</b> ${escapeHtml(content.grammar[language])}</p></section>

        <section class="lesson-section"><h4><span>3</span> Vocabolario bilingue</h4>${vocabularyTable(content.vocabulary, language)}</section>

        <section class="lesson-section dialogue-box"><h4><span>4</span> Dialogo</h4><div class="dialogue">${content.dialogue.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}</div><p class="activity-tip">Leggete a coppie e poi cambiate nomi, luoghi, orari o prodotti.</p></section>

        <form class="exercise-form">
          <section class="lesson-section reading-box"><h4><span>5</span> Comprensione della lettura</h4><div class="reading-text" lang="it">${escapeHtml(content.reading.text)}</div><div class="answer-grid">${readingFields}</div></section>

          <section class="lesson-section"><h4><span>6</span> Ascolto ed esercizi</h4>${listening}</section>

          <section class="lesson-section"><h4><span>7</span> Esercizi di grammatica</h4><div class="answer-grid">${grammarFields}</div></section>

          <section class="lesson-section"><h4><span>8</span> Produzione scritta</h4>${writingField}</section>

          <section class="lesson-section oral-box"><h4><span>9</span> Conversazione e attività a coppie</h4><ol>${content.oral.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol><p><b>Compito:</b> ${escapeHtml(content.task)}</p></section>

          <section class="lesson-section mini-test"><h4><span>10</span> Mini-prova</h4><ol>${content.miniTest.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol></section>

          ${savePanel}
        </form>
      </div>
    </article>`;
  }

  function renderCourse() {
    const ui = languageUi[course.language] || languageUi.hindi;
    document.querySelector("[data-course-level]").textContent = course.level;
    document.querySelector("[data-course-title]").textContent = course.title;
    document.querySelector("[data-course-units]").textContent = `${course.unitCount} unità interattive`;
    document.querySelector("[data-language-label]").textContent = ui.label;
    document.querySelector("[data-units]").innerHTML = course.units.map(renderUnit).join("");
    const finalTestLink = document.querySelector("[data-final-test-link]");
    const finalTestTitle = document.querySelector("[data-final-test-title]");
    finalTestLink.href = `/quiz-italiano/${courseLevel()}/`;
    finalTestLink.textContent = `Inizia il test finale ${course.level}`;
    finalTestTitle.textContent = `Test finale ${course.level}`;
    updateProgress();

    document.querySelectorAll(".unit-heading").forEach((button) => button.addEventListener("click", () => {
      const content = button.nextElementSibling;
      const open = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!open));
      content.hidden = open;
      if (!open) button.closest(".unit-card").scrollIntoView({ behavior: "smooth", block: "start" });
    }));
    document.querySelectorAll(".exercise-form").forEach((form) => form.addEventListener("submit", saveExercise));
  }

  async function saveExercise(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const card = form.closest("[data-unit]");
    const unit = Number(card.dataset.unit);
    const message = form.querySelector(".save-message");
    const button = form.querySelector(".save-button");
    const answers = {};
    form.querySelectorAll("[data-answer-key]").forEach((field) => { answers[field.dataset.answerKey] = field.value.trim(); });
    button.disabled = true;
    message.textContent = "Salvataggio in corso…";
    try {
      const body = await api(`/courses/${courseLevel()}/progress/${unit}`, {
        method: "PUT",
        body: JSON.stringify({ answers, completed: form.elements.completed.checked })
      });
      progress = progress.filter((item) => item.unit !== unit);
      progress.push(body.progress);
      card.classList.toggle("is-complete", body.progress.completed);
      updateProgress();
      message.textContent = "Tutte le risposte sono state salvate. L’insegnante può vederle.";
    } catch (error) {
      message.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  }

  async function openDashboard(user) {
    authPanel.hidden = true;
    dashboard.hidden = false;
    document.querySelector("[data-greeting]").textContent = `Benvenuto, ${user.name}`;
    document.querySelector("[data-course-status]").textContent = user.courseLevel
      ? `Livello assegnato: ${user.courseLevel} · Nazionalità: ${user.nationality}`
      : `Nazionalità: ${user.nationality}`;
    if (!["A1", "A2"].includes(user.courseLevel)) {
      waiting.hidden = false;
      coursePanel.hidden = true;
      document.querySelector("[data-waiting-title]").textContent = user.courseLevel ? `Materiale ${user.courseLevel} in preparazione` : "Il tuo livello deve essere assegnato";
      document.querySelector("[data-waiting-text]").textContent = user.courseLevel
        ? "L’insegnante ha assegnato il livello. Le lezioni saranno visibili quando il corso bilingue sarà pubblicato."
        : "L’insegnante controllerà la registrazione e abiliterà il materiale corretto per la tua nazionalità.";
      return;
    }
    waiting.hidden = true;
    coursePanel.hidden = false;
    dashboardMessage.textContent = "Caricamento delle lezioni…";
    const level = user.courseLevel.toLowerCase();
    const [courseBody, progressBody] = await Promise.all([api(`/courses/${level}`), api(`/courses/${level}/progress`)]);
    course = courseBody.course;
    progress = progressBody.progress || [];
    renderCourse();
    dashboardMessage.textContent = "";
  }

  function showAuth(kind) {
    document.querySelector("[data-login-section]").hidden = kind !== "login";
    document.querySelector("[data-register-section]").hidden = kind !== "register";
    document.querySelectorAll("[data-auth-tab]").forEach((button) => button.classList.toggle("is-active", button.dataset.authTab === kind));
  }

  document.querySelectorAll("[data-auth-tab]").forEach((button) => button.addEventListener("click", () => showAuth(button.dataset.authTab)));
  document.querySelector("[data-login-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const message = document.querySelector("[data-login-message]");
    message.textContent = "Accesso in corso…";
    try {
      const body = await api("/auth/login", { method: "POST", body: JSON.stringify({ identifier: form.elements.identifier.value.trim(), password: form.elements.password.value }) });
      message.textContent = "";
      await openDashboard(body.user);
    } catch (error) { message.textContent = error.message; }
  });
  document.querySelector("[data-register-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const message = document.querySelector("[data-register-message]");
    message.textContent = "Registrazione in corso…";
    try {
      const body = await api("/students/register", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      message.textContent = "";
      await openDashboard(body.user);
    } catch (error) { message.textContent = error.message; }
  });
  document.querySelector("[data-logout]").addEventListener("click", async () => {
    await api("/auth/logout", { method: "POST", body: "{}" }).catch(() => {});
    document.querySelectorAll("audio").forEach((audio) => audio.pause());
    dashboard.hidden = true;
    authPanel.hidden = false;
    showAuth("login");
  });
  document.querySelector("[data-recheck]").addEventListener("click", async () => { const body = await api("/auth/me"); await openDashboard(body.user); });
  window.addEventListener("beforeinstallprompt", (event) => { event.preventDefault(); installPrompt = event; document.querySelector("[data-install]").hidden = false; });
  document.querySelector("[data-install]").addEventListener("click", async () => { if (!installPrompt) return; await installPrompt.prompt(); installPrompt = null; document.querySelector("[data-install]").hidden = true; });
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js");
  api("/auth/me").then((body) => { if (body.user) return openDashboard(body.user); }).catch(() => {});
})();
