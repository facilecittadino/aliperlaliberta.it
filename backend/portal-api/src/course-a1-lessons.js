const commonMiniTest = [
  "Leggi e scegli vero o falso.",
  "Compila o scrivi 20-25 parole.",
  "Presentati.",
  "Descrivi la situazione proposta.",
  "Rispondi agli annunci con 1-2 parole."
];

const lesson = (data) => ({ ...data, miniTest: commonMiniTest });

export const courseA1Lessons = Object.freeze([
  lesson({
    number: 1,
    title: "Saluti e presentazioni",
    subtitle: "Presentarsi e iniziare una conversazione",
    lessons: "Lezioni 1-3",
    introduction: {
      albanese: "Në këtë njësi studenti mëson të përshëndesë, të prezantohet dhe të përdorë foljen essere në fjali shumë të thjeshta.",
      hindi: "इस इकाई में विद्यार्थी अभिवादन करना, अपना परिचय देना और essere क्रिया के सरल रूप प्रयोग करना सीखता है।"
    },
    objectives: ["Salutare in modo formale e informale", "Dire e chiedere il nome", "Dire la provenienza", "Rispondere a “Come stai?”", "Presentarsi in 5-6 frasi"],
    grammar: {
      it: "Pronomi personali soggetto; verbo essere; tu e Lei; formule di cortesia.",
      albanese: "Përemrat vetorë; folja essere; përdorimi i tu dhe Lei; formulat e mirësjelljes.",
      hindi: "कर्ता सर्वनाम; essere क्रिया; tu और Lei का प्रयोग; शिष्टाचार के वाक्य।"
    },
    vocabulary: [
      ["ciao", "përshëndetje", "चाओ", "नमस्ते"], ["buongiorno", "mirëmëngjes / mirëdita", "बुओनजोरनो", "सुप्रभात / नमस्कार"],
      ["buonasera", "mirëmbrëma", "बुओनासेरा", "शुभ संध्या"], ["mi chiamo", "quhem", "मी क्यामो", "मेरा नाम है"],
      ["piacere", "kënaqësi", "प्याचेरे", "आपसे मिलकर खुशी हुई"], ["sono", "jam", "सोनो", "मैं हूँ"],
      ["italiano", "italisht / italian", "इतालियानो", "इतालवी"], ["bene", "mirë", "बेने", "अच्छा / ठीक"]
    ],
    dialogue: ["A: Buongiorno, mi chiamo Sara. E Lei?", "B: Buongiorno, sono Arben. Piacere.", "A: Piacere mio. Di dov’è?", "B: Sono albanese e vivo a Lecce."],
    reading: { text: "Ciao! Mi chiamo Priya. Sono indiana e vivo a Bari. Sono studentessa. Parlo hindi, inglese e un po’ di italiano. Oggi è il mio primo giorno di corso.", questions: ["Come si chiama la ragazza?", "Di dov’è?", "Dove vive?", "Quali lingue parla?"] },
    listening: [
      { title: "Dialogo o monologo", file: "U01_Audio_1_dialogo_o_monologo.mp3", questions: ["Come si chiama il ragazzo?", "Dove vive Luca?", "Come si chiama la ragazza?", "Di dov’è Amina?"] },
      { title: "Annunci e informazioni", file: "U01_Audio_2_annunci_e_informazioni.mp3", questions: ["Qual è il cognome di Elena?", "Che lavoro fa Elena?", "Quanti studenti sono nominati?", "Di dov’è Ravi?"] }
    ],
    grammarExercises: ["Io ___ Sara. (essere)", "Tu ___ Ahmed.", "Lei ___ italiana.", "Noi ___ studenti.", "Voi ___ amici."],
    writing: "Compila una scheda con nome, cognome, nazionalità, città e lingue. Poi scrivi 5 frasi per presentarti.",
    oral: ["Come ti chiami?", "Di dove sei?", "Dove vivi?", "Quali lingue parli?", "Come stai oggi?"],
    task: "Immagina un incontro tra due persone: dove sono, si conoscono e come si salutano?"
  }),
  lesson({
    number: 2,
    title: "Dati personali, alfabeto e moduli",
    subtitle: "Fare lo spelling e compilare dati essenziali",
    lessons: "Lezioni 4-6",
    introduction: { albanese: "Studenti mëson alfabetin, numrat dhe si të plotësojë një formular me të dhëna personale.", hindi: "विद्यार्थी इतालवी वर्णमाला, संख्याएँ और व्यक्तिगत जानकारी वाला फॉर्म भरना सीखता है।" },
    objectives: ["Fare lo spelling del nome e del cognome", "Capire lettere e numeri", "Chiedere di ripetere", "Compilare un modulo", "Dire telefono, indirizzo e data di nascita"],
    grammar: { it: "Alfabeto; chiamarsi; numeri 0-100; formule “Può ripetere?” e “Come si scrive?”.", albanese: "Alfabeti; folja chiamarsi; numrat 0-100; si të kërkosh përsëritjen dhe drejtshkrimin.", hindi: "वर्णमाला; chiamarsi क्रिया; 0-100 तक संख्याएँ; दोहराने और वर्तनी पूछने के वाक्य।" },
    vocabulary: [["nome","emër","नोमे","नाम"],["cognome","mbiemër","कोन्योमे","उपनाम"],["indirizzo","adresë","इन्दिरित्सो","पता"],["telefono","telefon","तेलेफोनो","फ़ोन"],["firma","firmë","फिर्मा","हस्ताक्षर"],["lettera","shkronjë","लेत्तेरा","अक्षर"],["numero","numër","नूमेरो","संख्या"],["ripetere","përsëris","रिपेतेरे","दोहराना"]],
    dialogue: ["Impiegata: Buongiorno. Come si chiama?", "Studente: Mi chiamo Ravi Kumar.", "Impiegata: Può fare lo spelling del cognome?", "Studente: K-U-M-A-R.", "Impiegata: Qual è il suo numero di telefono?", "Studente: Tre, due, sette, cinque, otto, quattro, nove, uno, zero."],
    reading: { text: "Corso di italiano A1. Iscrizioni dal lunedì al venerdì, dalle 9 alle 12. Portare documento, codice fiscale e una fotografia. Segreteria: via Roma 18, Lecce.", questions: ["Quando è aperta la segreteria?", "Qual è l’orario?", "Che cosa bisogna portare?", "Qual è l’indirizzo?"] },
    listening: [
      { title: "Dialogo o monologo", file: "U02_Audio_1_dialogo_o_monologo.mp3", questions: ["Qual è il nome?", "Qual è il cognome?", "Qual è la prima lettera del cognome?", "Qual è l’ultima cifra del telefono?"] },
      { title: "Annunci e informazioni", file: "U02_Audio_2_annunci_e_informazioni.mp3", questions: ["Che cosa bisogna compilare?", "Dove bisogna firmare?", "Scrivi tre dati richiesti."] }
    ],
    grammarExercises: ["Scrivi in lettere: 18", "Scrivi in cifre: trentadue", "Completa: Mi ___ Arjun.", "Forma la domanda: cognome / il / qual è / suo?", "Scegli: Può ripetere / Sei ripetere?"],
    writing: "Compila un modulo d’iscrizione con dati inventati. Scrivi 20-25 parole complessive.",
    oral: ["Fai lo spelling del tuo cognome.", "Detta un numero di telefono.", "Chiedi all’insegnante di ripetere.", "Di’ la tua data di nascita."],
    task: "Quali dati riconosci in un modulo? In quale situazione si compila?"
  }),
  lesson({
    number: 3,
    title: "Famiglia e persone",
    subtitle: "Parlare della famiglia e descrivere relazioni",
    lessons: "Lezioni 7-9",
    introduction: { albanese: "Njësia trajton familjen, moshën dhe përdorimin bazë të foljes avere.", hindi: "यह इकाई परिवार, उम्र और avere क्रिया के मूल प्रयोग पर केंद्रित है।" },
    objectives: ["Presentare i membri della famiglia", "Dire età e professione", "Usare avere nelle espressioni di base", "Riconoscere maschile/femminile e singolare/plurale", "Descrivere una fotografia di famiglia"],
    grammar: { it: "Verbo avere; articoli determinativi; genere e numero; possessivi mio/mia e tuo/tua.", albanese: "Folja avere; nyjat e shquara; gjinia dhe numri; pronorët mio/mia dhe tuo/tua.", hindi: "avere क्रिया; निश्चित लेख; लिंग और वचन; mio/mia तथा tuo/tua।" },
    vocabulary: [["famiglia","familje","फामील्या","परिवार"],["madre","nënë","माद्रे","माँ"],["padre","baba","पाद्रे","पिता"],["fratello","vëlla","फ्रातेल्लो","भाई"],["sorella","motër","सोरेल्ला","बहन"],["figlio","djalë / bir","फील्यो","बेटा"],["figlia","vajzë / bijë","फील्या","बेटी"],["anni","vjeç","आन्नी","वर्ष / साल"]],
    dialogue: ["A: Questa è la mia famiglia.", "B: Chi è questa signora?", "A: È mia madre. Si chiama Lule e ha cinquantadue anni.", "B: E questo ragazzo?", "A: È mio fratello. Ha vent’anni ed è studente."],
    reading: { text: "La famiglia di Rakesh vive a Bologna. Rakesh ha trentacinque anni ed è cuoco. Sua moglie Meena ha trentadue anni e lavora in un negozio. Hanno due figli: Arjun ha otto anni e Tara ha cinque anni.", questions: ["Dove vive la famiglia?", "Quanti anni ha Rakesh?", "Che lavoro fa Meena?", "Quanti figli hanno?"] },
    listening: [
      { title: "Dialogo o monologo", file: "U03_Audio_1_dialogo_o_monologo.mp3", questions: ["Quante persone sono nella famiglia?", "Come si chiama il marito?", "Quante figlie hanno?", "Quanti anni ha Giulia?"] },
      { title: "Annunci e informazioni", file: "U03_Audio_2_annunci_e_informazioni.mp3", questions: ["Chi è a sinistra?", "Chi è accanto al nonno?", "Di che colore è la maglietta del ragazzo?", "Che cosa indossa la bambina?"] }
    ],
    grammarExercises: ["Io ___ due fratelli.", "Mia madre ___ 60 anni.", "Completa: ___ padre si chiama Ali.", "Plurale: la sorella → ___", "Femminile: il figlio → ___"],
    writing: "Scrivi 6-8 frasi sulla tua famiglia o su una famiglia inventata.",
    oral: ["Quante persone ci sono nella tua famiglia?", "Hai fratelli o sorelle?", "Come si chiama tua madre?", "Che lavoro fa una persona della tua famiglia?"],
    task: "Descrivi una famiglia: numero di persone, età approssimativa, posizione e abbigliamento."
  }),
  lesson({
    number: 4,
    title: "La casa e gli oggetti",
    subtitle: "Descrivere una casa e indicare dove sono le cose",
    lessons: "Lezioni 10-12",
    introduction: { albanese: "Studenti përshkruan shtëpinë dhe pozicionin e objekteve me c’è / ci sono.", hindi: "विद्यार्थी c’è / ci sono का प्रयोग करके घर और वस्तुओं की स्थिति बताता है।" },
    objectives: ["Nominare stanze e mobili", "Dire che cosa c’è in una stanza", "Localizzare oggetti", "Capire semplici annunci immobiliari", "Descrivere la propria casa"],
    grammar: { it: "C’è / ci sono; preposizioni semplici; articoli; questo/questa.", albanese: "C’è / ci sono; parafjalët e thjeshta; nyjat; questo/questa.", hindi: "C’è / ci sono; सरल पूर्वसर्ग; लेख; questo/questa।" },
    vocabulary: [["casa","shtëpi","काज़ा","घर"],["cucina","kuzhinë","कुचीना","रसोई"],["camera","dhomë","कामेरा","कमरा"],["bagno","banjë","बान्यो","स्नानघर"],["tavolo","tavolinë","तावोलो","मेज़"],["sedia","karrige","सेद्या","कुर्सी"],["letto","krevat","लेत्तो","बिस्तर"],["finestra","dritare","फिनेस्ट्रा","खिड़की"]],
    dialogue: ["A: Com’è la tua casa?", "B: È piccola ma luminosa.", "A: Quante camere ci sono?", "B: Ci sono due camere, una cucina e un bagno.", "A: Dov’è il tavolo?", "B: È vicino alla finestra."],
    reading: { text: "Affittasi appartamento: una camera, cucina, bagno e piccolo balcone. La casa è vicino alla stazione e al supermercato. Terzo piano senza ascensore. Telefono 333 820 741.", questions: ["Quante camere ci sono?", "C’è un balcone?", "Vicino a quali luoghi è la casa?", "C’è l’ascensore?"] },
    listening: [
      { title: "Dialogo o monologo", file: "U04_Audio_1_dialogo_o_monologo.mp3", questions: ["Che cosa c’è nel salotto?", "Dov’è il tavolino?", "Quante fotografie ci sono?", "Dov’è la pianta?"] },
      { title: "Annunci e informazioni", file: "U04_Audio_2_annunci_e_informazioni.mp3", questions: ["Dove va il libro?", "Dov’è la borsa?", "Dove sono le chiavi?", "Dov’è il telefono?"] }
    ],
    grammarExercises: ["In cucina ___ un tavolo.", "In camera ___ due letti.", "Il libro è ___ tavolo.", "La borsa è ___ sedia.", "Plurale: la finestra → ___"],
    writing: "Descrivi la tua casa in 25-35 parole. Indica stanze, mobili e posizione di due oggetti.",
    oral: ["Quante stanze ha la tua casa?", "Dov’è la cucina?", "Che cosa c’è nella tua camera?", "Ti piace la tua casa? Perché?"],
    task: "Descrivi una stanza usando c’è, ci sono, vicino a, sopra, sotto e davanti a."
  }),
  lesson({
    number: 5,
    title: "La giornata e gli orari",
    subtitle: "Raccontare una routine quotidiana",
    lessons: "Lezioni 13-15",
    introduction: { albanese: "Njësia paraqet rutinën ditore, orën dhe foljet e rregullta në të tashmen.", hindi: "यह इकाई दैनिक दिनचर्या, समय और वर्तमान काल की नियमित क्रियाएँ सिखाती है।" },
    objectives: ["Dire l’ora", "Raccontare la propria giornata", "Usare verbi regolari al presente", "Usare mi sveglio, mi alzo, mi preparo", "Capire semplici orari di lavoro o corso"],
    grammar: { it: "Presente dei verbi regolari; verbi riflessivi di base; ore; avverbi di frequenza.", albanese: "E tashmja e foljeve të rregullta; foljet vetvetore; ora; ndajfoljet e shpeshtësisë.", hindi: "नियमित क्रियाओं का वर्तमान काल; मूल आत्मवाचक क्रियाएँ; समय; आवृत्ति के क्रियाविशेषण।" },
    vocabulary: [["svegliarsi","zgjohem","ज़्वेल्यार्सी","जागना"],["alzarsi","ngrihem","आल्त्सार्सी","उठना"],["colazione","mëngjes","कोलात्स्योने","नाश्ता"],["lavorare","punoj","लावोरारे","काम करना"],["studiare","studioj","स्तूद्यारे","पढ़ना"],["pranzare","ha drekë","प्रानत्सारे","दोपहर का खाना खाना"],["tornare","kthehem","तोर्नारे","लौटना"],["dormire","fle","दोर्मीरे","सोना"]],
    dialogue: ["A: A che ora ti svegli?", "B: Mi sveglio alle sette.", "A: Dove lavori?", "B: Lavoro in un ristorante dalle nove alle cinque.", "A: Che cosa fai la sera?", "B: Ceno, studio italiano e dormo alle undici."],
    reading: { text: "Marta lavora in un ufficio. Si sveglia alle 6:30 e prende l’autobus alle 7:30. Inizia a lavorare alle 8. Pranza alle 13. Torna a casa alle 18 e la sera guarda la televisione.", questions: ["A che ora si sveglia Marta?", "Come va al lavoro?", "Quando pranza?", "Che cosa fa la sera?"] },
    listening: [
      { title: "Dialogo o monologo", file: "U05_Audio_1_dialogo_o_monologo.mp3", questions: ["A che ora si alza la persona?", "Che cosa prepara?", "Chi accompagna a scuola?", "A che ora torna a casa?"] },
      { title: "Annunci e informazioni", file: "U05_Audio_2_annunci_e_informazioni.mp3", questions: ["Quali giorni c’è il corso serale?", "Qual è l’orario?", "A che ora comincia sabato?", "Quanto prima bisogna arrivare?"] }
    ],
    grammarExercises: ["Io lavor___ in un bar.", "Tu studi___ italiano.", "Lei dorm___ alle 23.", "Noi torn___ a casa.", "Completa: Mi ___ alle sette."],
    writing: "Scrivi la tua giornata in ordine cronologico usando almeno 8 verbi.",
    oral: ["A che ora ti alzi?", "Che cosa fai al mattino?", "Dove lavori o studi?", "Che cosa fai la sera?"],
    task: "Descrivi la tua giornata usando prima, poi, dopo e infine."
  }),
  lesson({
    number: 6,
    title: "La città, i servizi e i trasporti",
    subtitle: "Chiedere indicazioni e muoversi in città",
    lessons: "Lezioni 16-18",
    introduction: { albanese: "Studenti mëson të kërkojë rrugën, të përdorë transportin publik dhe të kuptojë njoftime të thjeshta.", hindi: "विद्यार्थी रास्ता पूछना, सार्वजनिक परिवहन का उपयोग और सरल घोषणाएँ समझना सीखता है।" },
    objectives: ["Nominare servizi della città", "Chiedere e dare indicazioni semplici", "Comprare un biglietto", "Capire orari e annunci di trasporto", "Usare andare e venire"],
    grammar: { it: "Andare e venire; a/in/da; a destra, a sinistra, dritto; imperativo di cortesia memorizzato.", albanese: "Foljet andare dhe venire; a/in/da; djathtas, majtas, drejt; urdhërorja e mirësjelljes.", hindi: "andare और venire; a/in/da; दाएँ, बाएँ, सीधा; विनम्र निर्देश।" },
    vocabulary: [["stazione","stacion","स्तात्स्योने","स्टेशन"],["fermata","stacion autobusi","फेर्माता","बस स्टॉप"],["biglietto","biletë","बिल्येत्तो","टिकट"],["autobus","autobus","आउतोबुस","बस"],["treno","tren","त्रेनो","रेलगाड़ी"],["destra","djathtas","देस्ट्रा","दायाँ"],["sinistra","majtas","सिनिस्त्रा","बायाँ"],["dritto","drejt","द्रीत्तो","सीधा"]],
    dialogue: ["A: Scusi, dov’è la stazione?", "B: Vada sempre dritto, poi giri a sinistra.", "A: È lontana?", "B: No, è a cinque minuti.", "A: Dove compro il biglietto?", "B: Alla biglietteria o alla macchina automatica."],
    reading: { text: "Linea 5: Stazione - Centro - Ospedale. Prima corsa ore 6:10. Ultima corsa ore 22:40. Biglietto urbano 1,50 euro. Il biglietto è valido 90 minuti.", questions: ["Quali luoghi collega la linea 5?", "A che ora è la prima corsa?", "Quanto costa il biglietto?", "Per quanto tempo è valido?"] },
    listening: [
      { title: "Dialogo o monologo", file: "U06_Audio_1_dialogo_o_monologo.mp3", questions: ["A quale binario arriva il treno?", "Dove bisogna stare?", "Quale treno ha ritardo?", "Quanti minuti di ritardo?"] },
      { title: "Annunci e informazioni", file: "U06_Audio_2_annunci_e_informazioni.mp3", questions: ["Quale autobus bisogna prendere?", "A quale fermata bisogna scendere?", "Dopo la strada si gira a destra o a sinistra?", "Dov’è il Comune?"] }
    ],
    grammarExercises: ["Io ___ al lavoro in autobus.", "Tu ___ da Roma domani.", "La farmacia è ___ destra.", "Vada sempre ___.", "Il treno arriva ___ binario 2."],
    writing: "Scrivi un messaggio di 25-30 parole per spiegare a un amico come arrivare a casa tua.",
    oral: ["Come vai al lavoro?", "Prendi spesso il treno?", "Dov’è la stazione nella tua città?", "Chiedi indicazioni per la farmacia."],
    task: "Dai indicazioni dalla stazione alla posta e dalla posta alla farmacia."
  }),
  lesson({
    number: 7,
    title: "Cibo, bar e ristorante",
    subtitle: "Ordinare e parlare di gusti alimentari",
    lessons: "Lezioni 19-21",
    introduction: { albanese: "Njësia përgatit studentin të porosisë ushqim dhe pije në bar ose restorant.", hindi: "यह इकाई विद्यार्थी को बार या रेस्तराँ में भोजन और पेय ऑर्डर करना सिखाती है।" },
    objectives: ["Nominare cibi e bevande", "Ordinare al bar e al ristorante", "Chiedere il conto", "Esprimere preferenze", "Comprendere un semplice menù"],
    grammar: { it: "Volere, potere, prendere; mi piace / non mi piace; articoli e quantità di base.", albanese: "Foljet volere, potere dhe prendere; mi piace / non mi piace; nyjat dhe sasitë bazë.", hindi: "volere, potere, prendere; mi piace / non mi piace; लेख और मूल मात्राएँ।" },
    vocabulary: [["acqua","ujë","आक्वा","पानी"],["caffè","kafe","काफ्फे","कॉफ़ी"],["pane","bukë","पाने","रोटी"],["pasta","makarona","पास्ता","पास्ता"],["carne","mish","कार्ने","मांस"],["verdura","perime","वेर्दूरा","सब्ज़ी"],["conto","faturë","कोन्तो","बिल"],["vorrei","do të doja","वोर्रेई","मैं चाहूँगा / चाहूँगी"]],
    dialogue: ["Cameriere: Buonasera, che cosa desidera?", "Cliente: Vorrei una pizza margherita e un’acqua naturale.", "Cameriere: Desidera anche un dolce?", "Cliente: No, grazie. Posso avere il conto?", "Cameriere: Certo, sono quattordici euro."],
    reading: { text: "Menù del giorno: pasta al pomodoro 7 euro; pollo con insalata 9 euro; zuppa di verdure 6 euro; acqua 2 euro; caffè 1,20 euro. Servizio incluso.", questions: ["Quanto costa la pasta?", "Quale piatto costa 9 euro?", "C’è una zuppa?", "Il servizio è incluso?"] },
    listening: [
      { title: "Dialogo o monologo", file: "U07_Audio_1_dialogo_o_monologo.mp3", questions: ["Che cosa ordina il cliente?", "Come deve essere il latte?", "Quanto costa?", "Come paga?"] },
      { title: "Annunci e informazioni", file: "U07_Audio_2_annunci_e_informazioni.mp3", questions: ["A che ora apre a pranzo?", "A che ora chiude?", "Qual è il piatto del giorno?", "Quanto costa?"] }
    ],
    grammarExercises: ["Io ___ un caffè. (volere)", "___ avere il conto? (potere)", "Mi ___ la pasta.", "Non mi ___ le olive.", "Per me ___ pizza."],
    writing: "Scrivi una breve ordinazione di 20-25 parole e un messaggio per prenotare un tavolo.",
    oral: ["Che cosa mangi a colazione?", "Qual è il tuo piatto preferito?", "Ordina al bar.", "Chiedi il conto."],
    task: "Descrivi un tavolo e i cibi. Immagina l’ordinazione di due clienti."
  }),
  lesson({
    number: 8,
    title: "Fare la spesa e i negozi",
    subtitle: "Comprare prodotti, chiedere prezzi e quantità",
    lessons: "Lezioni 22-24",
    introduction: { albanese: "Studenti mëson të blejë produkte, të kërkojë çmime dhe sasi dhe të kuptojë oferta.", hindi: "विद्यार्थी सामान खरीदना, कीमत और मात्रा पूछना तथा ऑफ़र समझना सीखता है।" },
    objectives: ["Chiedere prezzi", "Capire offerte e sconti", "Comprare frutta, verdura e prodotti comuni", "Chiedere quantità", "Comprendere annunci di supermercato"],
    grammar: { it: "Questo/questa/questi/queste; quanto costa/costano; numeri e quantità; vorrei + nome.", albanese: "Questo/questa/questi/queste; quanto costa/costano; numrat dhe sasitë; vorrei + emër.", hindi: "Questo/questa/questi/queste; quanto costa/costano; संख्या और मात्रा; vorrei + संज्ञा।" },
    vocabulary: [["prezzo","çmim","प्रेत्सो","कीमत"],["chilo","kilogram","कीलो","किलो"],["bottiglia","shishe","बोत्तील्या","बोतल"],["busta","qese","बूस्ता","थैला"],["cassa","arkë","कास्सा","कैश काउंटर"],["sconto","ulje","स्कोन्तो","छूट"],["frutta","fruta","फ्रुत्ता","फल"],["verdura","perime","वेर्दूरा","सब्ज़ी"]],
    dialogue: ["Cliente: Buongiorno, quanto costano le mele?", "Venditore: Due euro al chilo.", "Cliente: Ne vorrei un chilo. E questi pomodori?", "Venditore: Tre euro al chilo.", "Cliente: Va bene, mezzo chilo, per favore."],
    reading: { text: "Offerta della settimana: latte 1,10 euro; pasta 0,90; olio 5,50; mele 1,80 al chilo. Con una spesa di 30 euro, una busta ecologica è gratuita.", questions: ["Quanto costa il latte?", "Quale prodotto costa 0,90?", "Quanto costano le mele?", "Quando la busta è gratuita?"] },
    listening: [
      { title: "Dialogo o monologo", file: "U08_Audio_1_dialogo_o_monologo.mp3", questions: ["Quale cassa apre?", "Le buste si pagano?", "In quale reparto c’è lo sconto?", "Di quanti euro è lo sconto?"] },
      { title: "Annunci e informazioni", file: "U08_Audio_2_annunci_e_informazioni.mp3", questions: ["Quante bottiglie d’acqua?", "Che cosa compra in un pacco?", "Quanti pomodori?", "Quanto paga?"] }
    ],
    grammarExercises: ["Quanto ___ le arance?", "Quanto ___ questa bottiglia?", "___ mele sono rosse.", "Vorrei ___ chilo di banane.", "Sono tre euro ___ chilo."],
    writing: "Scrivi una lista della spesa e un breve dialogo di 25-30 parole al mercato.",
    oral: ["Dove fai la spesa?", "Che cosa compri ogni settimana?", "Chiedi il prezzo di un prodotto.", "Chiedi mezzo chilo di pomodori."],
    task: "Descrivi un supermercato: reparti, prodotti, persone e carrello. Immagina un annuncio."
  }),
  lesson({
    number: 9,
    title: "Il corpo e la salute",
    subtitle: "Dire come si sta e chiedere aiuto",
    lessons: "Lezioni 25-27",
    introduction: { albanese: "Njësia zhvillon gjuhën bazë për mjekun, farmacinë dhe simptomat e zakonshme.", hindi: "यह इकाई डॉक्टर, फ़ार्मेसी और सामान्य लक्षणों के लिए मूल भाषा सिखाती है।" },
    objectives: ["Nominare parti del corpo", "Descrivere sintomi semplici", "Capire indicazioni sanitarie", "Chiedere un prodotto in farmacia", "Prenotare una visita"],
    grammar: { it: "Avere male a; sentirsi; dovere; formule dal medico e in farmacia.", albanese: "Avere male a; sentirsi; dovere; shprehje te mjeku dhe në farmaci.", hindi: "Avere male a; sentirsi; dovere; डॉक्टर और फ़ार्मेसी के उपयोगी वाक्य।" },
    vocabulary: [["testa","kokë","तेस्ता","सिर"],["gola","fyt","गोला","गला"],["pancia","bark","पान्चा","पेट"],["febbre","temperaturë","फेब्ब्रे","बुखार"],["dolore","dhimbje","दोलोरे","दर्द"],["medico","mjek","मेदिको","डॉक्टर"],["farmacia","farmaci","फार्माचीआ","फ़ार्मेसी"],["visita","vizitë","वीज़िता","जाँच / मुलाक़ात"]],
    dialogue: ["Medico: Buongiorno, che cosa ha?", "Paziente: Ho mal di gola e un po’ di febbre.", "Medico: Da quanti giorni?", "Paziente: Da due giorni.", "Medico: Deve riposare e bere molta acqua."],
    reading: { text: "Farmacia Centrale. Orario: 8:30-13:00 e 16:00-20:00. È possibile prenotare visite mediche e misurare la pressione. Prima di pagare mostrare la tessera sanitaria.", questions: ["Qual è l’orario del mattino?", "Che cosa si può prenotare?", "Che cosa si può misurare?", "Che cosa bisogna mostrare?"] },
    listening: [
      { title: "Dialogo o monologo", file: "U09_Audio_1_dialogo_o_monologo.mp3", questions: ["Che cosa si può prenotare?", "Che cosa bisogna mostrare?", "In quale mese il controllo è gratuito?", "Che cosa si controlla?"] },
      { title: "Annunci e informazioni", file: "U09_Audio_2_annunci_e_informazioni.mp3", questions: ["Dove ha male la persona?", "Ha la tosse?", "Ha la febbre?", "Da quando sta male?"] }
    ],
    grammarExercises: ["Ho male ___ testa.", "Lei ___ la febbre.", "Mi ___ stanco.", "Devi ___ dal medico.", "Da quanti giorni ___ male?"],
    writing: "Scrivi un messaggio di 20-30 parole al medico o al datore di lavoro per dire che stai male.",
    oral: ["Come stai oggi?", "Dove hai male?", "Che cosa dici in farmacia?", "Hai la tessera sanitaria?"],
    task: "Immagina di essere in farmacia. Che cosa chiedi e che cosa mostri prima di pagare?"
  }),
  lesson({
    number: 10,
    title: "Tempo libero e weekend",
    subtitle: "Parlare di hobby, inviti e programmi",
    lessons: "Lezioni 28-30",
    introduction: { albanese: "Studenti flet për kohën e lirë, bën ftesa dhe organizon fundjavën.", hindi: "विद्यार्थी खाली समय के बारे में बात करना, निमंत्रण देना और सप्ताहांत की योजना बनाना सीखता है।" },
    objectives: ["Dire che cosa piace fare", "Invitare e accettare/rifiutare", "Parlare del fine settimana", "Dire quando e dove incontrarsi", "Comprendere semplici programmi"],
    grammar: { it: "Piacere; verbi del tempo libero; espressioni di frequenza; vuoi…? / possiamo…?", albanese: "Piacere; foljet e kohës së lirë; shprehjet e shpeshtësisë; vuoi…? / possiamo…?", hindi: "Piacere; खाली समय की क्रियाएँ; आवृत्ति; vuoi…? / possiamo…?" },
    vocabulary: [["weekend","fundjavë","वीकेन्ड","सप्ताहांत"],["parco","park","पार्को","पार्क"],["cinema","kinema","चीनेमा","सिनेमा"],["passeggiare","shëtis","पास्सेज्जारे","टहलना"],["leggere","lexoj","लेज्जेरे","पढ़ना"],["sport","sport","स्पोर्ट","खेल"],["incontrarsi","takohem","इन्कोन्त्रार्सी","मिलना"],["insieme","së bashku","इन्सीएमे","साथ में"]],
    dialogue: ["A: Che cosa fai nel weekend?", "B: Sabato vado al parco con i miei amici.", "A: Vuoi andare al cinema domenica?", "B: Sì, volentieri. A che ora?", "A: Alle sei, davanti al cinema.", "B: Perfetto, a domenica!"],
    reading: { text: "Domenica al Parco Nord: passeggiata gratuita alle 10, laboratorio per bambini alle 11:30, musica dal vivo alle 17. Portare acqua e un cappello. In caso di pioggia l’evento è annullato.", questions: ["A che ora è la passeggiata?", "Per chi è il laboratorio?", "Quando c’è la musica?", "Che cosa succede se piove?"] },
    listening: [
      { title: "Dialogo o monologo", file: "U10_Audio_1_dialogo_o_monologo.mp3", questions: ["Dove va sabato mattina?", "Che sport fa?", "Che cosa guarda la sera?", "Con chi passeggia domenica?"] },
      { title: "Annunci e informazioni", file: "U10_Audio_2_annunci_e_informazioni.mp3", questions: ["In quale giorno si incontrano?", "A che ora?", "Dove?", "Che cosa fanno se piove?"] }
    ],
    grammarExercises: ["Mi ___ leggere.", "Mi ___ i film italiani.", "___ andare al parco?", "Possiamo incontrarci ___ dieci.", "La domenica vado ___ cinema."],
    writing: "Scrivi un messaggio di 25-35 parole per invitare un amico nel weekend. Indica giorno, ora, luogo e attività.",
    oral: ["Che cosa ti piace fare?", "Che cosa fai il sabato?", "Invita un compagno al cinema.", "Accetta o rifiuta con cortesia."],
    task: "Descrivi delle persone al parco: che cosa fanno, che cosa portano e che tempo fa?"
  }),
  lesson({
    number: 11,
    title: "Persone, vestiti e meteo",
    subtitle: "Descrivere aspetto, abbigliamento e tempo atmosferico",
    lessons: "Lezioni 31-33",
    introduction: { albanese: "Studenti përshkruan njerëzit, rrobat, ngjyrat dhe motin.", hindi: "विद्यार्थी लोगों, कपड़ों, रंगों और मौसम का वर्णन करता है।" },
    objectives: ["Descrivere una persona", "Nominare vestiti e colori", "Capire una semplice descrizione", "Parlare del meteo", "Scegliere abbigliamento adatto"],
    grammar: { it: "Aggettivi qualificativi; accordo; colori; indossare/avere/essere; fa caldo/fa freddo/piove.", albanese: "Mbiemrat cilësorë dhe përshtatja; ngjyrat; indossare/avere/essere; moti.", hindi: "विशेषण और उनका मेल; रंग; indossare/avere/essere; मौसम के वाक्य।" },
    vocabulary: [["maglietta","bluzë","माल्येत्ता","टी-शर्ट"],["pantaloni","pantallona","पान्तालोनी","पतलून"],["giacca","xhaketë","जाक्का","जैकेट"],["scarpe","këpucë","स्कार्पे","जूते"],["rosso","i kuq","रोस्सो","लाल"],["blu","blu","ब्लू","नीला"],["caldo","nxehtë","काल्दो","गर्म"],["freddo","ftohtë","फ्रेद्दो","ठंडा"]],
    dialogue: ["A: Com’è vestita Sara?", "B: Indossa una giacca blu, pantaloni neri e scarpe bianche.", "A: Com’è il tempo oggi?", "B: Fa freddo e piove.", "A: Allora serve anche l’ombrello.", "B: Sì, e una sciarpa."],
    reading: { text: "Meteo di domani: al nord pioggia e temperature basse; al centro cielo nuvoloso; al sud sole e 24 gradi. In montagna possibile neve. Portare una giacca nelle ore serali.", questions: ["Dove piove?", "Com’è il cielo al centro?", "Quanti gradi al sud?", "Che cosa bisogna portare la sera?"] },
    listening: [
      { title: "Dialogo o monologo", file: "U11_Audio_1_dialogo_o_monologo.mp3", questions: ["La persona è alta o bassa?", "Come sono i capelli?", "Di che colore sono i pantaloni?", "Dov’è la persona?"] },
      { title: "Annunci e informazioni", file: "U11_Audio_2_annunci_e_informazioni.mp3", questions: ["Che tempo fa oggi?", "Che tempo fa domani?", "Quanti gradi?", "Che cosa bisogna prendere?"] }
    ],
    grammarExercises: ["Una giacca ross___.", "Due magliette bianc___.", "Marco è alt___ e magr___.", "Oggi ___ freddo.", "Domani ___."],
    writing: "Descrivi una persona e il suo abbigliamento in 30-40 parole. Aggiungi una frase sul meteo.",
    oral: ["Descrivi una persona.", "Che cosa indossi oggi?", "Qual è il tuo colore preferito?", "Che tempo fa oggi?"],
    task: "Scegli una persona e descrivila: aspetto, vestiti, colori e posizione."
  }),
  lesson({
    number: 12,
    title: "Ripasso e simulazione CELI A1",
    subtitle: "Consolidare le abilità e svolgere prove integrate",
    lessons: "Lezioni 34-36",
    introduction: { albanese: "Njësia përfundimtare përmbledh të gjitha aftësitë dhe ofron një simulim të plotë A1.", hindi: "अंतिम इकाई सभी कौशलों का पुनरावर्तन करती है और पूर्ण A1 अभ्यास देती है।" },
    objectives: ["Comprendere avvisi con immagini", "Abbinare segnali e frasi", "Compilare un modulo di 20-25 parole", "Presentarsi e parlare di un tema familiare", "Rispondere a domande brevi dopo annunci lenti"],
    grammar: { it: "Ripasso di essere, avere, presente, articoli, genere/numero, c’è/ci sono, preposizioni, modali e lessico quotidiano.", albanese: "Përsëritje e essere, avere, së tashmes, nyjave, gjinisë/numrit, c’è/ci sono, parafjalëve dhe foljeve modale.", hindi: "essere, avere, वर्तमान काल, लेख, लिंग/वचन, c’è/ci sono, पूर्वसर्ग और मोडल क्रियाओं की पुनरावृत्ति।" },
    vocabulary: [["leggere","lexoj","लेज्जेरे","पढ़ना"],["scrivere","shkruaj","स्क्रीवेरे","लिखना"],["ascoltare","dëgjoj","आस्कोल्तारे","सुनना"],["parlare","flas","पार्लारे","बोलना"],["modulo","formular","मोदूलो","फॉर्म"],["avviso","njoftim","आव्वीज़ो","सूचना"],["domanda","pyetje","दोमान्दा","प्रश्न"],["risposta","përgjigje","रिस्पोस्ता","उत्तर"]],
    dialogue: ["Esaminatore: Buongiorno. Si presenti, per favore.", "Candidato: Mi chiamo Meena, sono indiana e vivo a Lecce. Lavoro in un negozio e studio italiano.", "Esaminatore: Parli della sua famiglia.", "Candidato: Siamo quattro. Ho un marito e due figli. I miei figli vanno a scuola."],
    reading: { text: "Avviso: venerdì 12 settembre la scuola chiude alle ore 12. Le lezioni del pomeriggio sono annullate. La segreteria è aperta dalle 9 alle 11. Per informazioni chiamare il numero 0832 450 290.", questions: ["In quale giorno c’è l’avviso?", "A che ora chiude la scuola?", "Le lezioni del pomeriggio ci sono?", "Qual è l’orario della segreteria?"] },
    listening: [
      { title: "Dialogo o monologo", file: "U12_Audio_1_dialogo_o_monologo.mp3", questions: ["Che cosa devi spegnere?", "Che cosa devi firmare?", "Quanto tempo hai?"] },
      { title: "Annunci e informazioni", file: "U12_Audio_2_annunci_e_informazioni.mp3", questions: ["Dove va il treno?", "Da quale binario parte?", "Quanti minuti di ritardo?", "Dove devono stare i viaggiatori?"] }
    ],
    grammarExercises: ["Io ___ al lavoro alle otto.", "In casa ___ due camere.", "Vorrei ___ bottiglia d’acqua.", "Ho male ___ gola.", "Domani ___ al cinema."],
    writing: "Simulazione: compila il modulo di iscrizione al corso e scrivi 20-25 parole con i tuoi dati e la tua disponibilità.",
    oral: ["Presentati.", "Scegli: famiglia, Paese o lavoro.", "Descrivi una situazione quotidiana.", "Rispondi a tre annunci con 1-2 parole."],
    task: "Simulazione orale: descrivi una situazione, parla di un tema quotidiano e rispondi alle domande dell’insegnante."
  })
]);
