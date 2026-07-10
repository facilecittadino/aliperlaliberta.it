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
  sessions: path.join(dataDir, "sessions.json")
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
  admin: Object.freeze(["requests:read:all", "requests:update", "users:read"]),
  client: Object.freeze(["requests:create", "requests:read:own"])
});

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

app.use(generalLimiter);
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin non consentita"));
  },
  methods: ["GET", "POST", "PATCH", "OPTIONS"],
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
    permissions: permissionsForRole(user.role, user.permissions),
    providers: (user.authProviders || []).map((provider) => provider.provider),
    createdAt: user.createdAt
  };
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
    const activeSessions = sessions.filter((session) => session.expiresAt > cutoff);
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
