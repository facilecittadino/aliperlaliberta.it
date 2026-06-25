// js/serviceBot.js
(function () {
  "use strict";

  const WHATSAPP_NUMBER = "393318358086";

  const COPY = {
    it: {
      start: "Ti aiuto io. Che tipo di supporto ti serve?",
      questions: {
        service: "Che tipo di supporto ti serve?",
        topic: "Perfetto. Qual è la tua necessità principale?",
        urgency: "Quanto è urgente?",
        name: "Se vuoi, scrivi il tuo nome. Puoi anche lasciare vuoto.",
        details: "Aggiungi qualche dettaglio utile per capire meglio la situazione."
      },
      options: {
        service: ["CAF / tasse / ISEE", "Patronato / pensioni / disoccupazione", "Assistenza legale / documenti", "Corso italiano A1/A2", "Non lo so, ho bisogno di orientamento"],
        topic: ["Documenti o pratica da capire", "Appuntamento o richiesta urgente", "Controllare requisiti e possibilità", "Altro"],
        urgency: ["Oggi / appena possibile", "Questa settimana", "Non è urgente"]
      },
      placeholders: {
        name: "Nome e cognome, se vuoi",
        details: "Esempio: ho bisogno di ISEE, permesso di soggiorno, disoccupazione, documenti..."
      },
      required: "Scrivi almeno qualche dettaglio, così possiamo aiutarti meglio.",
      summaryTitle: "Ho preparato il messaggio per WhatsApp:",
      whatsappText: ({ service, topic, urgency, name, details }) =>
`Ciao Ali Per La Libertà, ho bisogno di orientamento.

• Servizio richiesto: ${service}
• Necessità principale: ${topic}
• Urgenza: ${urgency}
${name ? `• Nome: ${name}\n` : ""}• Dettagli: ${details}

Messaggio preparato dal chatbot del sito.`,
      restart: "Ricomincia"
    },
    sq: {
      start: "Të ndihmoj unë. Çfarë lloj mbështetjeje të duhet?",
      questions: {
        service: "Çfarë lloj mbështetjeje të duhet?",
        topic: "Shumë mirë. Cila është nevoja kryesore?",
        urgency: "Sa urgjente është?",
        name: "Nëse dëshiron, shkruaj emrin. Mund ta lësh edhe bosh.",
        details: "Shto disa detaje të dobishme për të kuptuar më mirë situatën."
      },
      options: {
        service: ["CAF / taksa / ISEE", "Patronato / pensione / papunësi", "Asistencë ligjore / dokumente", "Kurs italisht A1/A2", "Nuk e di, kam nevojë për orientim"],
        topic: ["Dokumente ose praktikë për të kuptuar", "Takim ose kërkesë urgjente", "Të kontrolloj kërkesat dhe mundësitë", "Tjetër"],
        urgency: ["Sot / sa më shpejt", "Këtë javë", "Nuk është urgjente"]
      },
      placeholders: {
        name: "Emri dhe mbiemri, nëse dëshiron",
        details: "Shembull: kam nevojë për ISEE, leje qëndrimi, papunësi, dokumente..."
      },
      required: "Shkruaj të paktën disa detaje, që të mund të të ndihmojmë më mirë.",
      summaryTitle: "E përgatita mesazhin për WhatsApp:",
      whatsappText: ({ service, topic, urgency, name, details }) =>
`Përshëndetje Ali Per La Libertà, kam nevojë për orientim.

• Shërbimi i kërkuar: ${service}
• Nevoja kryesore: ${topic}
• Urgjenca: ${urgency}
${name ? `• Emri: ${name}\n` : ""}• Detaje: ${details}

Mesazh i përgatitur nga chatboti i faqes.`,
      restart: "Rifillo"
    },
    en: {
      start: "I can help. What kind of support do you need?",
      questions: {
        service: "What kind of support do you need?",
        topic: "Great. What is your main need?",
        urgency: "How urgent is it?",
        name: "If you want, write your name. You can also leave it empty.",
        details: "Add a few useful details so we can understand the situation better."
      },
      options: {
        service: ["CAF / taxes / ISEE", "Patronato / pensions / unemployment", "Legal assistance / documents", "Italian course A1/A2", "I’m not sure, I need guidance"],
        topic: ["Understand documents or a procedure", "Appointment or urgent request", "Check requirements and options", "Other"],
        urgency: ["Today / as soon as possible", "This week", "Not urgent"]
      },
      placeholders: {
        name: "Name and surname, if you want",
        details: "Example: I need ISEE, residence permit, unemployment, documents..."
      },
      required: "Please write at least a few details so we can help you better.",
      summaryTitle: "I prepared the WhatsApp message:",
      whatsappText: ({ service, topic, urgency, name, details }) =>
`Hello Ali Per La Libertà, I need guidance.

• Requested service: ${service}
• Main need: ${topic}
• Urgency: ${urgency}
${name ? `• Name: ${name}\n` : ""}• Details: ${details}

Message prepared by the website chatbot.`,
      restart: "Restart"
    }
  };

  const root = document.getElementById("serviceBot");
  if (!root) return;

  const launcherEl = root.querySelector("#serviceBotLauncher");
  const panelEl = root.querySelector("#serviceBotPanel");
  const closeEl = root.querySelector("#serviceBotClose");
  const questionEl = root.querySelector("#serviceBotQuestion");
  const answersEl = root.querySelector("#serviceBotAnswers");
  const formEl = root.querySelector("#serviceBotForm");
  const inputEl = root.querySelector("#serviceBotInput");
  const actionsEl = root.querySelector("#serviceBotActions");
  const restartEl = root.querySelector("#serviceBotRestart");
  const whatsappEl = root.querySelector("#serviceBotWhatsApp");

  const state = {};
  let step = "service";

  function setOpen(isOpen) {
    root.classList.toggle("is-open", isOpen);
    panelEl.hidden = !isOpen;
    launcherEl.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) {
      setTimeout(() => {
        const firstAnswer = answersEl.querySelector("button");
        (firstAnswer || inputEl || closeEl).focus({ preventScroll: true });
      }, 40);
    }
  }

  function lang() {
    const current = window.LanguageSelector?.get?.() || "it";
    return COPY[current] ? current : "it";
  }

  function copy() {
    return COPY[lang()];
  }

  function setQuestion(text) {
    questionEl.textContent = text;
  }

  function clearAnswers() {
    answersEl.innerHTML = "";
  }

  function showOptions(key) {
    const c = copy();
    formEl.hidden = true;
    actionsEl.hidden = true;
    clearAnswers();
    setQuestion(c.questions[key]);

    c.options[key].forEach((label) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "service-bot__answer";
      button.textContent = label;
      button.addEventListener("click", () => {
        state[key] = label;
        if (key === "service") return showOptions("topic");
        if (key === "topic") return showOptions("urgency");
        return showInput("name");
      });
      answersEl.appendChild(button);
    });
  }

  function showInput(key) {
    const c = copy();
    step = key;
    clearAnswers();
    actionsEl.hidden = true;
    formEl.hidden = false;
    inputEl.value = "";
    inputEl.placeholder = c.placeholders[key];
    setQuestion(c.questions[key]);
    inputEl.focus({ preventScroll: true });
  }

  function showSummary() {
    const c = copy();
    const message = c.whatsappText(state);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    clearAnswers();
    formEl.hidden = true;
    actionsEl.hidden = false;
    whatsappEl.href = url;
    setQuestion(`${c.summaryTitle}\n\n${message}`);
  }

  function restart() {
    Object.keys(state).forEach((key) => delete state[key]);
    step = "service";
    showOptions("service");
  }

  formEl.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = inputEl.value.trim();

    if (step === "details" && !value) {
      inputEl.setCustomValidity(copy().required);
      inputEl.reportValidity();
      inputEl.setCustomValidity("");
      return;
    }

    state[step] = value;
    if (step === "name") return showInput("details");
    showSummary();
  });

  restartEl.addEventListener("click", restart);
  launcherEl.addEventListener("click", () => setOpen(panelEl.hidden));
  closeEl.addEventListener("click", () => setOpen(false));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panelEl.hidden) setOpen(false);
  });

  document.addEventListener("language:change", () => {
    const c = copy();
    restartEl.textContent = c.restart;
    if (!state.service) {
      setQuestion(c.start);
      showOptions("service");
    }
  });

  restart();
  setOpen(false);
})();
