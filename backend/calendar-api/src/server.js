import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { google } from "googleapis";
import { DateTime } from "luxon";
import { z } from "zod";
import { randomUUID } from "node:crypto";

const app = express();
const timezone = process.env.TIMEZONE || "Europe/Rome";
const slotMinutes = Number(process.env.SLOT_MINUTES || 30);
const bookingDurationMinutes = Number(process.env.BOOKING_DURATION_MINUTES || 30);
const workdayStart = process.env.WORKDAY_START || "09:00";
const workdayEnd = process.env.WORKDAY_END || "18:00";
const maxDaysAhead = Number(process.env.MAX_DAYS_AHEAD || 60);
const requireTurnstile = process.env.REQUIRE_TURNSTILE === "true";
const turnstileSecretKey = process.env.TURNSTILE_SECRET_KEY || "";

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const calendarIds = {
  practices: process.env.GOOGLE_CALENDAR_PRACTICES_ID || "",
  "italian-course": process.env.GOOGLE_CALENDAR_ITALIAN_COURSE_ID || ""
};

const kindSchema = z.enum(["practices", "italian-course"]);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const availabilitySchema = z.object({
  kind: kindSchema,
  date: dateSchema,
  service: z.string().trim().min(1).max(120).optional()
});

const bookingSchema = z.object({
  kind: kindSchema,
  service: z.string().trim().min(1).max(120),
  slot: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
    label: z.string().trim().max(40).optional()
  }),
  customer: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(160),
    phone: z.string().trim().min(6).max(40)
  }),
  notes: z.string().trim().max(1000).optional().default(""),
  timezone: z.string().trim().max(80).optional().default(timezone),
  captchaToken: z.string().trim().max(2048).optional().default("")
});

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet());
app.use(express.json({ limit: "20kb" }));
app.use((req, res, next) => {
  req.id = randomUUID();
  res.setHeader("X-Request-Id", req.id);
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.use((req, res, next) => {
  const started = Date.now();
  res.on("finish", () => {
    console.log(JSON.stringify({
      requestId: req.id,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - started
    }));
  });
  next();
});
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_GENERAL || 120),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests" }
});
const availabilityLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_AVAILABILITY || 60),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many availability requests" }
});
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_BOOKING || 8),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many booking requests" }
});
app.use(generalLimiter);
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, false);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Accept"],
  credentials: false
}));

function assertProductionConfig() {
  if (!allowedOrigins.length) throw new Error("ALLOWED_ORIGINS must contain at least one origin");
  requiredEnv("GOOGLE_CLIENT_EMAIL");
  requiredEnv("GOOGLE_PRIVATE_KEY");
  if (!calendarIds.practices) throw new Error("GOOGLE_CALENDAR_PRACTICES_ID is missing");
  if (!calendarIds["italian-course"]) throw new Error("GOOGLE_CALENDAR_ITALIAN_COURSE_ID is missing");
  if (requireTurnstile && !turnstileSecretKey) {
    throw new Error("REQUIRE_TURNSTILE=true but TURNSTILE_SECRET_KEY is missing");
  }
  if (slotMinutes <= 0 || bookingDurationMinutes <= 0) {
    throw new Error("Slot and booking durations must be positive");
  }
  if (minutesOfDay(workdayStart) >= minutesOfDay(workdayEnd)) {
    throw new Error("WORKDAY_START must be before WORKDAY_END");
  }
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function calendarClient() {
  const clientEmail = requiredEnv("GOOGLE_CLIENT_EMAIL");
  const privateKey = requiredEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n");
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar"]
  });
  return google.calendar({ version: "v3", auth });
}

function calendarIdFor(kind) {
  const id = calendarIds[kind];
  if (!id) throw httpError(500, `Calendar not configured for ${kind}`);
  return id;
}

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function sanitizeCalendarText(value, max = 120) {
  return String(value || "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

async function verifyTurnstile(token, remoteIp) {
  if (!requireTurnstile) return;
  if (!token) throw httpError(400, "Captcha required");

  const body = new URLSearchParams();
  body.set("secret", turnstileSecretKey);
  body.set("response", token);
  if (remoteIp) body.set("remoteip", remoteIp);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  const result = await response.json().catch(() => ({}));
  if (!result.success) throw httpError(400, "Captcha verification failed");
}

function isDateAllowed(date) {
  const requested = DateTime.fromISO(date, { zone: timezone }).startOf("day");
  const today = DateTime.now().setZone(timezone).startOf("day");
  const max = today.plus({ days: maxDaysAhead });
  return requested.isValid && requested >= today && requested <= max;
}

function minutesOfDay(value) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function isoForDateMinutes(date, minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return DateTime.fromISO(`${date}T${h}:${m}:00`, { zone: timezone }).toISO();
}

function overlaps(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

async function listBusy(calendar, calendarId, timeMin, timeMax) {
  const result = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      timeZone: timezone,
      items: [{ id: calendarId }]
    }
  });
  return result.data.calendars?.[calendarId]?.busy || [];
}

async function availableSlots({ kind, date }) {
  if (!isDateAllowed(date)) return [];

  const calendar = calendarClient();
  const calendarId = calendarIdFor(kind);
  const startMinutes = minutesOfDay(workdayStart);
  const endMinutes = minutesOfDay(workdayEnd);
  const timeMin = isoForDateMinutes(date, startMinutes);
  const timeMax = isoForDateMinutes(date, endMinutes);
  const busy = await listBusy(calendar, calendarId, timeMin, timeMax);
  const slots = [];

  for (let start = startMinutes; start + bookingDurationMinutes <= endMinutes; start += slotMinutes) {
    const end = start + bookingDurationMinutes;
    const startIso = isoForDateMinutes(date, start);
    const endIso = isoForDateMinutes(date, end);
    const startDate = new Date(startIso);
    const endDate = new Date(endIso);
    const taken = busy.some((item) => overlaps(startDate, endDate, new Date(item.start), new Date(item.end)));
    if (!taken) {
      const label = `${String(Math.floor(start / 60)).padStart(2, "0")}:${String(start % 60).padStart(2, "0")}`;
      slots.push({ start: startIso, end: endIso, label });
    }
  }

  return slots;
}

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/calendar/availability", availabilityLimiter, async (req, res, next) => {
  try {
    const input = availabilitySchema.parse(req.query);
    const slots = await availableSlots(input);
    res.json({ slots });
  } catch (error) {
    next(error);
  }
});

app.post("/api/calendar/book", bookingLimiter, async (req, res, next) => {
  try {
    const input = bookingSchema.parse(req.body);
    await verifyTurnstile(input.captchaToken, req.ip);

    const date = input.slot.start.slice(0, 10);
    const slots = await availableSlots({ kind: input.kind, date });
    const stillAvailable = slots.some((slot) => slot.start === input.slot.start && slot.end === input.slot.end);
    if (!stillAvailable) throw httpError(409, "Selected slot is no longer available");

    const calendar = calendarClient();
    const calendarId = calendarIdFor(input.kind);
    const safeSummary = `${sanitizeCalendarText(input.service, 80)} - ${sanitizeCalendarText(input.customer.name, 80)}`;
    const description = [
      `Servizio: ${sanitizeCalendarText(input.service, 120)}`,
      `Nome: ${sanitizeCalendarText(input.customer.name, 120)}`,
      `Email: ${sanitizeCalendarText(input.customer.email, 160)}`,
      `Telefono: ${sanitizeCalendarText(input.customer.phone, 40)}`,
      input.notes ? `Note: ${sanitizeCalendarText(input.notes, 1000)}` : "",
      "",
      "Prenotazione creata dal sito aliperlaliberta.it"
    ].filter(Boolean).join("\n");

    await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: safeSummary,
        description,
        start: { dateTime: input.slot.start, timeZone: input.timezone || timezone },
        end: { dateTime: input.slot.end, timeZone: input.timezone || timezone },
        attendees: [{ email: input.customer.email, displayName: input.customer.name }],
        reminders: { useDefault: true }
      },
      sendUpdates: "all"
    });

    res.status(201).json({
      ok: true,
      requestId: req.id
    });
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  const status = error.status || (error instanceof z.ZodError ? 400 : 500);
  const message = error instanceof z.ZodError ? "Invalid request" : error.message || "Server error";
  if (status >= 500) console.error(error);
  res.status(status).json({ error: message });
});

const port = Number(process.env.PORT || 8787);
assertProductionConfig();
app.listen(port, () => {
  console.log(`Calendar API listening on port ${port}`);
});
