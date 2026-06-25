// js/i18n.js
(function () {
  "use strict";

  // ---------------------------
  // Config & constants
  // ---------------------------
  const STORAGE_KEY = (window.APP_CONFIG?.STORAGE_KEYS?.LANG) || "apll.lang";
  const EXPIRY_MS   = (window.APP_CONFIG?.EXPIRY_MS) ?? (60 * 60 * 1000);

  // Public languages (also reused by welcome.js if needed)
  const LANGS = Object.freeze({
    it: "🇮🇹 Italiano",
    sq: "🇦🇱 Shqip",
    en: "🇬🇧 English",
    pa: "🇮🇳 ਪੰਜਾਬੀ",
    hi: "🇮🇳 हिन्दी",
    "hi-Latn": "🇮🇳 Hinglish"
  });

  // ---------------------------
  // Expiring storage helpers
  // ---------------------------
  function getLangFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    if (raw[0] !== "{") { localStorage.removeItem(STORAGE_KEY); return null; }
    try {
      const obj = JSON.parse(raw);
      if (!obj || typeof obj.v !== "string" || typeof obj.exp !== "number") {
        localStorage.removeItem(STORAGE_KEY); return null;
      }
      if (Date.now() > obj.exp) { localStorage.removeItem(STORAGE_KEY); return null; }
      return obj.v;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }

  function setLangWithExpiry(lang, ttlMs = EXPIRY_MS) {
    if (!LANGS[lang]) return;
    const payload = JSON.stringify({ v: lang, exp: Date.now() + ttlMs });
    localStorage.setItem(STORAGE_KEY, payload);
    syncSelectors(lang);
  }

  // ---------------------------
  // Translation dictionary
  // ---------------------------
  const T = {
    // Navbar
    "nav.brand": {
      it: "AliPerLaLiberta",
      en: "AliPerLaLiberta",
      pa: "AliPerLaLiberta",
      hi: "AliPerLaLiberta",
      "hi-Latn": "AliPerLaLiberta"
    },
    "nav.home": {
      it: "Home",
      en: "Home",
      pa: "ਮੁੱਖ ਸਫ਼ਾ",
      hi: "होम",
      "hi-Latn": "Home"
    },
    "nav.call": {
  it: "Chiama",
  en: "Call",
  pa: "ਕਾਲ ਕਰੋ",
  hi: "कॉल करें",
  "hi-Latn": "Call karein"
},
"call.hoursLabel": {
  it: "Orari: Lun–Ven 08:30–13:30 · 16:30–19:30",
  en: "Hours: Mon–Fri 08:30–13:30 · 16:30–19:30",
  pa: "ਸਮਾਂ: ਸੋਮ–ਸ਼ੁਕਰ 08:30–13:30 · 16:30–19:30",
  hi: "समय: सोमवार–शुक्रवार 08:30–13:30 · 16:30–19:30",
  "hi-Latn": "Samay: Som–Shukr 08:30–13:30 · 16:30–19:30"
},


    "nav.email": {
      it: "Email",
      en: "Email",
      pa: "ਈਮੇਲ",
      hi: "ईमेल",
      "hi-Latn": "Email"
    },
    "nav.pec": {
      it: "PEC",
      en: "PEC",
      pa: "PEC",
      hi: "PEC",
      "hi-Latn": "PEC"
    },
    "nav.youtube": {
      it: "YouTube",
      en: "YouTube",
      pa: "YouTube",
      hi: "YouTube",
      "hi-Latn": "YouTube"
    },

    "drawer.close": {
      it: "Chiudi menu",
      en: "Close menu",
      pa: "ਮੇਨੂ ਬੰਦ ਕਰੋ",
      hi: "मेन्यू बंद करें",
      "hi-Latn": "Menu band karein"
    },

    // Homepage istituzionale
    "home.eyebrow": {
      it: "Associazione a Lecce", en: "Organization in Lecce",
      pa: "ਲੇੱਚੇ ਵਿੱਚ ਸੰਸਥਾ", hi: "लेच्चे में संगठन",
      "hi-Latn": "Lecce mein organization"
    },
    "home.title": {
      it: "Ogni persona merita di sentirsi ascoltata, orientata e libera.",
      en: "Everyone deserves to feel heard, guided and free.",
      pa: "ਹਰ ਵਿਅਕਤੀ ਸੁਣੇ ਜਾਣ, ਸਹੀ ਰਾਹ ਪਾਉਣ ਅਤੇ ਆਜ਼ਾਦ ਮਹਿਸੂਸ ਕਰਨ ਦਾ ਹੱਕਦਾਰ ਹੈ।",
      hi: "हर व्यक्ति सुने जाने, सही मार्ग पाने और स्वतंत्र महसूस करने का हकदार है।",
      "hi-Latn": "Har vyakti sune jaane, sahi raasta paane aur azaad mehsoos karne ka haqdar hai."
    },
    "home.lead": {
      it: "Ali Per La Libertà è un punto di riferimento per cittadini italiani e stranieri. Aiutiamo le persone a comprendere documenti, diritti e opportunità, offrendo un sostegno concreto e accessibile.",
      en: "Ali Per La Libertà supports Italian and foreign citizens. We help people understand documents, rights and opportunities through practical, accessible guidance.",
      pa: "Ali Per La Libertà ਇਤਾਲਵੀ ਅਤੇ ਵਿਦੇਸ਼ੀ ਨਾਗਰਿਕਾਂ ਲਈ ਇੱਕ ਸਹਾਰਾ ਹੈ। ਅਸੀਂ ਦਸਤਾਵੇਜ਼ਾਂ, ਹੱਕਾਂ ਅਤੇ ਮੌਕਿਆਂ ਨੂੰ ਸਮਝਣ ਵਿੱਚ ਸੌਖੀ ਅਤੇ ਅਮਲੀ ਮਦਦ ਕਰਦੇ ਹਾਂ।",
      hi: "Ali Per La Libertà इतालवी और विदेशी नागरिकों के लिए एक सहारा है। हम दस्तावेज़, अधिकार और अवसर समझने में सरल और व्यावहारिक सहायता देते हैं।",
      "hi-Latn": "Ali Per La Libertà Italian aur videshi nagrikon ke liye ek sahara hai. Hum documents, rights aur opportunities samajhne mein simple aur practical madad dete hain."
    },
    "home.cta.about": {
      it: "Conosci l’associazione", en: "Meet the organization",
      pa: "ਸੰਸਥਾ ਬਾਰੇ ਜਾਣੋ", hi: "संगठन के बारे में जानें",
      "hi-Latn": "Organization ko janiye"
    },
    "home.cta.services": {
      it: "Scopri come possiamo aiutarti", en: "See how we can help",
      pa: "ਵੇਖੋ ਅਸੀਂ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦੇ ਹਾਂ", hi: "जानें हम कैसे मदद कर सकते हैं",
      "hi-Latn": "Dekhein hum kaise madad kar sakte hain"
    },
    "home.mission.eyebrow": {
      it: "La nostra missione", en: "Our mission",
      pa: "ਸਾਡਾ ਮਕਸਦ", hi: "हमारा उद्देश्य", "hi-Latn": "Hamara mission"
    },
    "home.mission.title": {
      it: "Ridurre le distanze tra le persone e i loro diritti.",
      en: "Bringing people closer to their rights.",
      pa: "ਲੋਕਾਂ ਅਤੇ ਉਨ੍ਹਾਂ ਦੇ ਹੱਕਾਂ ਵਿਚਲੀ ਦੂਰੀ ਘਟਾਉਣਾ।",
      hi: "लोगों और उनके अधिकारों के बीच की दूरी कम करना।",
      "hi-Latn": "Logon aur unke rights ke beech ki doori kam karna."
    },
    "home.mission.text": {
      it: "La burocrazia, la lingua o la mancanza di informazioni non dovrebbero lasciare nessuno indietro. Per questo rendiamo semplici anche i percorsi più complessi.",
      en: "Bureaucracy, language or lack of information should leave no one behind. That is why we make even complex processes easier to understand.",
      pa: "ਕਾਗਜ਼ੀ ਕਾਰਵਾਈ, ਭਾਸ਼ਾ ਜਾਂ ਜਾਣਕਾਰੀ ਦੀ ਘਾਟ ਕਿਸੇ ਨੂੰ ਪਿੱਛੇ ਨਹੀਂ ਛੱਡਣੀ ਚਾਹੀਦੀ। ਇਸ ਲਈ ਅਸੀਂ ਔਖੀਆਂ ਪ੍ਰਕਿਰਿਆਵਾਂ ਨੂੰ ਵੀ ਸੌਖਾ ਬਣਾਉਂਦੇ ਹਾਂ।",
      hi: "कागज़ी प्रक्रिया, भाषा या जानकारी की कमी किसी को पीछे नहीं छोड़नी चाहिए। इसलिए हम जटिल प्रक्रियाओं को भी आसान बनाते हैं।",
      "hi-Latn": "Bureaucracy, language ya information ki kami kisi ko peeche nahi chhodni chahiye. Isliye hum mushkil processes ko bhi simple banate hain."
    },
    "home.value.listen.title": {
      it: "Ascolto", en: "Listening", pa: "ਸੁਣਨਾ", hi: "सुनना", "hi-Latn": "Sunna"
    },
    "home.value.listen.text": {
      it: "Partiamo dalla storia e dalle necessità reali di ogni persona, senza giudizio e con rispetto.",
      en: "We begin with each person’s story and real needs, with respect and without judgment.",
      pa: "ਅਸੀਂ ਹਰ ਵਿਅਕਤੀ ਦੀ ਕਹਾਣੀ ਅਤੇ ਅਸਲ ਲੋੜਾਂ ਤੋਂ, ਬਿਨਾਂ ਕਿਸੇ ਫੈਸਲੇ ਅਤੇ ਆਦਰ ਨਾਲ ਸ਼ੁਰੂ ਕਰਦੇ ਹਾਂ।",
      hi: "हम हर व्यक्ति की कहानी और वास्तविक जरूरतों से, सम्मान और बिना किसी निर्णय के शुरुआत करते हैं।",
      "hi-Latn": "Hum har vyakti ki kahani aur asli zarooraton se, bina judgment aur respect ke saath shuru karte hain."
    },
    "home.value.clarity.title": {
      it: "Chiarezza", en: "Clarity", pa: "ਸਪਸ਼ਟਤਾ", hi: "स्पष्टता", "hi-Latn": "Saaf jaankari"
    },
    "home.value.clarity.text": {
      it: "Spieghiamo procedure e possibilità con parole comprensibili, anche in più lingue.",
      en: "We explain procedures and options in clear language, including multilingual support.",
      pa: "ਅਸੀਂ ਪ੍ਰਕਿਰਿਆਵਾਂ ਅਤੇ ਵਿਕਲਪਾਂ ਨੂੰ ਸੌਖੇ ਸ਼ਬਦਾਂ ਅਤੇ ਕਈ ਭਾਸ਼ਾਵਾਂ ਵਿੱਚ ਸਮਝਾਉਂਦੇ ਹਾਂ।",
      hi: "हम प्रक्रियाओं और विकल्पों को आसान शब्दों और कई भाषाओं में समझाते हैं।",
      "hi-Latn": "Hum procedures aur options ko simple words aur kai languages mein samjhate hain."
    },
    "home.value.action.title": {
      it: "Sostegno concreto", en: "Practical support",
      pa: "ਅਮਲੀ ਸਹਾਇਤਾ", hi: "व्यावहारिक सहायता", "hi-Latn": "Practical support"
    },
    "home.value.action.text": {
      it: "Accompagniamo le persone nei passaggi necessari, dalla prima domanda fino alla soluzione.",
      en: "We guide people through every necessary step, from the first question to the solution.",
      pa: "ਅਸੀਂ ਪਹਿਲੇ ਸਵਾਲ ਤੋਂ ਹੱਲ ਤੱਕ ਹਰ ਲੋੜੀਂਦੇ ਕਦਮ ਵਿੱਚ ਲੋਕਾਂ ਦਾ ਸਾਥ ਦਿੰਦੇ ਹਾਂ।",
      hi: "हम पहले सवाल से समाधान तक हर जरूरी कदम में लोगों का साथ देते हैं।",
      "hi-Latn": "Hum pehle sawal se solution tak har zaroori step mein logon ka saath dete hain."
    },
    "home.story.title": {
      it: "Un luogo vicino alle persone, aperto alle differenze.",
      en: "A place close to people and open to differences.",
      pa: "ਲੋਕਾਂ ਦੇ ਨੇੜੇ ਅਤੇ ਵੱਖਰਪਨ ਲਈ ਖੁੱਲ੍ਹੀ ਥਾਂ।",
      hi: "लोगों के करीब और विविधता के लिए खुली जगह।",
      "hi-Latn": "Logon ke kareeb aur differences ke liye open jagah."
    },
    "home.story.text": {
      it: "Ali Per La Libertà nasce per creare autonomia, inclusione e fiducia. Mettiamo in relazione persone, servizi e competenze, affinché ciascuno possa partecipare pienamente alla vita sociale e costruire il proprio futuro con maggiore serenità.",
      en: "Ali Per La Libertà exists to build independence, inclusion and trust. We connect people with services and expertise so everyone can participate fully in society and build their future with greater confidence.",
      pa: "Ali Per La Libertà ਖੁਦਮੁਖਤਿਆਰੀ, ਸ਼ਮੂਲੀਅਤ ਅਤੇ ਭਰੋਸਾ ਬਣਾਉਣ ਲਈ ਕੰਮ ਕਰਦੀ ਹੈ। ਅਸੀਂ ਲੋਕਾਂ ਨੂੰ ਸੇਵਾਵਾਂ ਅਤੇ ਮਾਹਿਰਤਾ ਨਾਲ ਜੋੜਦੇ ਹਾਂ ਤਾਂ ਜੋ ਹਰ ਕੋਈ ਸਮਾਜ ਵਿੱਚ ਪੂਰੀ ਤਰ੍ਹਾਂ ਸ਼ਾਮਲ ਹੋ ਸਕੇ।",
      hi: "Ali Per La Libertà आत्मनिर्भरता, समावेश और विश्वास बनाने के लिए काम करता है। हम लोगों को सेवाओं और विशेषज्ञता से जोड़ते हैं ताकि हर कोई समाज में पूरी तरह भाग ले सके।",
      "hi-Latn": "Ali Per La Libertà independence, inclusion aur trust banane ke liye kaam karta hai. Hum logon ko services aur expertise se jodte hain."
    },
    "home.services.eyebrow": {
      it: "Come ti aiutiamo", en: "How we help",
      pa: "ਅਸੀਂ ਕਿਵੇਂ ਮਦਦ ਕਰਦੇ ਹਾਂ", hi: "हम कैसे मदद करते हैं", "hi-Latn": "Hum kaise madad karte hain"
    },
    "home.services.title": {
      it: "Orientamento e assistenza, quando servono davvero.",
      en: "Guidance and assistance when they truly matter.",
      pa: "ਸਹੀ ਸਮੇਂ ਮਾਰਗਦਰਸ਼ਨ ਅਤੇ ਸਹਾਇਤਾ।",
      hi: "सही समय पर मार्गदर्शन और सहायता।",
      "hi-Latn": "Sahi samay par guidance aur assistance."
    },
    "home.services.text": {
      it: "Il nostro lavoro comprende assistenza fiscale, previdenziale e legale. Ti aiutiamo a capire qual è il percorso più adatto alla tua situazione.",
      en: "Our work includes tax, welfare and legal assistance. We help you understand the best path for your situation.",
      pa: "ਸਾਡੇ ਕੰਮ ਵਿੱਚ ਟੈਕਸ, ਸਮਾਜਿਕ ਸੁਰੱਖਿਆ ਅਤੇ ਕਾਨੂੰਨੀ ਸਹਾਇਤਾ ਸ਼ਾਮਲ ਹੈ। ਅਸੀਂ ਤੁਹਾਡੀ ਸਥਿਤੀ ਲਈ ਸਹੀ ਰਾਹ ਸਮਝਣ ਵਿੱਚ ਮਦਦ ਕਰਦੇ ਹਾਂ।",
      hi: "हमारा काम कर, सामाजिक सुरक्षा और कानूनी सहायता को शामिल करता है। हम आपकी स्थिति के लिए सही रास्ता समझने में मदद करते हैं।",
      "hi-Latn": "Hamare kaam mein tax, welfare aur legal assistance shamil hai. Hum aapki situation ke liye sahi raasta samajhne mein madad karte hain."
    },
    "home.services.link": {
      it: "Approfondisci →", en: "Learn more →",
      pa: "ਹੋਰ ਜਾਣੋ →", hi: "और जानें →", "hi-Latn": "Aur janiye →"
    },
    "home.services.book": {
      it: "Prenota appuntamento", en: "Book an appointment",
      pa: "ਮੁਲਾਕਾਤ ਬੁੱਕ ਕਰੋ", hi: "अपॉइंटमेंट बुक करें", "hi-Latn": "Appointment book karein"
    },
    "home.contact.title": {
      it: "Non sai da dove iniziare?", en: "Not sure where to begin?",
      pa: "ਪਤਾ ਨਹੀਂ ਕਿੱਥੋਂ ਸ਼ੁਰੂ ਕਰਨਾ ਹੈ?", hi: "समझ नहीं आ रहा कहाँ से शुरू करें?",
      "hi-Latn": "Samajh nahi aa raha kahan se shuru karein?"
    },
    "home.contact.text": {
      it: "Raccontaci brevemente la tua necessità. Ti ascolteremo e ti indicheremo il servizio o il percorso più adatto.",
      en: "Tell us briefly what you need. We will listen and point you toward the most suitable service or path.",
      pa: "ਸਾਨੂੰ ਸੰਖੇਪ ਵਿੱਚ ਆਪਣੀ ਲੋੜ ਦੱਸੋ। ਅਸੀਂ ਸੁਣਾਂਗੇ ਅਤੇ ਤੁਹਾਨੂੰ ਸਭ ਤੋਂ ਢੁਕਵੀਂ ਸੇਵਾ ਜਾਂ ਰਾਹ ਦੱਸਾਂਗੇ।",
      hi: "हमें संक्षेप में अपनी जरूरत बताएं। हम सुनेंगे और आपको सबसे उपयुक्त सेवा या रास्ता बताएंगे।",
      "hi-Latn": "Humein short mein apni zaroorat batayein. Hum sunenge aur sabse suitable service ya raasta batayenge."
    },
    "home.contact.cta": {
      it: "Parla con noi", en: "Talk to us",
      pa: "ਸਾਡੇ ਨਾਲ ਗੱਲ ਕਰੋ", hi: "हमसे बात करें", "hi-Latn": "Humse baat karein"
    },
    "serviceBot.eyebrow": {
      it: "Assistente WhatsApp", en: "WhatsApp assistant",
      pa: "WhatsApp ਸਹਾਇਕ", hi: "WhatsApp सहायक", "hi-Latn": "WhatsApp assistant"
    },
    "serviceBot.launcher": {
      it: "Hai bisogno?", en: "Need help?",
      pa: "ਮਦਦ ਚਾਹੀਦੀ?", hi: "मदद चाहिए?", "hi-Latn": "Madad chahiye?"
    },
    "serviceBot.close": {
      it: "Chiudi chat", en: "Close chat",
      pa: "ਚੈਟ ਬੰਦ ਕਰੋ", hi: "चैट बंद करें", "hi-Latn": "Chat band karein"
    },
    "serviceBot.title": {
      it: "Non sai quale servizio scegliere?", en: "Not sure which service to choose?",
      pa: "ਪਤਾ ਨਹੀਂ ਕਿਹੜੀ ਸੇਵਾ ਚੁਣਨੀ ਹੈ?", hi: "समझ नहीं आ रहा कौन सी सेवा चुनें?",
      "hi-Latn": "Samajh nahi aa raha kaunsi service chunni hai?"
    },
    "serviceBot.text": {
      it: "Rispondi a poche domande: prepariamo un messaggio ordinato da inviare su WhatsApp dal tuo numero.",
      en: "Answer a few questions: we prepare a clear message to send on WhatsApp from your number.",
      pa: "ਕੁਝ ਸਵਾਲਾਂ ਦੇ ਜਵਾਬ ਦਿਓ: ਅਸੀਂ ਤੁਹਾਡੇ ਨੰਬਰ ਤੋਂ WhatsApp ਤੇ ਭੇਜਣ ਲਈ ਸੁਥਰਾ ਮੈਸੇਜ ਤਿਆਰ ਕਰਾਂਗੇ।",
      hi: "कुछ सवालों के जवाब दें: हम आपके नंबर से WhatsApp पर भेजने के लिए साफ संदेश तैयार करेंगे।",
      "hi-Latn": "Kuch sawalon ke jawab dein: hum aapke number se WhatsApp par bhejne ke liye clear message taiyar karenge."
    },
    "serviceBot.next": {
      it: "Continua", en: "Continue", pa: "ਜਾਰੀ ਰੱਖੋ", hi: "जारी रखें", "hi-Latn": "Continue"
    },
    "serviceBot.restart": {
      it: "Ricomincia", en: "Restart", pa: "ਮੁੜ ਸ਼ੁਰੂ ਕਰੋ", hi: "फिर से शुरू करें", "hi-Latn": "Dobara shuru karein"
    },
    "serviceBot.whatsapp": {
      it: "Invia su WhatsApp", en: "Send on WhatsApp",
      pa: "WhatsApp ਤੇ ਭੇਜੋ", hi: "WhatsApp पर भेजें", "hi-Latn": "WhatsApp par bhejein"
    },
    "serviceBot.note": {
      it: "Il sito non invia nulla automaticamente: WhatsApp si apre e sarai tu a premere “Invia”.",
      en: "The site does not send anything automatically: WhatsApp opens and you press “Send”.",
      pa: "ਸਾਈਟ ਕੁਝ ਵੀ ਆਪਣੇ ਆਪ ਨਹੀਂ ਭੇਜਦੀ: WhatsApp ਖੁੱਲੇਗਾ ਅਤੇ ਤੁਸੀਂ “Send” ਦਬਾਓਗੇ।",
      hi: "साइट अपने आप कुछ नहीं भेजती: WhatsApp खुलेगा और आप “Send” दबाएँगे।",
      "hi-Latn": "Site automatic kuch nahi bhejti: WhatsApp khulega aur aap “Send” dabayenge."
    },

    "services.caf.desc": {
  it: "Ti aiutiamo con tutte le pratiche fiscali come dichiarazione dei redditi, ISEE, Modello 730 e altre procedure tributarie, in modo semplice e veloce.",
  en: "We help you with all tax procedures such as income tax returns, ISEE, Form 730 and other tax-related processes, in a simple and fast way.",
  hi: "हम आयकर रिटर्न, ISEE, मॉडल 730 और अन्य कर संबंधी प्रक्रियाओं में सरल और तेज़ सहायता प्रदान करते हैं।",
  pa: "ਅਸੀਂ ਆਮਦਨੀ ਕਰ ਰਿਟਰਨ, ISEE, ਮਾਡਲ 730 ਅਤੇ ਹੋਰ ਕਰ ਸੰਬੰਧੀ ਕਾਰਵਾਈਆਂ ਵਿੱਚ ਸੌਖੀ ਅਤੇ ਤੇਜ਼ ਮਦਦ ਕਰਦੇ ਹਾਂ।",
  "hi-Latn": "Hum income tax return, ISEE, Model 730 aur anya tax related processes me simple aur fast madad karte hain."
},

    // Services (6)
    "services.caf.title": {
      it: "CAF (Centro di Assistenza Fiscale)",
      en: "CAF (Tax Assistance Center)",
      hi: "CAF (कर सहायता केंद्र)",
      pa: "CAF (ਟੈਕਸ ਸਹਾਇਤਾ ਕੇਂਦਰ)",
      "hi-Latn": "CAF (Tax Sahayata Kendra)"
    },
    "caf.desc": {
      it: "Il CAF Ali Per La Liberta offre assistenza fiscale online e in Italia per stranieri e cittadini italiani, inclusi ISEE, Modello 730, F24, RED e bonus, con supporto multilingua.",
      en: "CAF Ali Per La Liberta provides online tax assistance in Italy for foreign and Italian citizens, including ISEE, Model 730, F24, RED, and tax bonuses, with multilingual support.",
      hi: "CAF Ali Per La Liberta इटली में विदेशी और इतालवी नागरिकों के लिए ऑनलाइन कर सहायता प्रदान करता है, जिसमें ISEE, मॉडल 730, F24, RED और बोनस शामिल हैं, बहुभाषी समर्थन के साथ।",
      pa: "CAF Ali Per La Liberta ਇਟਲੀ ਵਿੱਚ ਵਿਦੇਸ਼ੀ ਅਤੇ ਇਤਾਲਵੀ ਨਾਗਰਿਕਾਂ ਲਈ ਆਨਲਾਈਨ ਟੈਕਸ ਸਹਾਇਤਾ ਦਿੰਦਾ ਹੈ, ਜਿਸ ਵਿੱਚ ISEE, ਮਾਡਲ 730, F24, RED ਅਤੇ ਬੋਨਸ ਸ਼ਾਮਲ ਹਨ, ਬਹੁਭਾਸ਼ੀ ਸਹਾਇਤਾ ਨਾਲ।",
      "hi-Latn": "CAF Ali Per La Liberta Italy me videshi aur Italian nagrikon ke liye online tax assistance deta hai, jisme ISEE, Model 730, F24, RED aur bonus shamil hain, multilingual support ke sath."
    },

    "services.patronato.title": {
      it: "Patronato",
      en: "Patronato",
      hi: "Patronato",
      pa: "Patronato",
      "hi-Latn": "Patronato"
    },
    "services.patronato.desc": {
      it: "Offriamo supporto per pensioni, indennità, disoccupazione e altre pratiche previdenziali o assistenziali con consulenza personalizzata.",
      en: "We offer support for pensions, allowances, unemployment, and other welfare procedures with personalized guidance.",
      hi: "पेंशन, भत्ते, बेरोज़गारी और अन्य सामाजिक/प्रावधान संबंधी कार्यों में व्यक्तिगत मार्गदर्शन के साथ सहायता।",
      pa: "ਪੈਂਸ਼ਨ, ਭੱਤੇ, ਬੇਰੁਜ਼ਗਾਰੀ ਅਤੇ ਹੋਰ ਭਲਾਈ ਪ੍ਰਕਿਰਿਆਵਾਂ ਲਈ ਨਿੱਜੀ ਸਲਾਹ ਨਾਲ ਸਹਾਇਤਾ।",
      "hi-Latn": "Pension, bhatte, berozgaari aur anya samajik/pravidhan prakriyaon me personal guidance ke saath sahayata."
    },

    "services.legal.title": {
      it: "Assistenza Legale / Supporto",
      en: "Legal Assistance / Support",
      hi: "कानूनी सहायता / सपोर्ट",
      pa: "ਕਾਨੂੰਨੀ ਸਹਾਇਤਾ / ਸਮਰਥਨ",
      "hi-Latn": "Kanooni Sahayata / Support"
    },
    "services.legal.desc": {
      it: "Un aiuto legale chiaro e accessibile per contratti, documenti, vertenze o problemi legati ai diritti del lavoro e civili.",
      en: "Clear, accessible legal help for contracts, documents, disputes, or issues related to labor and civil rights.",
      hi: "कॉन्ट्रैक्ट, दस्तावेज़, विवाद या श्रम व नागरिक अधिकारों से जुड़े मुद्दों पर स्पष्ट और सुलभ कानूनी मदद।",
      pa: "ਕਾਂਟ੍ਰੈਕਟ, ਦਸਤਾਵੇਜ਼, ਵਿਵਾਦ ਜਾਂ ਮਜ਼ਦੂਰੀ ਅਤੇ ਨਾਗਰਿਕ ਹੱਕਾਂ ਨਾਲ ਜੁੜੇ ਮਸਲਿਆਂ ਲਈ ਸਪਸ਼ਟ ਤੇ ਸੌਖੀ ਕਾਨੂੰਨੀ ਮਦਦ।",
      "hi-Latn": "Contract, documents, vivad ya labour/civil rights se jude muddon par saaf aur accessible legal help."
    },

    "services.corsi.title": {
      it: "Corsi di Formazione",
      en: "Training Courses",
      hi: "प्रशिक्षण कोर्स",
      pa: "ਟ੍ਰੇਨਿੰਗ ਕੋਰਸ",
      "hi-Latn": "Training Courses"
    },
    "services.corsi.desc": {
      it: "Corsi professionali e aggiornamenti formativi per migliorare le competenze e trovare nuove opportunità di lavoro.",
      en: "Professional courses and upskilling to improve skills and find new job opportunities.",
      hi: "कौशल बढ़ाने और नई नौकरी के अवसर पाने के लिए व्यावसायिक कोर्स और अपस्किलिंग।",
      pa: "ਕੁਸ਼ਲਤਾਵਾਂ ਵਧਾਉਣ ਅਤੇ ਨਵੀਆਂ ਨੌਕਰੀ ਦੇ ਮੌਕਿਆਂ ਲਈ ਪੇਸ਼ਾਵਰ ਕੋਰਸ ਅਤੇ ਅੱਪਸਕਿਲਿੰਗ।",
      "hi-Latn": "Professional courses aur upskilling se skills improve karo aur naye job opportunities pao."
    },
    "services.italianCourse.title": {
      it: "Corso di lingua italiana A1 e A2",
      en: "Italian language course A1 and A2",
      hi: "इतालवी भाषा कोर्स A1 और A2",
      pa: "ਇਤਾਲਵੀ ਭਾਸ਼ਾ ਕੋਰਸ A1 ਅਤੇ A2",
      "hi-Latn": "Italian language course A1 aur A2"
    },
    "services.italianCourse.desc": {
      it: "Percorsi base di italiano per comunicare meglio, prepararsi ai documenti e vivere con più autonomia.",
      en: "Basic Italian courses to communicate better, prepare documents and live with more independence.",
      hi: "बेहतर संवाद, दस्तावेज़ों की तैयारी और अधिक आत्मनिर्भर जीवन के लिए बेसिक इतालवी कोर्स।",
      pa: "ਵਧੀਆ ਸੰਚਾਰ, ਦਸਤਾਵੇਜ਼ਾਂ ਦੀ ਤਿਆਰੀ ਅਤੇ ਹੋਰ ਖੁਦਮੁਖਤਿਆਰੀ ਲਈ ਬੇਸਿਕ ਇਤਾਲਵੀ ਕੋਰਸ।",
      "hi-Latn": "Better communication, documents ki tayari aur zyada independence ke liye basic Italian courses."
    },

    "services.web.title": {
      it: "Creazione Siti Web",
      en: "Website Creation",
      hi: "वेबसाइट निर्माण",
      pa: "ਵੈੱਬਸਾਈਟ ਤਿਆਰੀ",
      "hi-Latn": "Website Creation"
    },
    "services.web.desc": {
      it: "Realizziamo siti web professionali e moderni per aziende, freelance o piccoli business, curando design e funzionalità.",
      en: "We build professional, modern websites for companies, freelancers, or small businesses, with care for design and functionality.",
      hi: "कंपनियों, फ्रीलांसरों और छोटे व्यवसायों के लिए आधुनिक, पेशेवर वेबसाइट—डिज़ाइन और फ़ंक्शन पर विशेष ध्यान।",
      pa: "ਕੰਪਨੀਆਂ, ਫ੍ਰੀਲਾਂਸਰਾਂ ਅਤੇ ਛੋਟੇ ਕਾਰੋਬਾਰ ਲਈ ਆਧੁਨਿਕ, ਪੇਸ਼ਾਵਰ ਵੈੱਬਸਾਈਟ—ਡਿਜ਼ਾਈਨ ਅਤੇ ਫਂਕਸ਼ਨ 'ਤੇ ਖਾਸ ਧਿਆਨ।",
      "hi-Latn": "Companies, freelancers aur small business ke liye modern, professional websites—design aur function par khas dhyan."
    },

    "services.biglietti.title": {
      it: "Biglietti & E-Visa Supporto",
      en: "Tickets & E-Visa Support",
      hi: "टिकट और ई-वीज़ा सहायता",
      pa: "ਟਿਕਟਾਂ ਅਤੇ E-Visa ਸਹਾਇਤਾ",
      "hi-Latn": "Tickets & E-Visa Support"
    },
    "services.biglietti.desc": {
      it: "Prenotazioni per treni, autobus e aerei. Aiuto anche per ottenere eVisa per chi viaggia all’estero in modo rapido e sicuro.",
      en: "Bookings for trains, buses, and flights. We also help obtain eVisas for international travel quickly and safely.",
      hi: "ट्रेन, बस और उड़ान की बुकिंग। विदेश यात्रा के लिए eVisa प्राप्त करने में भी तेज़ और सुरक्षित मदद।",
      pa: "ਰੇਲ, ਬੱਸ ਅਤੇ ਉਡਾਣਾਂ ਦੀ ਬੁਕਿੰਗ। ਵਿਦੇਸ਼ ਯਾਤਰਾ ਲਈ eVisa ਲੈਣ ਵਿੱਚ ਵੀ ਤੇਜ਼ ਅਤੇ ਸੁਰੱਖਿਅਤ ਮਦਦ।",
      "hi-Latn": "Train, bus aur flight ki booking. Abroad travel ke liye eVisa hasil karne me bhi tez aur surakshit madad."
    },

    // Buttons (Home hero)
    "hero.cta.discover": {
      it: "Scopri il servizio",
      en: "View service",
      hi: "सेवा देखें",
      pa: "ਸੇਵਾ ਵੇਖੋ",
      "hi-Latn": "Service dekho"
    },
    "hero.cta.share": {
      it: "Condividi",
      en: "Share",
      hi: "शेयर करें",
      pa: "ਸਾਂਝਾ ਕਰੋ",
      "hi-Latn": "Share karein"
    },

    // Buttons (Service detail)
    "detail.cta.request": {
      it: "Richiedi assistenza",
      en: "Request assistance",
      hi: "सहायता माँगें",
      pa: "ਸਹਾਇਤਾ ਮੰਗੋ",
      "hi-Latn": "Sahayata maangein"
    },
    "detail.cta.share": {
      it: "Condividi",
      en: "Share",
      hi: "शेयर करें",
      pa: "ਸਾਂਝਾ ਕਰੋ",
      "hi-Latn": "Share karein"
    },

    // ---------------------------
    // Footer
    // ---------------------------
    "footer.title.contacts": {
      it: "Contatti & Orari",
      en: "Contacts & Hours",
      hi: "संपर्क और समय",
      pa: "ਸੰਪਰਕ ਅਤੇ ਸਮਾਂ",
      "hi-Latn": "Sampark aur Samay"
    },
    "footer.phone": {
      it: "Telefono / WhatsApp",
      en: "Phone / WhatsApp",
      hi: "फ़ोन / व्हाट्सऐप",
      pa: "ਫੋਨ / ਵਟਸਐਪ",
      "hi-Latn": "Phone / WhatsApp"
    },
    "footer.email": {
      it: "Email",
      en: "Email",
      hi: "ईमेल",
      pa: "ਈਮੇਲ",
      "hi-Latn": "Email"
    },
    "footer.address.label": {
      it: "Indirizzo",
      en: "Address",
      hi: "पता",
      pa: "ਪਤਾ",
      "hi-Latn": "Pata"
    },
    "footer.hours": {
      it: "Orari: Lun–Ven 08:30–13:30 · 16:30–19:30",
      en: "Hours: Mon–Fri 08:30–13:30 · 16:30–19:30",
      hi: "समय: सोमवार–शुक्रवार 08:30–13:30 · 16:30–19:30",
      pa: "ਸਮਾਂ: ਸੋਮ–ਸ਼ੁਕਰ 08:30–13:30 · 16:30–19:30",
      "hi-Latn": "Samay: Som–Shukr 08:30–13:30 · 16:30–19:30"
    },
    "footer.hours.label": {
      it: "Orari:", en: "Hours:", hi: "समय:", pa: "ਸਮਾਂ:", "hi-Latn": "Samay:"
    },
    "footer.hours.value": {
      it: "Lun–Ven 08:30–13:30 · 16:30–19:30",
      en: "Mon–Fri 08:30–13:30 · 16:30–19:30",
      hi: "सोमवार–शुक्रवार 08:30–13:30 · 16:30–19:30",
      pa: "ਸੋਮ–ਸ਼ੁਕਰ 08:30–13:30 · 16:30–19:30",
      "hi-Latn": "Som–Shukr 08:30–13:30 · 16:30–19:30"
    },
    "footer.openwith": {
      it: "Apri con",
      en: "Open with",
      hi: "इसके साथ खोलें",
      pa: "ਇਸ ਨਾਲ ਖੋਲ੍ਹੋ",
      "hi-Latn": "Iske sath kholo"
    },
    "footer.maps.openwith": {
      it: "Apri con…", en: "Open with…", hi: "इसके साथ खोलें…",
      pa: "ਇਸ ਨਾਲ ਖੋਲ੍ਹੋ…", "hi-Latn": "Iske sath kholo…"
    },
    "footer.maps.google": {
      it: "Google Maps", en: "Google Maps", hi: "Google Maps",
      pa: "Google Maps", "hi-Latn": "Google Maps"
    },
    "footer.maps.apple": {
      it: "Apple Maps", en: "Apple Maps", hi: "Apple Maps",
      pa: "Apple Maps", "hi-Latn": "Apple Maps"
    },
    "footer.maps.remember": {
      it: "Ricorda la scelta", en: "Remember my choice",
      hi: "मेरी पसंद याद रखें", pa: "ਮੇਰੀ ਚੋਣ ਯਾਦ ਰੱਖੋ",
      "hi-Latn": "Meri choice yaad rakhein"
    },
    "footer.title.legal": {
      it: "Legale",
      en: "Legal",
      hi: "कानूनी जानकारी",
      pa: "ਕਾਨੂੰਨੀ",
      "hi-Latn": "Kanooni Jaankari"
    },
    "footer.privacy": {
      it: "Privacy Policy",
      en: "Privacy Policy",
      hi: "गोपनीयता नीति",
      pa: "ਪਰਾਈਵੇਸੀ ਨੀਤੀ",
      "hi-Latn": "Privacy Policy"
    },
    "footer.terms": {
      it: "Termini di Servizio",
      en: "Terms of Service",
      hi: "सेवा की शर्तें",
      pa: "ਸੇਵਾ ਦੀਆਂ ਸ਼ਰਤਾਂ",
      "hi-Latn": "Service ki Shartein"
    },
    "footer.cookies": {
      it: "Cookie Policy",
      en: "Cookie Policy",
      hi: "कुकी नीति",
      pa: "ਕੂਕੀ ਨੀਤੀ",
      "hi-Latn": "Cookie Policy"
    },
    "footer.legalnotes": {
      it: "Note Legali",
      en: "Legal Notice",
      hi: "कानूनी सूचना",
      pa: "ਕਾਨੂੰਨੀ ਸੂਚਨਾ",
      "hi-Latn": "Kanooni Suchna"
    },
    "footer.rights": {
      it: "© 2025 AliPerLaLiberta — Tutti i diritti riservati.",
      en: "© 2025 AliPerLaLiberta — All rights reserved.",
      hi: "© 2025 AliPerLaLiberta — सर्वाधिकार सुरक्षित.",
      pa: "© 2025 AliPerLaLiberta — ਸਾਰੇ ਹੱਕ ਰਾਖਵੇਂ ਹਨ।",
      "hi-Latn": "© 2025 AliPerLaLiberta — Sabhi Adhikaar Surakshit."
    },
    "footer.copyright": {
      it: "© 2026 Ali Per La Libertà — Tutti i diritti riservati.",
      en: "© 2026 Ali Per La Libertà — All rights reserved.",
      hi: "© 2026 Ali Per La Libertà — सर्वाधिकार सुरक्षित।",
      pa: "© 2026 Ali Per La Libertà — ਸਾਰੇ ਹੱਕ ਰਾਖਵੇਂ ਹਨ।",
      "hi-Latn": "© 2026 Ali Per La Libertà — Sabhi adhikaar surakshit."
    },
    "footer.piva": {
      it: "C.F: 93173080750", en: "Tax code: 93173080750",
      hi: "टैक्स कोड: 93173080750", pa: "ਟੈਕਸ ਕੋਡ: 93173080750",
      "hi-Latn": "Tax code: 93173080750"
    },
    // ================================
// CAF Page — i18n dictionary block
// ================================
"caf.title": {
  it: "CAF (Centro di Assistenza Fiscale)",
  en: "CAF (Tax Assistance Center)",
  hi: "CAF (कर सहायता केंद्र)",
  pa: "CAF (ਟੈਕਸ ਸਹਾਇਤਾ ਕੇਂਦਰ)",
  "hi-Latn": "CAF (Kar Sahayata Kendra)"
},
"caf.services.isee": {
  it: "Compilazione e invio della Dichiarazione Sostitutiva Unica.",
  en: "Compilation and submission of the ISEE Declaration.",
  hi: "आईएसईई घोषणा का संकलन और प्रस्तुतिकरण।",
  pa: "ISEE ਘੋਸ਼ਣਾ ਦੀ ਤਿਆਰੀ ਅਤੇ ਜਮ੍ਹਾਂ ਕਰਨਾ।",
  "hi-Latn": "ISEE ghoshna ka sangrahan aur prastutikaran."
},
"caf.services.730": {
  it: "Dichiarazione dei redditi con assistenza professionale.",
  en: "Income declaration with professional assistance.",
  hi: "पेशेवर सहायता के साथ आय घोषणा।",
  pa: "ਪੇਸ਼ੇਵਰ ਸਹਾਇਤਾ ਨਾਲ ਆਮਦਨ ਘੋਸ਼ਣਾ।",
  "hi-Latn": "Peshevar sahayata ke sath aay ghoshna."
},
"caf.services.redditi": {
  it: "Gestione completa per persone fisiche e autonomi.",
  en: "Complete management for individuals and freelancers.",
  hi: "व्यक्तियों और फ्रीलांसरों के लिए पूर्ण प्रबंधन।",
  pa: "ਵਿਅਕਤੀਆਂ ਅਤੇ ਖੁਦਮੁਖਤਿਆਰਾਂ ਲਈ ਪੂਰਾ ਪ੍ਰਬੰਧ।",
  "hi-Latn": "Vyaktiyon aur freelancers ke liye poora prabandh."
},
"caf.services.red": {
  it: "Comunicazioni obbligatorie per pensionati e INPS.",
  en: "Mandatory communications for pensioners and INPS.",
  hi: "पेंशनभोगियों और INPS के लिए अनिवार्य सूचनाएँ।",
  pa: "ਪੈਨਸ਼ਨਰਾਂ ਅਤੇ INPS ਲਈ ਲਾਜ਼ਮੀ ਸੂਚਨਾਵਾਂ।",
  "hi-Latn": "Pensioners aur INPS ke liye anivarya soochnaen."
},
"caf.services.f24": {
  it: "Calcolo e pagamento di imposte comunali e statali.",
  en: "Calculation and payment of municipal and state taxes.",
  hi: "नगर और राज्य करों की गणना और भुगतान।",
  pa: "ਨਗਰ ਅਤੇ ਰਾਜ ਦੇ ਕਰਾਂ ਦੀ ਗਿਣਤੀ ਅਤੇ ਭੁਗਤਾਨ।",
  "hi-Latn": "Nagar aur rajya karon ki ganana aur bhugtan."
},
"caf.services.bonus": {
  it: "Supporto per richiedere bonus e agevolazioni fiscali.",
  en: "Support for requesting tax bonuses and benefits.",
  hi: "कर बोनस और लाभों के लिए समर्थन।",
  pa: "ਟੈਕਸ ਬੋਨਸ ਅਤੇ ਲਾਭਾਂ ਲਈ ਸਹਾਇਤਾ।",
  "hi-Latn": "Tax bonus aur labhon ke liye sahayata."
},
"caf.button.book": {
  it: "Prenota ora",
  en: "Book now",
  hi: "अभी बुक करें",
  pa: "ਹੁਣੇ ਬੁੱਕ ਕਰੋ",
  "hi-Latn": "Abhi book karo"
},

// Patronato Section
"patronato.title": {
  it: "Patronato",
  en: "Patronato",
  hi: "Patronato",
  pa: "Patronato",
  "hi-Latn": "Patronato"
},
"patronato.subtitle": {
  it: "Il Patronato Ali Per La Liberta a Lecce offre supporto per pensioni, NASpI, invalidità, maternità, infortuni sul lavoro e servizi di assistenza sociale, anche per cittadini stranieri.",
  en: "Ali Per La Liberta Patronato in Lecce provides support for pensions, NASpI, disability, maternity, workplace injuries, and social assistance services, including for foreign citizens.",
  hi: "लेच्चे में अली पर ला लिबर्टा पैट्रोनेटो पेंशन, NASpI, विकलांगता, मातृत्व, कार्यस्थल दुर्घटनाओं और सामाजिक सहायता सेवाओं के लिए सहायता प्रदान करता है, विदेशी नागरिकों के लिए भी।",
  pa: "ਲੇੱਚੇ ਵਿੱਚ Ali Per La Liberta Patronato ਪੈਨਸ਼ਨ, NASpI, ਅਪਾਹਜਤਾ, ਮਾਤৃত্ব, ਕੰਮ ਦੌਰਾਨ ਹਾਦਸਿਆਂ ਅਤੇ ਸਮਾਜਿਕ ਸਹਾਇਤਾ ਸੇਵਾਵਾਂ ਲਈ ਸਹਾਇਤਾ ਦਿੰਦਾ ਹੈ, ਵਿਦੇਸ਼ੀ ਨਾਗਰਿਕਾਂ ਲਈ ਵੀ।",
  "hi-Latn": "Lecce me Ali Per La Liberta Patronato pension, NASpI, disability, maternity, workplace injuries aur social assistance services ke liye support deta hai, foreign citizens ke liye bhi."
},

"patronato.service.pensione": {
  it: "Assistenza nella richiesta e gestione delle pratiche pensionistiche.",
  en: "Assistance in requesting and managing pension procedures.",
  hi: "पेंशन प्रक्रियाओं के अनुरोध और प्रबंधन में सहायता।",
  pa: "ਪੈਨਸ਼ਨ ਪ੍ਰਕਿਰਿਆਵਾਂ ਦੀ ਬੇਨਤੀ ਅਤੇ ਪ੍ਰਬੰਧ ਵਿੱਚ ਸਹਾਇਤਾ।",
  "hi-Latn": "Pension prakriya ke liye sahayata."
},
"patronato.service.invalidita": {
  it: "Supporto per riconoscimento e benefici legati all’invalidità civile.",
  en: "Support for recognition and benefits related to civil disability.",
  hi: "नागरिक विकलांगता से जुड़ी मान्यता और लाभों के लिए समर्थन।",
  pa: "ਸਿਵਲ ਅਯੋਗਤਾ ਨਾਲ ਸੰਬੰਧਿਤ ਮਾਨਤਾ ਅਤੇ ਲਾਭਾਂ ਲਈ ਸਹਾਇਤਾ।",
  "hi-Latn": "Viklangta ke labh ke liye sahayata."
},
"patronato.service.assegni": {
  it: "Domande e aggiornamenti per gli assegni destinati alle famiglie.",
  en: "Applications and updates for family allowance benefits.",
  hi: "परिवार भत्ते के लिए आवेदन और अद्यतन।",
  pa: "ਪਰਿਵਾਰ ਭੱਤੇ ਲਈ ਅਰਜ਼ੀਆਂ ਅਤੇ ਅਪਡੇਟ।",
  "hi-Latn": "Parivar bhatta ke liye aavedan aur update."
},
"patronato.service.naspi": {
  it: "Richiesta dell’indennità di disoccupazione e assistenza nelle procedure.",
  en: "Unemployment benefit request and procedure assistance.",
  hi: "बेरोजगारी भत्ते के लिए अनुरोध और प्रक्रिया में सहायता।",
  pa: "ਬੇਰੁਜ਼ਗਾਰੀ ਭੱਤੇ ਲਈ ਬੇਨਤੀ ਅਤੇ ਪ੍ਰਕਿਰਿਆ ਵਿੱਚ ਸਹਾਇਤਾ।",
  "hi-Latn": "Berojgari bhatta ke liye sahayata."
},
"patronato.service.malattia": {
  it: "Gestione delle pratiche legate a periodi di malattia e assenze dal lavoro.",
  en: "Handling of sickness-related and work absence cases.",
  hi: "बीमारी और कार्य से अनुपस्थिति से जुड़ी प्रक्रियाओं का प्रबंधन।",
  pa: "ਬੀਮਾਰੀ ਅਤੇ ਕੰਮ ਤੋਂ ਗੈਰਹਾਜ਼ਰੀ ਨਾਲ ਸੰਬੰਧਿਤ ਮਾਮਲਿਆਂ ਦਾ ਪ੍ਰਬੰਧ।",
  "hi-Latn": "Bimari aur kaam se gayrahazri ke mamle."
},
"patronato.service.maternita": {
  it: "Supporto per congedo, indennità e diritti legati alla maternità.",
  en: "Support for leave, benefits, and maternity rights.",
  hi: "छुट्टी, लाभ और मातृत्व अधिकारों के लिए समर्थन।",
  pa: "ਛੁੱਟੀ, ਭੱਤੇ ਅਤੇ ਮਾਤਰਤਵ ਅਧਿਕਾਰਾਂ ਲਈ ਸਹਾਇਤਾ।",
  "hi-Latn": "Maternity aur leave ke liye support."
},
"patronato.service.infortuni": {
  it: "Assistenza per le pratiche INAIL e tutela in caso di infortunio.",
  en: "INAIL support and protection in case of workplace injury.",
  hi: "कार्यस्थल पर चोट की स्थिति में INAIL सहायता और सुरक्षा।",
  pa: "ਕੰਮ ਦੀ ਥਾਂ 'ਤੇ ਚੋਟ ਦੇ ਮਾਮਲੇ ਵਿੱਚ INAIL ਸਹਾਇਤਾ ਅਤੇ ਸੁਰੱਖਿਆ।",
  "hi-Latn": "Injury ke case me INAIL support."
},
"patronato.service.welfare": {
  it: "Accesso agevolato ai servizi di welfare e sostegno sociale.",
  en: "Easy access to welfare and social support services.",
  hi: "कल्याण और सामाजिक सहायता सेवाओं तक आसान पहुंच।",
  pa: "ਭਲਾਈ ਅਤੇ ਸਮਾਜਿਕ ਸਹਾਇਤਾ ਸੇਵਾਵਾਂ ਤੱਕ ਆਸਾਨ ਪਹੁੰਚ।",
  "hi-Latn": "Welfare aur samajik support ke liye asaan pahunch."
},
"patronato.btn.book": {
  it: "Prenota ora",
  en: "Book now",
  hi: "अभी बुक करें",
  pa: "ਹੁਣ ਬੁੱਕ ਕਰੋ",
  "hi-Latn": "Abhi book karo"
},
// ================================
// Legal Assistance Page — i18n dictionary block
// ================================
"legal.title": {
  it: "Assistenza Legale",
  en: "Legal Assistance",
  hi: "कानूनी सहायता",
  pa: "ਕਾਨੂੰਨੀ ਸਹਾਇਤਾ",
  "hi-Latn": "Kanooni Sahayata"
},
"legal.desc": {
  "it": "Assistenza legale per stranieri a Lecce: permesso di soggiorno, cittadinanza italiana, ricongiungimento familiare e pratiche Prefettura e Questura con supporto multilingua.",
  "en": "Legal assistance for foreigners in Lecce: residence permits, Italian citizenship, family reunification, and Prefecture and Police Headquarters procedures with multilingual support.",
  "hi": "लेच्चे में विदेशियों के लिए कानूनी सहायता: परमेसो दी सोजोर्नो, इतालवी नागरिकता, परिवार पुनर्मिलन और प्रीफेक्चुरा व क्वेस्टुरा से जुड़ी प्रक्रियाएँ, बहुभाषी सहायता के साथ।",
  "pa": "ਲੇੱਚੇ ਵਿੱਚ ਵਿਦੇਸ਼ੀਆਂ ਲਈ ਕਾਨੂੰਨੀ ਸਹਾਇਤਾ: ਰਿਹਾਇਸ਼ ਪਰਮਿਟ, ਇਟਾਲੀਅਨ ਨਾਗਰਿਕਤਾ, ਪਰਿਵਾਰਕ ਮੁੜ ਮਿਲਾਪ ਅਤੇ ਪ੍ਰੀਫੈਕਚੁਰਾ ਤੇ ਕਵੇਸਟੂਰਾ ਦੀਆਂ ਪ੍ਰਕਿਰਿਆਵਾਂ, ਬਹੁਭਾਸ਼ੀ ਸਹਾਇਤਾ ਨਾਲ।",
  "hi-Latn": "Lecce me videshiyon ke liye legal assistance: permesso di soggiorno, Italian citizenship, family reunification aur Prefettura aur Questura ki procedures, multilingual support ke saath."
},
"legal.seo": {
  "it": "L’Assistenza Legale Ali Per La Liberta a Lecce offre supporto per permesso di soggiorno, cittadinanza italiana, ricongiungimento familiare, invio PEC e pratiche legali dedicate anche ai cittadini stranieri.",
  "en": "Ali Per La Liberta provides legal assistance in Lecce for residence permits, Italian citizenship, family reunification, PEC services and legal documentation.",
  "hi": "अली पर ला लिबर्टा लेच्चे में निवास परमिट, नागरिकता, पारिवारिक पुनर्मिलन और कानूनी दस्तावेज़ों के लिए कानूनी सहायता प्रदान करता है।",
  "pa": "ਅਲੀ ਪਰ ਲਾ ਲਿਬਰਤਾ ਲੇੱਚੇ ਵਿੱਚ ਰਿਹਾਇਸ਼ ਪਰਮਿਟ, ਨਾਗਰਿਕਤਾ, ਪਰਿਵਾਰਕ ਮਿਲਾਪ ਅਤੇ ਕਾਨੂੰਨੀ ਦਸਤਾਵੇਜ਼ਾਂ ਲਈ ਸਹਾਇਤਾ ਦਿੰਦਾ ਹੈ।",
  "hi-Latn": "Ali Per La Liberta Lecce me residence permit, citizenship, family reunification aur legal documents ke liye legal support deta hai."
},

"legal.services.ricongiungimento": {
  it: "Assistenza per la richiesta di ricongiungimento dei familiari.",
  en: "Assistance for family reunification applications.",
  hi: "पारिवारिक पुनर्मिलन के लिए सहायता।",
  pa: "ਪਰਿਵਾਰਕ ਮਿਲਾਪ ਲਈ ਸਹਾਇਤਾ।",
  "hi-Latn": "Parivarik punarmilan ke liye sahayata."
},
"legal.services.cittadinanza": {
  it: "Supporto completo per l’ottenimento della cittadinanza italiana.",
  en: "Complete support for obtaining Italian citizenship.",
  hi: "इतालवी नागरिकता प्राप्त करने के लिए पूर्ण सहायता।",
  pa: "ਇਟਾਲਵੀ ਨਾਗਰਿਕਤਾ ਪ੍ਰਾਪਤ ਕਰਨ ਲਈ ਪੂਰੀ ਸਹਾਇਤਾ।",
  "hi-Latn": "Italvi nagrikta prapt karne ke liye poori sahayata."
},
"legal.services.kit": {
  it: "Aiuto nella compilazione dei moduli e documenti ufficiali.",
  en: "Help in filling out official forms and documents.",
  hi: "आधिकारिक फॉर्म और दस्तावेज़ भरने में सहायता।",
  pa: "ਸਰਕਾਰੀ ਫਾਰਮਾਂ ਅਤੇ ਦਸਤਾਵੇਜ਼ ਭਰਨ ਵਿੱਚ ਸਹਾਇਤਾ।",
  "hi-Latn": "Aadhikarik form aur dastavej bharne mein sahayata."
},
"legal.services.rinnovo": {
  it: "Guida e assistenza nel rinnovo del permesso di soggiorno.",
  en: "Guidance and assistance in renewing residence permits.",
  hi: "निवास परमिट के नवीनीकरण में मार्गदर्शन और सहायता।",
  pa: "ਰਿਹਾਇਸ਼ ਪਰਮਿਟ ਦੇ ਨਵੀਨੀਕਰਨ ਵਿੱਚ ਸਹਾਇਤਾ।",
  "hi-Latn": "Nivaas permit ke navinikaran mein margdarshan aur sahayata."
},
"legal.services.testLingua": {
  it: "Iscrizione e preparazione al test di lingua per stranieri.",
  en: "Enrollment and preparation for the Italian language test for foreigners.",
  hi: "विदेशियों के लिए इतालवी भाषा परीक्षा के लिए पंजीकरण और तैयारी।",
  pa: "ਵਿਦੇਸ਼ੀਆਂ ਲਈ ਇਤਾਲਵੀ ਭਾਸ਼ਾ ਟੈਸਟ ਲਈ ਦਰਜਾ ਤੇ ਤਿਆਰੀ।",
  "hi-Latn": "Videshiyon ke liye Italian bhasha test ke liye panjikaran aur taiyaari."
},
"legal.services.rilascioCarta": {
  it: "Supporto per la richiesta della carta di soggiorno.",
  en: "Support for applying for a residence card.",
  hi: "निवास कार्ड के लिए आवेदन करने में सहायता।",
  pa: "ਰਿਹਾਇਸ਼ ਕਾਰਡ ਲਈ ਅਰਜ਼ੀ ਦੇਣ ਵਿੱਚ ਸਹਾਇਤਾ।",
  "hi-Latn": "Nivaas card ke liye aavedan karne mein sahayata."
},
"legal.services.aggiornamentoCarta": {
  it: "Assistenza per aggiornare i dati nella carta di soggiorno.",
  en: "Assistance for updating data in the residence card.",
  hi: "निवास कार्ड में जानकारी अपडेट करने के लिए सहायता।",
  pa: "ਰਿਹਾਇਸ਼ ਕਾਰਡ ਵਿੱਚ ਜਾਣਕਾਰੀ ਅਪਡੇਟ ਕਰਨ ਲਈ ਸਹਾਇਤਾ।",
  "hi-Latn": "Nivaas card mein jankari update karne ke liye sahayata."
},
"legal.services.pec": {
  it: "Invio pratiche ufficiali tramite PEC per appuntamenti e comunicazioni.",
  en: "Sending official requests via PEC for appointments and communications.",
  hi: "अपॉइंटमेंट और संचार के लिए PEC के माध्यम से आधिकारिक अनुरोध भेजना।",
  pa: "ਮੁਲਾਕਾਤਾਂ ਅਤੇ ਸੰਚਾਰ ਲਈ PEC ਰਾਹੀਂ ਅਧਿਕਾਰਿਕ ਬੇਨਤੀਆਂ ਭੇਜਣਾ।",
  "hi-Latn": "Appointment aur sanchar ke liye PEC ke madhyam se adhikarik anurodh bhejna."
},

"legal.button.book": {
  it: "Prenota ora",
  en: "Book now",
  hi: "अभी बुक करें",
  pa: "ਹੁਣੇ ਬੁੱਕ ਕਰੋ",
  "hi-Latn": "Abhi book karo"
},
"patronato.otherServices.title": {
  it: "Altri servizi utili presso Ali Per La Liberta",
  en: "Other useful services at Ali Per La Liberta",
  hi: "Ali Per La Liberta में उपलब्ध अन्य उपयोगी सेवाएं",
  pa: "Ali Per La Liberta 'ਚ ਉਪਲਬਧ ਹੋਰ ਲਾਭਦਾਇਕ ਸੇਵਾਵਾਂ",
  "hi-Latn": "Ali Per La Liberta me available anya useful services"
},

"patronato.otherServices.part1": {
  it: "Oltre ai servizi di Patronato a Lecce, offriamo anche",
  en: "In addition to Patronato services in Lecce, we also offer",
  hi: "लेच्चे में Patronato सेवाओं के अलावा, हम यह भी प्रदान करते हैं",
  pa: "ਲੇੱਚੇ ਵਿੱਚ Patronato ਸੇਵਾਵਾਂ ਤੋਂ ਇਲਾਵਾ, ਅਸੀਂ ਇਹ ਵੀ ਪ੍ਰਦਾਨ ਕਰਦੇ ਹਾਂ",
  "hi-Latn": "Lecce me Patronato services ke alawa, hum ye bhi provide karte hain"
},

"patronato.otherServices.linkCaf": {
  it: "assistenza CAF",
  en: "CAF assistance",
  hi: "CAF सहायता",
  pa: "CAF ਸਹਾਇਤਾ",
  "hi-Latn": "CAF sahayata"
},

"patronato.otherServices.part2": {
  it: "per ISEE, Modello 730 e pratiche fiscali, e",
  en: "for ISEE, 730 forms and tax procedures, and",
  hi: "ISEE, 730 और कर प्रक्रियाओं के लिए, और",
  pa: "ISEE, 730 ਅਤੇ ਟੈਕਸ ਕਾਰਵਾਈਆਂ ਲਈ, ਅਤੇ",
  "hi-Latn": "ISEE, 730 aur tax procedures ke liye, aur"
},

"patronato.otherServices.linkLegal": {
  it: "assistenza legale per stranieri",
  en: "legal assistance for foreigners",
  hi: "विदेशियों के लिए कानूनी सहायता",
  pa: "ਵਿਦੇਸ਼ੀਆਂ ਲਈ ਕਾਨੂੰਨੀ ਸਹਾਇਤਾ",
  "hi-Latn": "foreigners ke liye legal assistance"
},

"patronato.otherServices.part3": {
  it: "per permessi di soggiorno, cittadinanza e pratiche Prefettura.",
  en: "for residence permits, citizenship and Prefecture procedures.",
  hi: "निवास परमिट, नागरिकता और प्रीफेक्चर प्रक्रियाओं के लिए।",
  pa: "ਰਹਾਇਸ਼ ਪਰਮਿਟ, ਨਾਗਰਿਕਤਾ ਅਤੇ ਪ੍ਰੀਫੈਕਚਰ ਕਾਰਵਾਈਆਂ ਲਈ।",
  "hi-Latn": "residence permit, citizenship aur Prefettura procedures ke liye."
},

"legal.otherServices.title": {
  it: "Altri servizi disponibili presso Ali Per La Liberta",
  en: "Other services available at Ali Per La Liberta",
  hi: "Ali Per La Liberta में उपलब्ध अन्य सेवाएं",
  pa: "Ali Per La Liberta 'ਚ ਉਪਲਬਧ ਹੋਰ ਸੇਵਾਵਾਂ",
  "hi-Latn": "Ali Per La Liberta me available anya services"
},

"legal.otherServices.part1": {
  it: "Oltre all’assistenza legale per stranieri a Lecce, Ali Per La Liberta offre",
  en: "In addition to legal assistance for foreigners in Lecce, Ali Per La Liberta offers",
  hi: "लेच्चे में विदेशियों के लिए कानूनी सहायता के अलावा, Ali Per La Liberta प्रदान करता है",
  pa: "ਲੇੱਚੇ ਵਿੱਚ ਵਿਦੇਸ਼ੀਆਂ ਲਈ ਕਾਨੂੰਨੀ ਸਹਾਇਤਾ ਤੋਂ ਇਲਾਵਾ, Ali Per La Liberta ਪ੍ਰਦਾਨ ਕਰਦਾ ਹੈ",
  "hi-Latn": "Lecce me foreigners ke liye legal assistance ke alawa, Ali Per La Liberta offer karta hai"
},

"legal.otherServices.linkCaf": {
  it: "servizi CAF",
  en: "CAF services",
  hi: "CAF सेवाएं",
  pa: "CAF ਸੇਵਾਵਾਂ",
  "hi-Latn": "CAF services"
},

"legal.otherServices.part2": {
  it: "per pratiche fiscali come ISEE e Modello 730, e",
  en: "for tax procedures such as ISEE and Form 730, and",
  hi: "ISEE और 730 जैसे कर कार्यों के लिए, और",
  pa: "ISEE ਅਤੇ 730 ਵਰਗੀਆਂ ਟੈਕਸ ਕਾਰਵਾਈਆਂ ਲਈ, ਅਤੇ",
  "hi-Latn": "ISEE aur Modello 730 jaise tax kaamon ke liye, aur"
},

"legal.otherServices.linkPatronato": {
  it: "servizi di Patronato",
  en: "Patronato services",
  hi: "Patronato सेवाएं",
  pa: "Patronato ਸੇਵਾਵਾਂ",
  "hi-Latn": "Patronato services"
},

"legal.otherServices.part3": {
  it: "per pensioni, NASpI e assistenza sociale.",
  en: "for pensions, NASpI and social assistance.",
  hi: "पेंशन, NASpI और सामाजिक सहायता के लिए।",
  pa: "ਪੈਨਸ਼ਨ, NASpI ਅਤੇ ਸਮਾਜਿਕ ਸਹਾਇਤਾ ਲਈ।",
  "hi-Latn": "pension, NASpI aur social assistance ke liye."
},


"caf.otherServices.title": {
  it: "Altri servizi disponibili presso Ali Per La Liberta",
  en: "Other services available at Ali Per La Liberta",
  hi: "Ali Per La Liberta में उपलब्ध अन्य सेवाएं",
  pa: "Ali Per La Liberta 'ਚ ਉਪਲਬਧ ਹੋਰ ਸੇਵਾਵਾਂ",
  "hi-Latn": "Ali Per La Liberta me available anya services"
},

"caf.otherServices.part1": {
  it: "Oltre ai servizi CAF online in Italia, Ali Per La Liberta offre anche",
  en: "In addition to online CAF services in Italy, Ali Per La Liberta also offers",
  hi: "इटली में ऑनलाइन CAF सेवाओं के अलावा, Ali Per La Liberta प्रदान करता है",
  pa: "ਇਟਲੀ ਵਿੱਚ ਆਨਲਾਈਨ CAF ਸੇਵਾਵਾਂ ਤੋਂ ਇਲਾਵਾ, Ali Per La Liberta ਪ੍ਰਦਾਨ ਕਰਦਾ ਹੈ",
  "hi-Latn": "Italy me online CAF services ke alawa, Ali Per La Liberta offer karta hai"
},

"caf.otherServices.linkPatronato": {
  it: "servizi di Patronato",
  en: "Patronato services",
  hi: "Patronato सेवाएं",
  pa: "Patronato ਸੇਵਾਵਾਂ",
  "hi-Latn": "Patronato services"
},

"caf.otherServices.part2": {
  it: "per pensioni, NASpI e assistenza sociale, e",
  en: "for pensions, NASpI and social assistance, and",
  hi: "पेंशन, NASpI और सामाजिक सहायता के लिए, और",
  pa: "ਪੈਨਸ਼ਨ, NASpI ਅਤੇ ਸਮਾਜਿਕ ਸਹਾਇਤਾ ਲਈ, ਅਤੇ",
  "hi-Latn": "pension, NASpI aur social assistance ke liye, aur"
},

"caf.otherServices.linkLegal": {
  it: "assistenza legale per stranieri",
  en: "legal assistance for foreigners",
  hi: "विदेशियों के लिए कानूनी सहायता",
  pa: "ਵਿਦੇਸ਼ੀਆਂ ਲਈ ਕਾਨੂੰਨੀ ਸਹਾਇਤਾ",
  "hi-Latn": "foreigners ke liye legal assistance"
},

"caf.otherServices.part3": {
  it: "per permessi di soggiorno, cittadinanza e ricongiungimento familiare.",
  en: "for residence permits, citizenship and family reunification.",
  hi: "निवास परमिट, नागरिकता और पारिवारिक पुनर्मिलन के लिए।",
  pa: "ਰਿਹਾਇਸ਼ ਪਰਮਿਟ, ਨਾਗਰਿਕਤਾ ਅਤੇ ਪਰਿਵਾਰਕ ਮਿਲਾਪ ਲਈ।",
  "hi-Latn": "residence permit, citizenship aur family reunification ke liye."
}

  };

  const SQ = {
    "nav.brand": "AliPerLaLiberta",
    "nav.home": "Kreu",
    "nav.call": "Telefono",
    "call.hoursLabel": "Orari: Hën–Prem 08:30–13:30 · 16:30–19:30",
    "nav.email": "Email",
    "nav.pec": "PEC",
    "nav.youtube": "YouTube",
    "drawer.close": "Mbyll menunë",

    "home.eyebrow": "Shoqatë në Lecce",
    "home.title": "Çdo person meriton të ndihet i dëgjuar, i orientuar dhe i lirë.",
    "home.lead": "Ali Per La Libertà është një pikë referimi për qytetarët italianë dhe të huaj. Ne i ndihmojmë njerëzit të kuptojnë dokumentet, të drejtat dhe mundësitë, duke ofruar mbështetje konkrete dhe të arritshme.",
    "home.cta.about": "Njih shoqatën",
    "home.cta.services": "Shiko si mund të të ndihmojmë",
    "home.mission.eyebrow": "Misioni ynë",
    "home.mission.title": "Të zvogëlojmë distancën mes njerëzve dhe të drejtave të tyre.",
    "home.mission.text": "Burokracia, gjuha ose mungesa e informacionit nuk duhet të lënë askënd pas. Prandaj ne i bëjmë të kuptueshme edhe proceset më të ndërlikuara.",
    "home.value.listen.title": "Dëgjim",
    "home.value.listen.text": "Nisim nga historia dhe nevojat reale të çdo personi, pa gjykim dhe me respekt.",
    "home.value.clarity.title": "Qartësi",
    "home.value.clarity.text": "Shpjegojmë procedurat dhe mundësitë me fjalë të kuptueshme, edhe në disa gjuhë.",
    "home.value.action.title": "Mbështetje konkrete",
    "home.value.action.text": "I shoqërojmë njerëzit në hapat e nevojshëm, nga pyetja e parë deri te zgjidhja.",
    "home.story.title": "Një vend pranë njerëzve, i hapur ndaj dallimeve.",
    "home.story.text": "Ali Per La Libertà ka lindur për të krijuar autonomi, përfshirje dhe besim. Ne lidhim njerëzit me shërbime dhe kompetenca, që secili të marrë pjesë plotësisht në jetën shoqërore dhe të ndërtojë të ardhmen me më shumë qetësi.",
    "home.services.eyebrow": "Si të ndihmojmë",
    "home.services.title": "Orientim dhe asistencë kur duhen vërtet.",
    "home.services.text": "Puna jonë përfshin asistencë fiskale, sociale dhe ligjore. Të ndihmojmë të kuptosh rrugën më të përshtatshme për situatën tënde.",
    "home.services.link": "Mëso më shumë →",
    "home.services.book": "Rezervo takim",
    "home.contact.title": "Nuk di nga të fillosh?",
    "home.contact.text": "Na trego shkurt nevojën tënde. Do të të dëgjojmë dhe do të të tregojmë shërbimin ose rrugën më të përshtatshme.",
    "home.contact.cta": "Fol me ne",
    "serviceBot.eyebrow": "Asistent WhatsApp",
    "serviceBot.launcher": "Ke nevojë?",
    "serviceBot.close": "Mbyll chat-in",
    "serviceBot.title": "Nuk di cilin shërbim të zgjedhësh?",
    "serviceBot.text": "Përgjigju disa pyetjeve: ne përgatisim një mesazh të rregullt për ta dërguar në WhatsApp nga numri yt.",
    "serviceBot.next": "Vazhdo",
    "serviceBot.restart": "Rifillo",
    "serviceBot.whatsapp": "Dërgo në WhatsApp",
    "serviceBot.note": "Faqja nuk dërgon asgjë automatikisht: WhatsApp hapet dhe ti shtyp “Dërgo”.",

    "services.caf.title": "CAF (Qendra e Asistencës Fiskale)",
    "services.caf.desc": "Të ndihmojmë me praktikat fiskale si deklarata e të ardhurave, ISEE, Modeli 730 dhe procedura të tjera tatimore, në mënyrë të thjeshtë dhe të shpejtë.",
    "caf.desc": "CAF Ali Per La Libertà ofron asistencë fiskale online dhe në Itali për qytetarë të huaj dhe italianë, përfshirë ISEE, Modelin 730, F24, RED dhe bonuse, me mbështetje shumëgjuhëshe.",
    "services.patronato.title": "Patronato",
    "services.patronato.desc": "Ofrojmë mbështetje për pensione, ndihma, papunësi dhe praktika të tjera sociale ose asistenciale me këshillim të personalizuar.",
    "services.legal.title": "Asistencë ligjore / Mbështetje",
    "services.legal.desc": "Ndihmë ligjore e qartë dhe e arritshme për kontrata, dokumente, mosmarrëveshje ose probleme që lidhen me të drejtat e punës dhe civile.",
    "services.corsi.title": "Kurse formimi",
    "services.corsi.desc": "Kurse profesionale dhe përditësime formuese për të përmirësuar aftësitë dhe për të gjetur mundësi të reja pune.",
    "services.italianCourse.title": "Kurs i gjuhës italiane A1 dhe A2",
    "services.italianCourse.desc": "Kurse bazë të italishtes për të komunikuar më mirë, për t’u përgatitur për dokumentet dhe për të jetuar me më shumë autonomi.",
    "services.web.title": "Krijim faqesh web",
    "services.web.desc": "Realizojmë faqe web profesionale dhe moderne për kompani, profesionistë të lirë ose biznese të vogla, duke u kujdesur për dizajnin dhe funksionalitetin.",
    "services.biglietti.title": "Bileta & mbështetje E-Visa",
    "services.biglietti.desc": "Rezervime për trena, autobusë dhe avionë. Ndihmojmë edhe për marrjen e eVisa për udhëtime jashtë vendit në mënyrë të shpejtë dhe të sigurt.",
    "hero.cta.discover": "Shiko shërbimin",
    "hero.cta.share": "Shpërndaj",
    "detail.cta.request": "Kërko asistencë",
    "detail.cta.share": "Shpërndaj",

    "footer.title.contacts": "Kontakte & orare",
    "footer.phone": "Telefon / WhatsApp",
    "footer.email": "Email",
    "footer.address.label": "Adresa",
    "footer.hours": "Orari: Hën–Prem 08:30–13:30 · 16:30–19:30",
    "footer.hours.label": "Orari:",
    "footer.hours.value": "Hën–Prem 08:30–13:30 · 16:30–19:30",
    "footer.openwith": "Hap me",
    "footer.maps.openwith": "Hap me…",
    "footer.maps.google": "Google Maps",
    "footer.maps.apple": "Apple Maps",
    "footer.maps.remember": "Mbaje mend zgjedhjen",
    "footer.title.legal": "Ligjore",
    "footer.privacy": "Politika e privatësisë",
    "footer.terms": "Kushtet e shërbimit",
    "footer.cookies": "Politika e cookies",
    "footer.legalnotes": "Shënime ligjore",
    "footer.rights": "© 2025 AliPerLaLiberta — Të gjitha të drejtat të rezervuara.",
    "footer.copyright": "© 2026 Ali Per La Libertà — Të gjitha të drejtat të rezervuara.",
    "footer.piva": "Kodi fiskal: 93173080750",

    "caf.title": "CAF (Qendra e Asistencës Fiskale)",
    "caf.services.isee": "Përgatitja dhe dërgimi i deklaratës ISEE.",
    "caf.services.730": "Deklarata e të ardhurave me asistencë profesionale.",
    "caf.otherServices.part1": "Ofrojmë edhe",
    "caf.otherServices.part2": "asistencë ligjore për të huaj",
    "caf.otherServices.part3": "për leje qëndrimi, shtetësi dhe bashkim familjar."
  };

  Object.entries(SQ).forEach(([key, value]) => {
    if (!T[key]) T[key] = {};
    T[key].sq = value;
  });

  // ---------------------------
  // Apply translations (+ Safari repaint nudge)
  // ---------------------------
  function applyTranslations(root = document) {
    const lang = getLangFromStorage();
    if (!lang) return;

    // Text nodes
    root.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const txt = T[key]?.[lang] ?? T[key]?.it;
      if (typeof txt === "string") el.textContent = txt;
    });

    // Attribute translations: data-i18n-attr="aria-label:drawer.close, title:nav.home"
    root.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      const spec = el.getAttribute("data-i18n-attr");
      if (!spec) return;
      spec.split(",").forEach((pair) => {
        const [attr, key] = pair.split(":").map((s) => s.trim());
        const val = T[key]?.[lang] ?? T[key]?.it;
        if (attr && typeof val === "string") el.setAttribute(attr, val);
      });
    });

    // Repaint nudge to avoid Safari/WebKit stale glass layers
    repaintCards();

    // Optional event for any listeners
    try {
      document.dispatchEvent(new CustomEvent("language:change", { detail: { lang } }));
    } catch {}
  }

  // Gently force reflow/repaint for glass cards (fixes Safari glitches)
  function repaintCards() {
    const cards = document.querySelectorAll(".hero-card");
    cards.forEach((c) => {
      c.style.transform = "translateZ(0)";
      void c.offsetHeight; // reflow
      c.style.transform = "";
    });
  }

  // ---------------------------
  // Language selectors
  // ---------------------------
  function wireSelectors() {
    const selects = Array.from(document.querySelectorAll("select.lang-select"));
    if (!selects.length) return;

    // Populate once
    selects.forEach((sel) => {
      if (sel.dataset.populated === "true") return;
      const frag = document.createDocumentFragment();
      Object.entries(LANGS).forEach(([value, label]) => {
        const opt = document.createElement("option");
        opt.value = value; opt.textContent = label;
        frag.appendChild(opt);
      });
      sel.appendChild(frag);
      sel.dataset.populated = "true";
    });

    // Sync current saved language (if any)
    const current = getLangFromStorage();
    if (current) syncSelectors(current);

    // On change: save + apply
    const onChange = (e) => {
      const lang = e.currentTarget.value || "it";
      setLangWithExpiry(lang, EXPIRY_MS);
      applyTranslations(document);
    };
    selects.forEach((sel) => {
      sel.removeEventListener("change", onChange); // prevent double-binding
      sel.addEventListener("change", onChange);
    });
  }

  function syncSelectors(lang) {
    document.querySelectorAll("select.lang-select").forEach((sel) => {
      sel.value = lang;
    });
  }

  // ---------------------------
  // Init
  // ---------------------------
  function init() {
    wireSelectors();
    applyTranslations(document);
  }

  // Public API (for welcome.js, etc.)
  window.LanguageSelector = {
    init,
    set: (lang, ttl = EXPIRY_MS) => {
      setLangWithExpiry(lang, ttl);
      applyTranslations(document);
    },
    get: () => getLangFromStorage(),
    LANGS
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
