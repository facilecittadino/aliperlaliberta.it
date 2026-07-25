// js/serviceBot.js
(function () {
  "use strict";

  const cfg = window.APP_CONFIG?.PORTAL_API || {};
  const apiBase = (cfg.API_BASE_URL || "https://api.aliperlaliberta.it/api/portal").replace(/\/+$/, "");
  const WHATSAPP_NUMBER = "393513657045";
  const SERVICE_KEYS = ["caf", "patronato", "legal", "italianCourse", "orientation"];
  const SERVICE_KEYWORDS = {
    caf: ["isee", "730", "f24", "caf", "tasse", "tax", "bonus", "reddito", "dichiarazione", "cu", "imu", "dsu"],
    patronato: ["naspi", "pensione", "pension", "disoccup", "invalid", "matern", "inail", "assegno", "patronato", "contribut"],
    legal: ["permesso", "soggiorno", "questura", "prefettura", "ricongiung", "cittadinanza", "passaporto", "documento", "legal", "legale", "avvoc", "kit"],
    italianCourse: ["italiano", "italian", "a1", "a2", "lingua", "corso", "course", "esame"]
  };

  const DOCS = {
    it: {
      caf: [
        "Documento di identita e codice fiscale di chi richiede il servizio.",
        "Tessera sanitaria/codice fiscale dei familiari interessati.",
        "Permesso di soggiorno o ricevuta, se sei cittadino extra UE.",
        "Per ISEE: redditi, saldo e giacenza media dei conti, eventuali immobili, affitto o mutuo, veicoli e certificazioni di invalidita se presenti.",
        "Per 730 o dichiarazioni: CU, spese sanitarie, affitto/mutuo, assicurazioni, scuola/universita e altre spese detraibili."
      ],
      patronato: [
        "Documento di identita, codice fiscale e contatti aggiornati.",
        "Permesso di soggiorno o ricevuta, se necessario.",
        "IBAN intestato o cointestato per eventuali pagamenti.",
        "Contratto di lavoro, buste paga, CU e documenti contributivi se disponibili.",
        "Per NASpI: lettera di licenziamento o fine contratto e ultime buste paga. Per invalidita: certificati medici e verbali gia ricevuti."
      ],
      legal: [
        "Documento di identita o passaporto e codice fiscale.",
        "Permesso/carta di soggiorno, ricevuta kit postale o appuntamento in Questura se presenti.",
        "Residenza o domicilio, stato di famiglia e documenti familiari se la pratica riguarda ricongiungimento o aggiornamenti.",
        "Contratti, buste paga, comunicazioni di Questura/Prefettura/Comune e ogni lettera ricevuta.",
        "Una breve cronologia dei fatti: cosa e successo, quando, e cosa vuoi ottenere."
      ],
      italianCourse: [
        "Documento di identita e codice fiscale, se disponibili.",
        "Permesso di soggiorno o ricevuta, se sei cittadino extra UE.",
        "Numero di telefono, email e livello attuale di italiano.",
        "Obiettivo del corso: vita quotidiana, lavoro, documenti, esame A1/A2 o integrazione."
      ],
      orientation: [
        "Documento di identita e codice fiscale.",
        "Permesso di soggiorno o ricevuta, se riguarda documenti o immigrazione.",
        "Qualsiasi lettera, appuntamento, ricevuta o documento che non capisci.",
        "Una descrizione breve del problema e della scadenza, se c'e."
      ]
    },
    en: {
      caf: [
        "ID document and tax code of the person requesting the service.",
        "Health card/tax code of involved family members.",
        "Residence permit or receipt, if you are a non-EU citizen.",
        "For ISEE: income documents, bank balance and average balance, property, rent or mortgage, vehicles and disability certificates if any.",
        "For 730/tax return: CU, medical expenses, rent/mortgage, insurance, school/university and other deductible expenses."
      ],
      patronato: [
        "ID document, tax code and updated contact details.",
        "Residence permit or receipt, if needed.",
        "IBAN in your name or jointly held for possible payments.",
        "Work contract, payslips, CU and contribution documents if available.",
        "For NASpI: dismissal/end-of-contract letter and latest payslips. For disability: medical certificates and existing reports."
      ],
      legal: [
        "ID document or passport and tax code.",
        "Residence permit/card, postal kit receipt or Police appointment if available.",
        "Residence/domicile, family status and family documents for reunification or updates.",
        "Contracts, payslips, letters from Police/Prefecture/Municipality and any notice received.",
        "A short timeline: what happened, when, and what you need."
      ],
      italianCourse: [
        "ID document and tax code, if available.",
        "Residence permit or receipt, if you are a non-EU citizen.",
        "Phone number, email and current Italian level.",
        "Course goal: daily life, work, documents, A1/A2 exam or integration."
      ],
      orientation: [
        "ID document and tax code.",
        "Residence permit or receipt, if the issue concerns documents or immigration.",
        "Any letter, appointment, receipt or document you do not understand.",
        "A short description of the problem and any deadline."
      ]
    },
    sq: {
      caf: [
        "Dokument identiteti dhe kod fiskal i personit qe kerkon sherbimin.",
        "Karte shendetesore/kod fiskal per familjaret e perfshire.",
        "Leje qendrimi ose fature/pranim, nese je shtetas jo BE.",
        "Per ISEE: te ardhurat, gjendja dhe mesatarja bankare, prona, qira ose kredi, automjete dhe certifikata invaliditeti nese ka.",
        "Per 730/deklarime: CU, shpenzime mjekesore, qira/kredi, sigurime, shkolle/universitet dhe shpenzime te zbritshme."
      ],
      patronato: [
        "Dokument identiteti, kod fiskal dhe kontakte te perditesuara.",
        "Leje qendrimi ose fature/pranim, nese duhet.",
        "IBAN ne emrin tend ose i perbashket per pagesa te mundshme.",
        "Kontrate pune, lista page, CU dhe dokumente kontributesh nese i ke.",
        "Per NASpI: leter pushimi/fund kontrate dhe listat e fundit te pages. Per invaliditet: certifikata mjekesore dhe verbale."
      ],
      legal: [
        "Dokument identiteti ose pasaporte dhe kod fiskal.",
        "Leje/karta qendrimi, fature kit postar ose takim ne Questura nese i ke.",
        "Rezidence ose banese, gjendje familjare dhe dokumente familjare per bashkim familjar ose perditesime.",
        "Kontrata, lista page, letra nga Questura/Prefettura/Comune dhe cdo njoftim i marre.",
        "Nje pershkrim i shkurter: cfare ndodhi, kur, dhe cfare kerkon."
      ],
      italianCourse: [
        "Dokument identiteti dhe kod fiskal, nese i ke.",
        "Leje qendrimi ose fature/pranim, nese je shtetas jo BE.",
        "Numer telefoni, email dhe niveli aktual i italishtes.",
        "Qellimi i kursit: jeta e perditshme, puna, dokumentet, provimi A1/A2 ose integrimi."
      ],
      orientation: [
        "Dokument identiteti dhe kod fiskal.",
        "Leje qendrimi ose fature/pranim, nese ceshtja lidhet me dokumente ose emigracion.",
        "Cdo leter, takim, fature ose dokument qe nuk kupton.",
        "Pershkrim i shkurter i problemit dhe afati, nese ka."
      ]
    }
  };

  const COPY = {
    it: {
      start: "Ali Per La Libertà offre orientamento e supporto nei rapporti con CAF, Patronati e professionisti abilitati per l’assistenza legale. Scegli l’ambito e ti aiuto a preparare il primo passo.",
      questions: {
        service: "Che tipo di supporto ti serve?",
        topic: "Perfetto. Prima dell'appuntamento prepara questi documenti generali:",
        urgency: "Quanto e urgente?",
        name: "Se vuoi, scrivi il tuo nome. Puoi anche lasciare vuoto.",
        details: "Aggiungi qualche dettaglio utile per capire meglio la situazione."
      },
      options: {
        service: ["CAF / tasse / ISEE", "Patronato / pensioni / disoccupazione", "Supporto per assistenza legale / documenti", "Corso italiano A1/A2", "Non lo so, ho bisogno di orientamento"],
        topic: ["Documenti o pratica da capire", "Appuntamento o richiesta urgente", "Controllare requisiti e possibilita", "Altro"],
        urgency: ["Oggi / appena possibile", "Questa settimana", "Non e urgente"]
      },
      placeholders: {
        name: "Nome e cognome, se vuoi",
        details: "Esempio: ho bisogno di ISEE, permesso di soggiorno, disoccupazione, documenti..."
      },
      note: "Questa lista e generale: in base al caso potremo chiedere altri documenti.",
      chooseTopic: "Ora dimmi cosa ti serve:",
      chatPlaceholder: "Scrivi liberamente, es. mi serve ISEE o permesso di soggiorno",
      chatFollowupPlaceholder: "Aggiungi un dettaglio o scegli una risposta sopra",
      send: "Invia",
      next: "Continua",
      understood: "Ho capito il servizio piu probabile. Intanto puoi preparare:",
      unknown: "Non sono sicuro del servizio giusto. Ti preparo una lista generale e poi un operatore confermera il percorso.",
      required: "Scrivi almeno qualche dettaglio, cosi possiamo aiutarti meglio.",
      summaryTitle: "Ho preparato tutto:",
      createRequest: "Crea richiesta",
      creatingRequest: "Creo la richiesta nella tua area cliente...",
      requestCreated: "Richiesta creata. La ritrovi in Le tue richieste.",
      requestError: "Non riesco a creare la richiesta",
      whatsapp: "Invia su WhatsApp",
      restart: "Ricomincia",
      whatsappText: ({ service, topic, urgency, name, details, documents }) =>
`Ciao Ali Per La Liberta, ho bisogno di orientamento.

Servizio richiesto: ${service}
Necessita principale: ${topic}
Urgenza: ${urgency}
${name ? `Nome: ${name}\n` : ""}Dettagli: ${details}

Documenti che preparo:
${documents}

Messaggio preparato dall'assistente del sito.`
    },
    en: {
      start: "Ali Per La Libertà provides guidance and support in relations with partner CAF and Patronato offices and qualified legal professionals. Choose an area and I will help you prepare the first step.",
      questions: {
        service: "What kind of support do you need?",
        topic: "Good. Before the appointment, prepare these general documents:",
        urgency: "How urgent is it?",
        name: "If you want, write your name. You can also leave it empty.",
        details: "Add a few useful details so we can understand the situation better."
      },
      options: {
        service: ["CAF / taxes / ISEE", "Patronato / pensions / unemployment", "Legal assistance / documents", "Italian course A1/A2", "I'm not sure, I need guidance"],
        topic: ["Understand documents or a procedure", "Appointment or urgent request", "Check requirements and options", "Other"],
        urgency: ["Today / as soon as possible", "This week", "Not urgent"]
      },
      placeholders: {
        name: "Name and surname, if you want",
        details: "Example: I need ISEE, residence permit, unemployment, documents..."
      },
      note: "This list is general: depending on the case we may ask for other documents.",
      chooseTopic: "Now tell me what you need:",
      chatPlaceholder: "Write freely, e.g. I need ISEE or residence permit",
      chatFollowupPlaceholder: "Add a detail or choose an answer above",
      send: "Send",
      next: "Continue",
      understood: "I understood the most likely service. In the meantime, prepare:",
      unknown: "I am not sure which service fits best. I will prepare a general list and an operator will confirm the path.",
      required: "Please write at least a few details so we can help you better.",
      summaryTitle: "I prepared everything:",
      createRequest: "Create request",
      creatingRequest: "Creating the request in your client area...",
      requestCreated: "Request created. You will find it in Your requests.",
      requestError: "I cannot create the request",
      whatsapp: "Send on WhatsApp",
      restart: "Restart",
      whatsappText: ({ service, topic, urgency, name, details, documents }) =>
`Hello Ali Per La Liberta, I need guidance.

Requested service: ${service}
Main need: ${topic}
Urgency: ${urgency}
${name ? `Name: ${name}\n` : ""}Details: ${details}

Documents I will prepare:
${documents}

Message prepared by the website assistant.`
    },
    sq: {
      start: "Ali Per La Libertà ofron orientim dhe mbeshtetje ne marredheniet me qendrat CAF, zyrat Patronato dhe profesionistet ligjore. Zgjidh fushen dhe te ndihmoj me hapin e pare.",
      questions: {
        service: "Cfare lloj mbeshtetjeje te duhet?",
        topic: "Mire. Para takimit pergatit keto dokumente te pergjithshme:",
        urgency: "Sa urgjente eshte?",
        name: "Nese deshiron, shkruaj emrin. Mund ta lesh edhe bosh.",
        details: "Shto disa detaje te dobishme per te kuptuar me mire situaten."
      },
      options: {
        service: ["CAF / taksa / ISEE", "Patronato / pensione / papunesi", "Asistence ligjore / dokumente", "Kurs italisht A1/A2", "Nuk e di, kam nevoje per orientim"],
        topic: ["Dokumente ose praktike per te kuptuar", "Takim ose kerkese urgjente", "Te kontrolloj kerkesat dhe mundesite", "Tjeter"],
        urgency: ["Sot / sa me shpejt", "Kete jave", "Nuk eshte urgjente"]
      },
      placeholders: {
        name: "Emri dhe mbiemri, nese deshiron",
        details: "Shembull: kam nevoje per ISEE, leje qendrimi, papunesi, dokumente..."
      },
      note: "Kjo liste eshte e pergjithshme: sipas rastit mund te kerkojme dokumente te tjera.",
      chooseTopic: "Tani me thuaj cfare te duhet:",
      chatPlaceholder: "Shkruaj lirshem, p.sh. me duhet ISEE ose leje qendrimi",
      chatFollowupPlaceholder: "Shto nje detaj ose zgjidh nje pergjigje me siper",
      send: "Dergo",
      next: "Vazhdo",
      understood: "E kuptova sherbimin me te mundshem. Nderkohe pergatit:",
      unknown: "Nuk jam i sigurt cili sherbim eshte me i sakte. Te pergatis nje liste te pergjithshme dhe operatori do ta konfirmoje.",
      required: "Shkruaj te pakten disa detaje, qe te mund te te ndihmojme me mire.",
      summaryTitle: "Pergatita gjithcka:",
      createRequest: "Krijo kerkese",
      creatingRequest: "Po krijoj kerkesen ne zonen tende...",
      requestCreated: "Kerkesa u krijua. E gjen te kerkesat e tua.",
      requestError: "Nuk arrij te krijoj kerkesen",
      whatsapp: "Dergo ne WhatsApp",
      restart: "Rifillo",
      whatsappText: ({ service, topic, urgency, name, details, documents }) =>
`Pershendetje Ali Per La Liberta, kam nevoje per orientim.

Sherbimi i kerkuar: ${service}
Nevoja kryesore: ${topic}
Urgjenca: ${urgency}
${name ? `Emri: ${name}\n` : ""}Detaje: ${details}

Dokumentet qe pergatis:
${documents}

Mesazh i pergatitur nga asistenti i faqes.`
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
  const submitEl = formEl.querySelector("button[type='submit']");
  const actionsEl = root.querySelector("#serviceBotActions");
  const restartEl = root.querySelector("#serviceBotRestart");
  const whatsappEl = root.querySelector("#serviceBotWhatsApp");
  const chatLogEl = document.createElement("div");
  const createRequestEl = document.createElement("button");

  const state = {};
  let step = "service";
  let proactiveTimer = null;

  chatLogEl.className = "service-bot__log";
  questionEl.insertAdjacentElement("beforebegin", chatLogEl);

  createRequestEl.type = "button";
  createRequestEl.className = "btn btn-outline";
  createRequestEl.id = "serviceBotCreateRequest";
  actionsEl.insertBefore(createRequestEl, whatsappEl);

  function lang() {
    const current = window.LanguageSelector?.get?.() || "it";
    return COPY[current] ? current : "it";
  }

  function copy() {
    return COPY[lang()];
  }

  function documentItems() {
    const key = state.serviceKey || "orientation";
    const currentDocs = DOCS[lang()] || DOCS.it;
    return currentDocs[key] || currentDocs.orientation;
  }

  function documentsText() {
    return documentItems().map((item) => `- ${item}`).join("\n");
  }

  function selectedMessageData() {
    return {
      ...state,
      documents: documentsText()
    };
  }

  function detectServiceKey(text) {
    const value = String(text || "").toLowerCase();
    for (const key of SERVICE_KEYS) {
      if (key === "orientation") continue;
      if ((SERVICE_KEYWORDS[key] || []).some((word) => value.includes(word))) return key;
    }
    return "orientation";
  }

  function serviceIndexFromKey(key) {
    const index = SERVICE_KEYS.indexOf(key);
    return index >= 0 ? index : SERVICE_KEYS.length - 1;
  }

  function appendChatMessage(kind, text) {
    const bubble = document.createElement("div");
    bubble.className = `service-bot__bubble service-bot__bubble--${kind}`;
    bubble.textContent = text;
    chatLogEl.appendChild(bubble);
    while (chatLogEl.children.length > 5) chatLogEl.firstElementChild.remove();
    panelEl.scrollTop = panelEl.scrollHeight;
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

  function setOpen(isOpen) {
    root.classList.toggle("is-open", isOpen);
    root.classList.remove("is-attention");
    panelEl.hidden = !isOpen;
    launcherEl.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) {
      sessionStorage.setItem("apllServiceBotSeen", "1");
      setTimeout(() => {
        const firstAnswer = answersEl.querySelector("button");
        (firstAnswer || inputEl || closeEl).focus({ preventScroll: true });
      }, 40);
    }
  }

  function setQuestion(text) {
    questionEl.textContent = text;
  }

  function clearAnswers() {
    answersEl.innerHTML = "";
  }

  function setChatInput(placeholder, buttonText) {
    formEl.hidden = false;
    inputEl.value = "";
    inputEl.placeholder = placeholder;
    if (submitEl) submitEl.textContent = buttonText;
  }

  function guideText() {
    const c = copy();
    return `${c.questions.topic}\n\n${documentsText()}\n\n${c.note}\n\n${c.chooseTopic}`;
  }

  function renderOptionButtons(key) {
    const c = copy();
    clearAnswers();

    c.options[key].forEach((label, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "service-bot__answer";
      button.textContent = label;
      button.addEventListener("click", () => {
        state[key] = label;
        if (key === "service") {
          state.serviceKey = SERVICE_KEYS[index] || "orientation";
          return showOptions("topic");
        }
        if (key === "topic") return showOptions("urgency");
        return showInput("name");
      });
      answersEl.appendChild(button);
    });
  }

  function showOptions(key) {
    const c = copy();
    step = key;
    actionsEl.hidden = true;
    setQuestion(key === "topic" ? guideText() : c.questions[key]);
    renderOptionButtons(key);
    setChatInput(key === "service" ? c.chatPlaceholder : c.chatFollowupPlaceholder, c.send);
  }

  function showInput(key) {
    const c = copy();
    step = key;
    clearAnswers();
    actionsEl.hidden = true;
    formEl.hidden = false;
    inputEl.value = "";
    inputEl.placeholder = c.placeholders[key];
    if (submitEl) submitEl.textContent = c.next;
    setQuestion(c.questions[key]);
    inputEl.focus({ preventScroll: true });
  }

  function handleFreeChat(value) {
    const c = copy();
    appendChatMessage("user", value);
    const key = detectServiceKey(value);
    const serviceIndex = serviceIndexFromKey(key);
    state.serviceKey = key;
    state.service = c.options.service[serviceIndex] || c.options.service[c.options.service.length - 1];
    state.topic = state.topic || c.options.topic[0];
    state.details = [state.details, value].filter(Boolean).join("\n");

    const intro = key === "orientation" ? c.unknown : c.understood;
    setQuestion(`${intro}\n\n${documentsText()}\n\n${c.note}\n\n${c.chooseTopic}`);
    step = "topic";
    renderOptionButtons("topic");
    setChatInput(c.chatFollowupPlaceholder, c.send);
  }

  function showSummary(statusText = "") {
    const c = copy();
    const message = c.whatsappText(selectedMessageData());
    const status = statusText ? `${statusText}\n\n` : "";
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    clearAnswers();
    formEl.hidden = true;
    actionsEl.hidden = false;
    createRequestEl.hidden = false;
    createRequestEl.disabled = false;
    createRequestEl.textContent = c.createRequest;
    restartEl.textContent = c.restart;
    whatsappEl.textContent = c.whatsapp;
    whatsappEl.href = url;
    setQuestion(`${status}${c.summaryTitle}\n\n${message}`);
  }

  function restart() {
    Object.keys(state).forEach((key) => delete state[key]);
    chatLogEl.replaceChildren();
    step = "service";
    showOptions("service");
  }

  async function createPortalRequest() {
    const c = copy();
    createRequestEl.disabled = true;
    createRequestEl.textContent = c.creatingRequest;
    try {
      await api("/requests", {
        method: "POST",
        body: JSON.stringify({
          service: state.service || "Orientamento",
          subject: `Richiesta assistente - ${state.topic || "Orientamento"}`,
          message: `${state.details || ""}\n\nDocumenti indicati:\n${documentsText()}`.trim(),
          preferredDate: "",
          preferredTime: "",
          phone: ""
        })
      });
      showSummary(c.requestCreated);
      createRequestEl.disabled = true;
    } catch (error) {
      showSummary(`${c.requestError}: ${error.message}`);
    }
  }

  function openBot() {
    const auth = window.apllAuth;
    if (auth && typeof auth.requireClient === "function" && !auth.isClient?.()) {
      auth.requireClient({
        reason: "Accedi per usare l'assistente e collegare la richiesta alla tua area cliente.",
        afterLogin: () => setOpen(true)
      });
      return;
    }

    setOpen(panelEl.hidden);
  }

  function scheduleProactiveHint() {
    window.clearTimeout(proactiveTimer);
    proactiveTimer = window.setTimeout(async () => {
      if (sessionStorage.getItem("apllServiceBotSeen") || !panelEl.hidden || document.hidden) return;
      const auth = window.apllAuth;
      const user = auth?.ready ? await auth.ready.catch(() => null) : null;
      if (user?.role === "client") {
        setOpen(true);
      } else {
        root.classList.add("is-attention");
      }
    }, 8500);
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

    if (["service", "topic", "urgency"].includes(step)) {
      if (!value) {
        inputEl.focus({ preventScroll: true });
        return;
      }
      handleFreeChat(value);
      return;
    }

    state[step] = value;
    if (step === "name") return showInput("details");
    showSummary();
  });

  createRequestEl.addEventListener("click", createPortalRequest);
  restartEl.addEventListener("click", restart);
  launcherEl.addEventListener("click", openBot);
  closeEl.addEventListener("click", () => setOpen(false));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panelEl.hidden) setOpen(false);
  });

  document.addEventListener("language:change", () => {
    const c = copy();
    restartEl.textContent = c.restart;
    whatsappEl.textContent = c.whatsapp;
    createRequestEl.textContent = c.createRequest;
    if (submitEl) submitEl.textContent = c.send;
    if (!state.service) showOptions("service");
    else if (actionsEl.hidden) setQuestion(step === "service" ? c.start : questionEl.textContent);
  });

  restart();
  setOpen(false);
  scheduleProactiveHint();
})();
