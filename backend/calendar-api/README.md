# Ali Per La Libertà Calendar API

Secure backend for booking appointments from `aliperlaliberta.it` using Google Calendar.

## Why this exists

Google Calendar credentials must never be placed in frontend JavaScript. This API keeps credentials on the server and exposes only safe endpoints:

- `GET /api/calendar/availability?kind=practices&date=YYYY-MM-DD&service=...`
- `POST /api/calendar/book`

Supported `kind` values:

- `practices` for CAF / Patronato / legal assistance
- `italian-course` for Italian language course A1/A2

## Security design

- Google service account credentials are read only from environment variables.
- CORS is restricted to configured origins.
- Helmet security headers are enabled.
- General, availability, and booking rate limits are enabled.
- Inputs are validated with Zod.
- The browser never receives Google tokens, calendar IDs, or private keys.
- The API checks current busy slots immediately before creating an event.
- Event internal links are not returned to the public browser.
- Optional Cloudflare Turnstile verification is supported via environment variables.
- Logs include request id, route, status, and duration, but not customer PII.

## Google setup

1. Create a Google Cloud project.
2. Enable Google Calendar API.
3. Create a service account.
4. Copy service account email and private key into server environment variables.
5. Share each Google Calendar with the service account email with permission to make changes.
6. Copy the calendar IDs into:
   - `GOOGLE_CALENDAR_PRACTICES_ID`
   - `GOOGLE_CALENDAR_ITALIAN_COURSE_ID`

## Deploy

Copy `.env.example` to `.env` on the server and fill secrets. Never commit `.env`.

```bash
npm install
npm start
```

Recommended public base URL:

`https://app.apll.it`

Then set frontend config:

```js
CALENDAR_BOOKING: {
  ENABLED: true,
  API_BASE_URL: "https://app.apll.it",
  ...
}
```

## Endpoints

### `GET /health`

Returns `{ "ok": true }` when the process is running.

### `GET /api/calendar/availability`

Query parameters:

- `kind`: `practices` or `italian-course`
- `date`: `YYYY-MM-DD`
- `service`: optional display label

Response:

```json
{
  "slots": [
    { "start": "2026-06-24T09:00:00.000+02:00", "end": "2026-06-24T09:30:00.000+02:00", "label": "09:00" }
  ]
}
```

### `POST /api/calendar/book`

Creates an event only if the selected slot is still available.

Returns only:

```json
{ "ok": true, "requestId": "..." }
```

## Safer production flow

1. Deploy API on `127.0.0.1:8787`.
2. Put Caddy/Nginx in front with HTTPS on `app.apll.it`.
3. Confirm `/health` works.
4. Confirm availability works from `https://aliperlaliberta.it`.
5. Confirm test booking lands in the correct Google Calendar.
6. Only then enable the frontend calendar:

```js
CALENDAR_BOOKING: {
  ENABLED: true,
  API_BASE_URL: "https://app.apll.it"
}
```

If bots start sending spam, set:

```env
REQUIRE_TURNSTILE=true
TURNSTILE_SECRET_KEY=...
```

and add the Turnstile widget token to the frontend booking payload.
