import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import {
  SignJWT,
  createRemoteJWKSet,
  importPKCS8,
  jwtVerify
} from "jose";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual
} from "node:crypto";
import { promisify } from "node:util";
import nodemailer from "nodemailer";
import { courseA1Lessons } from "./course-a1-lessons.js";
import { courseA2Lessons } from "./course-a2-lessons.js";

const scrypt = promisify(scryptCallback);
const app = express();

const port = Number(process.env.PORT || 8790);
const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
const cookieName = process.env.COOKIE_NAME || "apll_portal_session";
const oauthStateCookie = process.env.OAUTH_STATE_COOKIE || "apll_portal_oauth_state";
const cookieDomain = process.env.COOKIE_DOMAIN || "";
const cookieSecure = process.env.COOKIE_SECURE !== "false";
const sessionDays = Number(process.env.SESSION_DAYS || 7);
const siteOrigin = process.env.SITE_ORIGIN || "https://aliperlaliberta.it";
const publicApiOrigin = process.env.PUBLIC_API_ORIGIN || "https://api.aliperlaliberta.it";
const supportPhone = String(process.env.SUPPORT_PHONE || '').trim().replace(/[^\d+]/g, '');
const courseA1Dir = process.env.COURSE_A1_DIR || path.join(dataDir, "course-a1");
const courseA2Dir = process.env.COURSE_A2_DIR || path.join(dataDir, "course-a2");
const smtpHost = String(process.env.SMTP_HOST || "").trim();
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = process.env.SMTP_SECURE === "true";
const smtpUser = String(process.env.SMTP_USER || "").trim();
const smtpPass = String(process.env.SMTP_PASS || "");
const mailFrom = String(process.env.MAIL_FROM || smtpUser || "").trim();

const oauthProviders = {
  google: {
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    jwksUrl: "https://www.googleapis.com/oauth2/v3/certs",
    issuer: ["https://accounts.google.com", "accounts.google.com"]
  },
  apple: {
    clientId: process.env.APPLE_CLIENT_ID || "",
    clientSecret: process.env.APPLE_CLIENT_SECRET || "",
    teamId: process.env.APPLE_TEAM_ID || "",
    keyId: process.env.APPLE_KEY_ID || "",
    privateKey: process.env.APPLE_PRIVATE_KEY || "",
    authorizeUrl: "https://appleid.apple.com/auth/authorize",
    tokenUrl: "https://appleid.apple.com/auth/token",
    jwksUrl: "https://appleid.apple.com/auth/keys",
    issuer: "https://appleid.apple.com"
  }
};

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "https://aliperlaliberta.it,https://www.aliperlaliberta.it")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const files = {
  users: path.join(dataDir, "users.json"),
  requests: path.join(dataDir, "requests.json"),
  sessions: path.join(dataDir, "sessions.json"),
  quizResults: path.join(dataDir, "quiz-results.json"),
  courseProgress: path.join(dataDir, "course-progress.json")
};

let writeLock = Promise.resolve();

const emailSchema = z.string().trim().email().max(160).transform((value) => value.toLowerCase());
const usernameSchema = z.string()
  .trim()
  .min(3)
  .max(40)
  .regex(/^[a-zA-Z0-9._-]+$/, "Username non valido")
  .transform((value) => value.toLowerCase());
const passwordSchema = z.string().min(10).max(128);
const safeText = (max) => z.string().trim().min(1).max(max);

const rolePermissions = Object.freeze({
  admin: Object.freeze(["requests:read:all", "requests:update", "users:read", "quiz-results:read", "courses:a1:read"]),
  student: Object.freeze(["courses:a1:read"]),
  client: Object.freeze(["requests:create", "requests:read:own"])
});

const courseA1Units = Object.freeze([
  [1, "Saluti e presentazioni"],
  [2, "Dati personali, alfabeto e moduli"],
  [3, "Famiglia e persone"],
  [4, "La casa e gli oggetti"],
  [5, "La giornata e gli orari"],
  [6, "La città, i servizi e i trasporti"],
  [7, "Cibo, bar e ristorante"],
  [8, "Fare la spesa e i negozi"],
  [9, "Il corpo e la salute"],
  [10, "Tempo libero e weekend"],
  [11, "Persone, vestiti e meteo"],
  [12, "Ripasso e simulazione CELI A1"]
].map(([number, title]) => ({
  number,
  title,
  reviewPages: Array.from({ length: 4 }, (_, offset) => `page-${String(3 + ((number - 1) * 4) + offset).padStart(2, "0")}.png`),
  audio: [
    `U${String(number).padStart(2, "0")}_Audio_1_dialogo_o_monologo.mp3`,
    `U${String(number).padStart(2, "0")}_Audio_2_annunci_e_informazioni.mp3`
  ]
})));

const courseA1AudioFiles = new Set(courseA1Units.flatMap((unit) => unit.audio));
const courseA1PageFiles = new Set(Array.from({ length: 51 }, (_, index) => `page-${String(index + 1).padStart(2, "0")}.png`));
const courseLevels = ["", "A1", "A2", "B1"];
const courseA2Units = Object.freeze(courseA2Lessons.map((unit) => ({
  number: unit.number,
  title: unit.title,
  audio: unit.listening.map((track) => track.file)
})));
const courseA2AudioFiles = new Set(courseA2Units.flatMap((unit) => unit.audio));

const registerSchema = z.object({
  name: safeText(120),
  username: usernameSchema,
  email: emailSchema,
  phone: z.string().trim().min(6).max(40).optional().default(""),
  password: passwordSchema
});

const loginSchema = z.object({
  identifier: z.string().trim().min(3).max(160).optional(),
  email: z.string().trim().min(3).max(160).optional(),
  password: z.string().min(1).max(128)
}).transform((value) => ({
  identifier: String(value.identifier || value.email || "").trim().toLowerCase(),
  password: value.password
})).refine((value) => value.identifier.length >= 3, {
  message: "Username o email richiesto",
  path: ["identifier"]
});

const requestSchema = z.object({
  service: safeText(80),
  subject: safeText(160),
  message: safeText(3000),
  preferredDate: z.string().trim().max(20).optional().default(""),
  preferredTime: z.string().trim().max(20).optional().default(""),
  phone: z.string().trim().max(40).optional().default("")
});

const adminUpdateSchema = z.object({
  status: z.enum(["new", "in_progress", "waiting_client", "done", "cancelled"]).optional(),
  adminNote: z.string().trim().max(3000).optional()
});

const studentRegisterSchema = z.object({
  name: safeText(120),
  username: usernameSchema,
  email: emailSchema,
  nationality: z.enum(["Albanese", "Indiana"]),
  password: passwordSchema
});

const studentAssignmentSchema = z.object({
  courseLevel: z.enum(courseLevels),
  nationality: z.enum(["Albanese", "Indiana"])
});

const courseProgressSchema = z.object({
  answers: z.record(z.string().max(1200)).default({}),
  completed: z.boolean().default(false)
});

const quizSubmissionSchema = z.object({
  level: z.enum(["A1", "A2"]),
  firstName: safeText(80),
  lastName: safeText(80),
  email: emailSchema,
  answers: z.record(z.string().max(240)).default({}),
  writing: z.string().trim().max(3000).optional().default("")
});

const quizDefinitions = Object.freeze({
  A1: [
    ["q1", "Il corso comincia lunedi 7 settembre.", "Si"],
    ["q2", "Le lezioni finiscono alle ore 17:00.", "No"],
    ["q3", "Il corso costa 60 euro al mese.", "Si"],
    ["q4", "La segreteria e aperta anche la domenica.", "No"],
    ["q5", "Che cosa bisogna portare per iscriversi?", "Un documento e una fotografia"],
    ["q6", "Qual e la frase corretta?", "Io sono Maria."],
    ["q7", "Completa: Tu ___ albanese.", "sei"],
    ["q8", "Completa: Noi ___ studenti.", "siamo"],
    ["q9", "Quale domanda si usa in una situazione formale?", "Come si chiama?"],
    ["q10", "Completa: Abito ___ Lecce.", "a"],
    ["q11", "Qual e il plurale di ragazza?", "ragazze"],
    ["q12", "Scegli l'articolo corretto: ___ studente.", "Lo"],
    ["q13", "Completa: In cucina ___ un tavolo.", "c'e"],
    ["q14", "Completa: Sul tavolo ___ due bicchieri.", "ci sono"],
    ["q15", "Quale frase indica un saluto formale?", "Buongiorno, signora."],
    ["q16", "Come si chiama la ragazza?", "Sofia"],
    ["q17", "Dove vive Sofia?", "A Perugia"],
    ["q18", "Dove lavora?", "In un bar"],
    ["q19", "Quando frequenta il corso di italiano?", "Il lunedi e il mercoledi"],
    ["q20", "Che cosa le piace fare la domenica?", "Andare al parco e parlare con gli amici"]
  ],
  A2: [
    ["q1", "Da quanto tempo Amir lavora in albergo?", "Da tre mesi"],
    ["q2", "Dove lavorava prima?", "In un ristorante"],
    ["q3", "A che ora finisce di lavorare?", "Alle quindici"],
    ["q4", "Quale attivita NON fa Amir?", "Cucina per i clienti"],
    ["q5", "Perche ad Amir piace il suo lavoro?", "Perche parla con persone di Paesi diversi"],
    ["q6", "Quando non lavora?", "La domenica"],
    ["q7", "Completa: Ieri Amir ___ alle sette.", "ha iniziato"],
    ["q8", "Completa: La settimana scorsa noi ___ a Roma.", "siamo andati"],
    ["q9", "Qual e la frase corretta?", "Maria e tornata a casa."],
    ["q10", "Completa: Quando ero piccolo, ___ al parco ogni giorno.", "andavo"],
    ["q11", "Chi telefona?", "Elena"],
    ["q12", "Per quando era fissato l'appuntamento iniziale?", "Mercoledi pomeriggio"],
    ["q13", "Perche Elena vuole cambiare giorno?", "Ha una visita medica"],
    ["q14", "Quando hanno deciso di incontrarsi?", "Venerdi alle 18:30"],
    ["q15", "Dove si incontrano?", "Davanti alla biblioteca"],
    ["q16", "Completa: Ho comprato ___ regalo per mia sorella.", "un"],
    ["q17", "Non trovo le chiavi. ___ hai viste?", "Le"],
    ["q18", "Questo esercizio e ___ facile del precedente.", "piu"],
    ["q19", "Completa: Domani ___ a trovare mia zia.", "vado"],
    ["q20", "Qual e la frase corretta?", "Vorrei un caffe, per favore."]
  ]
});

const normalizeQuizAnswer = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[’‘]/g, "'")
  .trim()
  .toLowerCase();

function evaluateQuiz(level, submittedAnswers) {
  const definition = quizDefinitions[level];
  const answers = {};
  const errors = [];
  let score = 0;
  definition.forEach(([id, question, correctAnswer]) => {
    const submittedAnswer = String(submittedAnswers[id] || "").trim();
    answers[id] = submittedAnswer;
    if (normalizeQuizAnswer(submittedAnswer) === normalizeQuizAnswer(correctAnswer)) {
      score += 1;
    } else {
      errors.push({ id, question, submittedAnswer, correctAnswer });
    }
  });
  return { answers, errors, score, total: definition.length, percentage: Math.round((score / definition.length) * 100) };
}

function mailTransport() {
  if (!smtpHost || !smtpUser || !smtpPass || !mailFrom) return null;
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: { user: smtpUser, pass: smtpPass }
  });
}

async function emailQuizResult(result) {
  const transport = mailTransport();
  if (!transport) return false;
  const errorLines = result.errors.length
    ? result.errors.map((item, index) => `${index + 1}. ${item.question}\nRisposta data: ${item.submittedAnswer || "Nessuna risposta"}\nRisposta corretta: ${item.correctAnswer}`).join("\n\n")
    : "Nessun errore.";
  await transport.sendMail({
    from: mailFrom,
    to: result.email,
    subject: `Risultato quiz di italiano ${result.level} - Ali per la Liberta`,
    text: `Ciao ${result.firstName},\n\nhai completato il quiz di italiano ${result.level}.\n\nPunteggio: ${result.score}/${result.total} (${result.percentage}%)\n\nErrori e correzioni:\n${errorLines}\n\nAli per la Liberta`
  });
  return true;
}

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json({ limit: "64kb" }));
app.use(express.urlencoded({ extended: false, limit: "20kb" }));
app.use((req, res, next) => {
  req.id = randomUUID();
  res.setHeader("X-Request-Id", req.id);
  res.setHeader("Cache-Control", "no-store");
  next();
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_GENERAL || 240),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Troppe richieste. Riprova tra poco." }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_AUTH || 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Troppi tentativi di accesso. Riprova tra poco." }
});

const quizLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_QUIZ || 12),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Hai inviato troppi quiz. Riprova tra poco." }
});

app.use(generalLimiter);
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin non consentita"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Accept"],
  credentials: true
}));

app.use((req, res, next) => {
  if (!["POST", "PATCH", "PUT", "DELETE"].includes(req.method)) return next();
  if (req.path === "/api/portal/oauth/apple/callback") return next();
  if (process.env.NODE_ENV !== "production" && !req.headers.origin && !req.headers.referer) return next();

  const origin = req.headers.origin || originFromReferer(req.headers.referer);
  if (origin && allowedOrigins.includes(origin)) return next();
  return next(httpError(403, "Origine richiesta non consentita"));
});

function originFromReferer(value) {
  try {
    return value ? new URL(value).origin : "";
  } catch {
    return "";
  }
}

function withWriteLock(task) {
  const next = writeLock.then(task, task);
  writeLock = next.catch(() => {});
  return next;
}

async function ensureDataDir() {
  await mkdir(dataDir, { recursive: true });
}

async function readJson(file, fallback) {
  await ensureDataDir();
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeJson(file, value) {
  await ensureDataDir();
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(tmp, file);
}

function nowIso() {
  return new Date().toISOString();
}

function expiresIso(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("base64url");
  const key = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${Buffer.from(key).toString("base64url")}`;
}

async function verifyPassword(password, stored) {
  const [scheme, salt, key] = String(stored || "").split("$");
  if (scheme !== "scrypt" || !salt || !key) return false;
  const actual = Buffer.from(await scrypt(password, salt, 64));
  const expected = Buffer.from(key, "base64url");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function parseCookies(header = "") {
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        if (index === -1) return [part, ""];
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      })
  );
}

function buildCookieHeader(name, value, maxAgeSeconds, sameSite = "Lax") {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    `SameSite=${sameSite}`,
    `Max-Age=${maxAgeSeconds}`
  ];
  if (cookieSecure) parts.push("Secure");
  if (cookieDomain) parts.push(`Domain=${cookieDomain}`);
  return parts.join("; ");
}

function cookieHeader(token, maxAgeSeconds) {
  return buildCookieHeader(cookieName, token, maxAgeSeconds);
}

function clearCookieHeader() {
  return cookieHeader("", 0);
}

function oauthStateCookieHeader(value, maxAgeSeconds) {
  return buildCookieHeader(oauthStateCookie, value, maxAgeSeconds, "None");
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    username: user.username || usernameFromEmail(user.email),
    email: user.email,
    phone: user.phone || "",
    role: user.role,
    nationality: user.nationality || "",
    courseLevel: user.courseLevel || "",
    courseLanguage: user.courseLanguage || languageForNationality(user.nationality),
    permissions: permissionsForRole(user.role, user.permissions),
    providers: (user.authProviders || []).map((provider) => provider.provider),
    createdAt: user.createdAt
  };
}

function languageForNationality(nationality = "") {
  if (nationality === "Albanese") return "albanese";
  if (nationality === "Indiana") return "hindi";
  return "italiano";
}

function usernameFromEmail(email = "") {
  return String(email).split("@")[0].replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 40).toLowerCase() || "user";
}

function permissionsForRole(role, savedPermissions = []) {
  const defaults = rolePermissions[role] || [];
  const combined = new Set([...defaults, ...savedPermissions]);
  return Array.from(combined);
}

function hasPermission(user, permission) {
  return permissionsForRole(user?.role, user?.permissions).includes(permission);
}

async function configuredSupportPhone() {
  if (supportPhone) return supportPhone;
  try {
    return String(await readFile(path.join(dataDir, "support-phone"), "utf8"))
      .trim()
      .replace(/[^\d+]/g, "");
  } catch {
    return "";
  }
}
function providerEnabled(provider) {
  const config = oauthProviders[provider];
  if (!config?.clientId) return false;
  if (provider === "google") return Boolean(config.clientSecret);
  if (provider === "apple") {
    return Boolean(config.clientSecret || (config.teamId && config.keyId && config.privateKey));
  }
  return false;
}

function oauthRedirectUri(provider) {
  return `${publicApiOrigin.replace(/\/+$/, "")}/api/portal/oauth/${provider}/callback`;
}

function safeReturnTo(value) {
  const fallback = "/cliente/";
  if (!value || typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value.slice(0, 180);
}

function redirectToSite(res, returnTo, params = {}) {
  const url = new URL(safeReturnTo(returnTo), siteOrigin);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  return res.redirect(303, url.toString());
}

function uniqueUsername(base, users) {
  const normalized = String(base || "user")
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 32) || "user";
  let candidate = normalized;
  let suffix = 2;
  const taken = new Set(users.map((user) => user.username).filter(Boolean));
  while (taken.has(candidate)) {
    candidate = `${normalized.slice(0, 32)}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function providerDisplayName(provider) {
  return provider === "apple" ? "Apple" : "Google";
}

function requestWithCustomer(request, users) {
  const customer = users.find((user) => user.id === request.customerId);
  return {
    ...request,
    customer: customer ? publicUser(customer) : null
  };
}

function normalizeForClient(request) {
  const { customerId, ...publicRequest } = request;
  return publicRequest;
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function createSession(userId) {
  const token = randomBytes(32).toString("base64url");
  await withWriteLock(async () => {
    const sessions = await readJson(files.sessions, []);
    const cutoff = nowIso();
    const activeSessions = sessions.filter((session) => session.expiresAt > cutoff && session.userId !== userId);
    activeSessions.push({
      id: hashToken(token),
      userId,
      createdAt: cutoff,
      expiresAt: expiresIso(sessionDays)
    });
    await writeJson(files.sessions, activeSessions);
  });
  return token;
}

async function deleteSession(token) {
  if (!token) return;
  await withWriteLock(async () => {
    const sessions = await readJson(files.sessions, []);
    await writeJson(files.sessions, sessions.filter((session) => session.id !== hashToken(token)));
  });
}

async function getCurrentUser(req) {
  const token = parseCookies(req.headers.cookie || "")[cookieName];
  if (!token) return null;

  const [sessions, users] = await Promise.all([
    readJson(files.sessions, []),
    readJson(files.users, [])
  ]);
  const session = sessions.find((item) => item.id === hashToken(token));
  if (!session || session.expiresAt <= nowIso()) return null;
  return users.find((user) => user.id === session.userId) || null;
}

async function requireUser(req, res, next) {
  try {
    const user = await getCurrentUser(req);
    if (!user) throw httpError(401, "Accesso richiesto");
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

function requireAdmin(req, res, next) {
  if (!hasPermission(req.user, "requests:read:all")) return next(httpError(403, "Permesso admin richiesto"));
  return next();
}

function requireCourseA1(req, res, next) {
  if (!hasPermission(req.user, "courses:a1:read")) return next(httpError(403, "Accesso al corso A1 non autorizzato"));
  if (req.user.role !== "admin" && req.user.courseLevel !== "A1") {
    return next(httpError(403, "Il livello A1 non è ancora stato assegnato dall'insegnante"));
  }
  return next();
}

function requireCourseA2(req, res, next) {
  if (req.user.role !== "admin" && req.user.courseLevel !== "A2") {
    return next(httpError(403, "Il livello A2 non è ancora stato assegnato dall'insegnante"));
  }
  return next();
}

function providerFromParam(value) {
  if (value !== "google" && value !== "apple") throw httpError(404, "Provider non supportato");
  return value;
}

function encodeStateCookie(value) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decodeStateCookie(value) {
  try {
    return JSON.parse(Buffer.from(String(value || ""), "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function oauthJwks(provider) {
  const config = oauthProviders[provider];
  if (!config.jwks) config.jwks = createRemoteJWKSet(new URL(config.jwksUrl));
  return config.jwks;
}

async function appleClientSecret() {
  const config = oauthProviders.apple;
  if (config.clientSecret) return config.clientSecret;
  const privateKey = await importPKCS8(config.privateKey.replace(/\\n/g, "\n"), "ES256");
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: config.keyId })
    .setIssuer(config.teamId)
    .setAudience("https://appleid.apple.com")
    .setSubject(config.clientId)
    .setIssuedAt()
    .setExpirationTime("180d")
    .sign(privateKey);
}

async function exchangeOAuthCode(provider, code) {
  const config = oauthProviders[provider];
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: provider === "apple" ? await appleClientSecret() : config.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: oauthRedirectUri(provider)
  });

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.id_token) throw httpError(502, `Login ${providerDisplayName(provider)} non completato`);
  return result;
}

async function verifyOAuthIdentity(provider, idToken, extraUser = null) {
  const config = oauthProviders[provider];
  const { payload } = await jwtVerify(idToken, oauthJwks(provider), {
    audience: config.clientId,
    issuer: config.issuer
  });
  const email = String(payload.email || "").toLowerCase();
  const verified = payload.email_verified === true || payload.email_verified === "true";
  if (!email || !verified) throw httpError(403, `Email ${providerDisplayName(provider)} non verificata`);

  const appleName = extraUser?.name
    ? [extraUser.name.firstName, extraUser.name.lastName].filter(Boolean).join(" ")
    : "";

  return {
    provider,
    subject: String(payload.sub),
    email,
    name: String(payload.name || appleName || usernameFromEmail(email)),
    picture: payload.picture ? String(payload.picture) : ""
  };
}

async function upsertOAuthUser(identity) {
  return withWriteLock(async () => {
    const users = await readJson(files.users, []);
    const now = nowIso();
    let user = users.find((existing) => (
      existing.authProviders || []
    ).some((provider) => provider.provider === identity.provider && provider.subject === identity.subject));

    if (user) return user;

    user = users.find((existing) => existing.email === identity.email);
    if (user) {
      if (user.role !== "client") throw httpError(403, "Per gli account admin usa il login con password");
      user.username = user.username || uniqueUsername(usernameFromEmail(identity.email), users.filter((existing) => existing.id !== user.id));
      user.permissions = permissionsForRole("client", user.permissions);
      user.authProviders = [
        ...(user.authProviders || []),
        {
          provider: identity.provider,
          subject: identity.subject,
          email: identity.email,
          linkedAt: now
        }
      ];
      user.updatedAt = now;
      await writeJson(files.users, users);
      return user;
    }

    const created = {
      id: randomUUID(),
      role: "client",
      name: identity.name,
      username: uniqueUsername(usernameFromEmail(identity.email), users),
      email: identity.email,
      phone: "",
      permissions: permissionsForRole("client"),
      authProviders: [{
        provider: identity.provider,
        subject: identity.subject,
        email: identity.email,
        linkedAt: now
      }],
      passwordHash: "",
      createdAt: now,
      updatedAt: now
    };
    users.push(created);
    await writeJson(files.users, users);
    return created;
  });
}

async function finishOAuthCallback(provider, req, res, next) {
  try {
    const input = req.method === "POST" ? req.body : req.query;
    const code = String(input.code || "");
    const state = String(input.state || "");
    const storedState = decodeStateCookie(parseCookies(req.headers.cookie || "")[oauthStateCookie]);
    const returnTo = safeReturnTo(storedState?.returnTo);
    res.setHeader("Set-Cookie", oauthStateCookieHeader("", 0));

    if (!providerEnabled(provider)) throw httpError(503, `${providerDisplayName(provider)} non configurato`);
    if (!code || !state || !storedState || storedState.state !== state || storedState.provider !== provider) {
      throw httpError(400, "Sessione login non valida");
    }

    const extraUser = input.user ? JSON.parse(String(input.user)) : null;
    const tokens = await exchangeOAuthCode(provider, code);
    const identity = await verifyOAuthIdentity(provider, tokens.id_token, extraUser);
    const user = await upsertOAuthUser(identity);
    const sessionToken = await createSession(user.id);

    res.setHeader("Set-Cookie", [
      oauthStateCookieHeader("", 0),
      cookieHeader(sessionToken, sessionDays * 24 * 60 * 60)
    ]);
    return redirectToSite(res, returnTo, { access: "ok" });
  } catch (error) {
    if (error.status) return redirectToSite(res, "/cliente/", { access: "error", reason: error.message });
    return next(error);
  }
}

app.get("/api/portal/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/portal/students/register", authLimiter, async (req, res, next) => {
  try {
    const input = studentRegisterSchema.parse(req.body);
    const passwordHash = await hashPassword(input.password);
    const user = await withWriteLock(async () => {
      const users = await readJson(files.users, []);
      if (users.some((item) => item.email === input.email)) throw httpError(409, "Email già registrata");
      if (users.some((item) => item.username === input.username)) throw httpError(409, "Username già registrato");
      const now = nowIso();
      const created = {
        id: randomUUID(),
        role: "student",
        name: input.name,
        username: input.username,
        email: input.email,
        phone: "",
        nationality: input.nationality,
        courseLanguage: languageForNationality(input.nationality),
        courseLevel: "",
        permissions: permissionsForRole("student"),
        passwordHash,
        createdAt: now,
        updatedAt: now
      };
      users.push(created);
      await writeJson(files.users, users);
      return created;
    });
    const token = await createSession(user.id);
    res.setHeader("Set-Cookie", cookieHeader(token, sessionDays * 24 * 60 * 60));
    res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/portal/courses/a1", requireUser, requireCourseA1, (req, res) => {
  const language = req.user.role === "admin" && ["hindi", "albanese"].includes(req.query.language)
    ? req.query.language
    : languageForNationality(req.user.nationality);
  res.json({
    course: {
      id: `a1-${language}`,
      level: "A1",
      title: "Parla Italiano - Corso intensivo A1",
      language,
      unitCount: courseA1Units.length,
      units: courseA1Units.map((unit) => ({
        ...unit,
        reviewPages: undefined,
        content: courseA1Lessons.find((lesson) => lesson.number === unit.number)
      }))
    }
  });
});

app.get("/api/portal/courses/a2", requireUser, requireCourseA2, (req, res) => {
  const language = req.user.role === "admin" && ["hindi", "albanese"].includes(req.query.language)
    ? req.query.language
    : languageForNationality(req.user.nationality);
  res.json({
    course: {
      id: `a2-${language}`,
      level: "A2",
      title: "Parla Italiano - Corso intensivo A2",
      language,
      unitCount: courseA2Units.length,
      units: courseA2Units.map((unit) => ({
        ...unit,
        content: courseA2Lessons.find((lesson) => lesson.number === unit.number)
      }))
    }
  });
});

app.get("/api/portal/courses/a2/materials/audio/:filename", requireUser, requireCourseA2, (req, res, next) => {
  const filename = String(req.params.filename || "");
  if (!courseA2AudioFiles.has(filename)) return next(httpError(404, "Materiale non trovato"));
  res.type("audio/mpeg");
  res.setHeader("Content-Disposition", "inline");
  return res.sendFile(filename, { root: path.join(courseA2Dir, "audio") }, (error) => {
    if (error && !res.headersSent) next(error.status === 404 ? httpError(404, "Materiale non trovato") : error);
  });
});

app.get("/api/portal/courses/a2/progress", requireUser, requireCourseA2, async (req, res, next) => {
  try {
    const all = await readJson(files.courseProgress, []);
    res.json({ progress: all.filter((item) => item.userId === req.user.id && item.level === "A2") });
  } catch (error) { next(error); }
});

app.put("/api/portal/courses/a2/progress/:unit", requireUser, requireCourseA2, async (req, res, next) => {
  try {
    const unit = Number(req.params.unit);
    if (!Number.isInteger(unit) || unit < 1 || unit > courseA2Units.length) throw httpError(400, "Unità non valida");
    const input = courseProgressSchema.parse(req.body);
    const saved = await withWriteLock(async () => {
      const all = await readJson(files.courseProgress, []);
      const index = all.findIndex((item) => item.userId === req.user.id && item.level === "A2" && item.unit === unit);
      if (index !== -1 && all[index].completed) {
        throw httpError(403, "Questa unità è già stata completata: le risposte non sono più modificabili.");
      }
      const record = { id: index === -1 ? randomUUID() : all[index].id, userId: req.user.id, level: "A2", unit, answers: input.answers, completed: input.completed, updatedAt: nowIso() };
      if (index === -1) all.push(record); else all[index] = record;
      await writeJson(files.courseProgress, all);
      return record;
    });
    res.json({ progress: saved });
  } catch (error) { next(error); }
});

app.get("/api/portal/courses/a1/materials/pages/:language/:filename", requireUser, requireCourseA1, (req, res, next) => {
  const language = String(req.params.language || "");
  const filename = String(req.params.filename || "");
  const assignedLanguage = languageForNationality(req.user.nationality);
  if (!courseA1PageFiles.has(filename) || !["hindi", "albanese"].includes(language)) return next(httpError(404, "Materiale non trovato"));
  if (req.user.role !== "admin" && language !== assignedLanguage) return next(httpError(403, "Lingua del materiale non autorizzata"));
  res.type("image/png");
  res.setHeader("Content-Disposition", "inline");
  return res.sendFile(filename, { root: path.join(courseA1Dir, language) }, (error) => {
    if (error && !res.headersSent) next(error.status === 404 ? httpError(404, "Materiale non trovato") : error);
  });
});

app.get("/api/portal/courses/a1/materials/audio/:filename", requireUser, requireCourseA1, (req, res, next) => {
  const filename = String(req.params.filename || "");
  if (!courseA1AudioFiles.has(filename)) return next(httpError(404, "Materiale non trovato"));
  res.type("audio/mpeg");
  res.setHeader("Content-Disposition", "inline");
  return res.sendFile(filename, { root: path.join(courseA1Dir, "audio") }, (error) => {
    if (error && !res.headersSent) next(error.status === 404 ? httpError(404, "Materiale non trovato") : error);
  });
});

app.get("/api/portal/courses/a1/progress", requireUser, requireCourseA1, async (req, res, next) => {
  try {
    const all = await readJson(files.courseProgress, []);
    res.json({ progress: all.filter((item) => item.userId === req.user.id && (!item.level || item.level === "A1")) });
  } catch (error) {
    next(error);
  }
});

app.put("/api/portal/courses/a1/progress/:unit", requireUser, requireCourseA1, async (req, res, next) => {
  try {
    const unit = Number(req.params.unit);
    if (!Number.isInteger(unit) || unit < 1 || unit > 12) throw httpError(400, "Unità non valida");
    const input = courseProgressSchema.parse(req.body);
    const saved = await withWriteLock(async () => {
      const all = await readJson(files.courseProgress, []);
      const index = all.findIndex((item) => item.userId === req.user.id && (!item.level || item.level === "A1") && item.unit === unit);
      if (index !== -1 && all[index].completed) {
        throw httpError(403, "Questa unità è già stata completata: le risposte non sono più modificabili.");
      }
      const record = {
        id: index === -1 ? randomUUID() : all[index].id,
        userId: req.user.id,
        level: "A1",
        unit,
        answers: input.answers,
        completed: input.completed,
        updatedAt: nowIso()
      };
      if (index === -1) all.push(record); else all[index] = record;
      await writeJson(files.courseProgress, all);
      return record;
    });
    res.json({ progress: saved });
  } catch (error) {
    next(error);
  }
});

app.post("/api/portal/quiz-results", quizLimiter, async (req, res, next) => {
  try {
    const input = quizSubmissionSchema.parse(req.body);
    const currentUser = await getCurrentUser(req);
    const student = currentUser?.role === "student" ? currentUser : null;
    if (student?.courseLevel && student.courseLevel !== input.level) {
      throw httpError(403, `Il test assegnato al tuo profilo è ${student.courseLevel}`);
    }
    const accountNames = String(student?.name || "").trim().split(/\s+/).filter(Boolean);
    const evaluation = evaluateQuiz(input.level, input.answers);
    const created = {
      id: randomUUID(),
      studentId: student?.id || "",
      level: input.level,
      firstName: student ? (accountNames.shift() || input.firstName) : input.firstName,
      lastName: student ? (accountNames.join(" ") || input.lastName) : input.lastName,
      email: student?.email || input.email,
      writing: input.writing,
      ...evaluation,
      emailSent: false,
      emailError: "",
      createdAt: nowIso()
    };

    await withWriteLock(async () => {
      const results = await readJson(files.quizResults, []);
      results.push(created);
      await writeJson(files.quizResults, results);
    });

    try {
      created.emailSent = await emailQuizResult(created);
    } catch (error) {
      created.emailError = "Invio email non riuscito";
      console.error(JSON.stringify({ requestId: req.id, message: "Quiz email failed", error: error.message }));
    }

    if (created.emailSent || created.emailError) {
      await withWriteLock(async () => {
        const results = await readJson(files.quizResults, []);
        const index = results.findIndex((item) => item.id === created.id);
        if (index !== -1) {
          results[index] = created;
          await writeJson(files.quizResults, results);
        }
      });
    }

    res.status(201).json({
      result: {
        id: created.id,
        level: created.level,
        score: created.score,
        total: created.total,
        percentage: created.percentage,
        errors: created.errors,
        emailSent: created.emailSent
      }
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/portal/quiz-results", requireUser, async (req, res, next) => {
  try {
    if (!hasPermission(req.user, "quiz-results:read")) {
      throw httpError(403, "Permesso risultati quiz richiesto");
    }
    const level = String(req.query.level || "").toUpperCase();
    const results = await readJson(files.quizResults, []);
    const visible = level === "A1" || level === "A2"
      ? results.filter((item) => item.level === level)
      : results;
    visible.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    res.json({ results: visible.slice(0, 1000) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/portal/auth/providers", (req, res) => {
  res.json({
    providers: {
      password: true,
      google: providerEnabled("google"),
      apple: providerEnabled("apple")
    }
  });
});

app.get("/api/portal/oauth/:provider/start", authLimiter, (req, res, next) => {
  try {
    const provider = providerFromParam(req.params.provider);
    if (!providerEnabled(provider)) throw httpError(503, `${providerDisplayName(provider)} non configurato`);

    const state = randomBytes(24).toString("base64url");
    const returnTo = safeReturnTo(String(req.query.returnTo || "/cliente/"));
    const config = oauthProviders[provider];
    const url = new URL(config.authorizeUrl);

    url.searchParams.set("client_id", config.clientId);
    url.searchParams.set("redirect_uri", oauthRedirectUri(provider));
    url.searchParams.set("response_type", "code");
    url.searchParams.set("state", state);

    if (provider === "google") {
      url.searchParams.set("scope", "openid email profile");
      url.searchParams.set("access_type", "online");
      url.searchParams.set("prompt", "select_account");
    } else {
      url.searchParams.set("scope", "name email");
      url.searchParams.set("response_mode", "form_post");
    }

    res.setHeader("Set-Cookie", oauthStateCookieHeader(encodeStateCookie({ state, provider, returnTo }), 10 * 60));
    res.redirect(302, url.toString());
  } catch (error) {
    if (error.status) return redirectToSite(res, "/cliente/", { access: "error", reason: error.message });
    return next(error);
  }
});

app.get("/api/portal/oauth/:provider/callback", authLimiter, (req, res, next) => {
  const provider = providerFromParam(req.params.provider);
  return finishOAuthCallback(provider, req, res, next);
});

app.post("/api/portal/oauth/apple/callback", authLimiter, (req, res, next) => {
  return finishOAuthCallback("apple", req, res, next);
});

app.post("/api/portal/auth/register", authLimiter, async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const passwordHash = await hashPassword(input.password);
    const user = await withWriteLock(async () => {
      const users = await readJson(files.users, []);
      if (users.some((existing) => existing.email === input.email)) {
        throw httpError(409, "Email gia registrata");
      }
      if (users.some((existing) => existing.username === input.username)) {
        throw httpError(409, "Username gia registrato");
      }
      const created = {
        id: randomUUID(),
        role: "client",
        name: input.name,
        username: input.username,
        email: input.email,
        phone: input.phone,
        permissions: permissionsForRole("client"),
        passwordHash,
        createdAt: nowIso(),
        updatedAt: nowIso()
      };
      users.push(created);
      await writeJson(files.users, users);
      return created;
    });

    const token = await createSession(user.id);
    res.setHeader("Set-Cookie", cookieHeader(token, sessionDays * 24 * 60 * 60));
    res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/portal/auth/login", authLimiter, async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const users = await readJson(files.users, []);
    const user = users.find((existing) => (
      existing.email === input.identifier ||
      existing.username === input.identifier
    ));
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      throw httpError(401, "Username/email o password non corretti");
    }

    const token = await createSession(user.id);
    res.setHeader("Set-Cookie", cookieHeader(token, sessionDays * 24 * 60 * 60));
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/portal/auth/logout", async (req, res, next) => {
  try {
    const token = parseCookies(req.headers.cookie || "")[cookieName];
    await deleteSession(token);
    res.setHeader("Set-Cookie", clearCookieHeader());
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/portal/auth/me", async (req, res, next) => {
  try {
    const user = await getCurrentUser(req);
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/portal/contact", requireUser, async (req, res, next) => {
  try {
    if (!hasPermission(req.user, "requests:read:own")) {
      throw httpError(403, "Il contatto riservato e disponibile solo ai clienti.");
    }
    const configuredPhone = await configuredSupportPhone();
    if (!configuredPhone) {
      throw httpError(503, "Contatto telefonico non configurato.");
    }

    const requests = await readJson(files.requests, []);
    const hasSubmittedRequest = requests.some((request) => request.customerId === req.user.id);
    if (!hasSubmittedRequest) {
      throw httpError(403, "Invia prima una richiesta per vedere il numero di contatto.");
    }

    res.json({
      phone: configuredPhone,
      tel: `tel:${configuredPhone}`
    });
  } catch (error) {
    next(error);
  }
});
app.get("/api/portal/requests", requireUser, async (req, res, next) => {
  try {
    const [requests, users] = await Promise.all([
      readJson(files.requests, []),
      readJson(files.users, [])
    ]);
    const visible = hasPermission(req.user, "requests:read:all")
      ? requests.map((request) => requestWithCustomer(request, users))
      : requests.filter((request) => request.customerId === req.user.id).map(normalizeForClient);
    visible.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    res.json({ requests: visible });
  } catch (error) {
    next(error);
  }
});

app.get("/api/portal/users", requireUser, requireAdmin, async (req, res, next) => {
  try {
    const users = await readJson(files.users, []);
    users.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    res.json({ users: users.map(publicUser) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/portal/students", requireUser, requireAdmin, async (req, res, next) => {
  try {
    const [users, progress] = await Promise.all([
      readJson(files.users, []),
      readJson(files.courseProgress, [])
    ]);
    const students = users
      .filter((user) => user.role === "student")
      .map((user) => {
        const studentProgress = progress
          .filter((item) => item.userId === user.id)
          .map(({ id, level, unit, answers, completed, updatedAt }) => ({ id, level: level || "A1", unit, answers, completed, updatedAt }))
          .sort((a, b) => String(a.level).localeCompare(String(b.level)) || a.unit - b.unit);
        return {
          ...publicUser(user),
          completedUnits: studentProgress.filter((item) => item.completed && item.level === user.courseLevel).length,
          progress: studentProgress
        };
      })
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    res.json({ students });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/portal/students/:id", requireUser, requireAdmin, async (req, res, next) => {
  try {
    const input = studentAssignmentSchema.parse(req.body);
    const updated = await withWriteLock(async () => {
      const users = await readJson(files.users, []);
      const index = users.findIndex((user) => user.id === req.params.id && user.role === "student");
      if (index === -1) throw httpError(404, "Studente non trovato");
      users[index] = {
        ...users[index],
        nationality: input.nationality,
        courseLanguage: languageForNationality(input.nationality),
        courseLevel: input.courseLevel,
        updatedAt: nowIso()
      };
      await writeJson(files.users, users);
      return users[index];
    });
    res.json({ student: publicUser(updated) });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/portal/students/:id", requireUser, requireAdmin, async (req, res, next) => {
  try {
    await withWriteLock(async () => {
      const users = await readJson(files.users, []);
      const index = users.findIndex((user) => user.id === req.params.id && user.role === "student");
      if (index === -1) throw httpError(404, "Studente non trovato");
      users.splice(index, 1);
      await writeJson(files.users, users);

      const progress = await readJson(files.courseProgress, []);
      await writeJson(files.courseProgress, progress.filter((item) => item.userId !== req.params.id));

      const sessions = await readJson(files.sessions, []);
      await writeJson(files.sessions, sessions.filter((session) => session.userId !== req.params.id));
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/portal/requests", requireUser, async (req, res, next) => {
  try {
    if (!hasPermission(req.user, "requests:create")) {
      throw httpError(403, "Permesso creazione richieste richiesto");
    }
    const input = requestSchema.parse(req.body);
    const request = await withWriteLock(async () => {
      const requests = await readJson(files.requests, []);
      const created = {
        id: randomUUID(),
        customerId: req.user.id,
        service: input.service,
        subject: input.subject,
        message: input.message,
        preferredDate: input.preferredDate,
        preferredTime: input.preferredTime,
        phone: input.phone || req.user.phone || "",
        status: "new",
        adminNote: "",
        createdAt: nowIso(),
        updatedAt: nowIso()
      };
      requests.push(created);
      await writeJson(files.requests, requests);
      return created;
    });
    res.status(201).json({ request: normalizeForClient(request) });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/portal/requests/:id", requireUser, requireAdmin, async (req, res, next) => {
  try {
    const input = adminUpdateSchema.parse(req.body);
    const [updated, users] = await withWriteLock(async () => {
      const requests = await readJson(files.requests, []);
      const index = requests.findIndex((request) => request.id === req.params.id);
      if (index === -1) throw httpError(404, "Richiesta non trovata");
      requests[index] = {
        ...requests[index],
        ...input,
        updatedAt: nowIso()
      };
      await writeJson(files.requests, requests);
      const allUsers = await readJson(files.users, []);
      return [requests[index], allUsers];
    });
    res.json({ request: requestWithCustomer(updated, users) });
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  const status = error.status || (error instanceof z.ZodError ? 400 : 500);
  const message = error instanceof z.ZodError ? "Dati non validi" : error.message || "Errore server";
  if (status >= 500) {
    console.error(JSON.stringify({
      requestId: req.id,
      message,
      stack: error.stack
    }));
  }
  res.status(status).json({ error: message, requestId: req.id });
});

app.listen(port, () => {
  console.log(`Portal API listening on port ${port}`);
});
