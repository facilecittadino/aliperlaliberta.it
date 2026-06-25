# Calendar API security checklist

Use this checklist before enabling `CALENDAR_BOOKING.ENABLED=true` in the frontend.

## Secrets

- Never commit `.env`.
- Never commit service account JSON, `.pem`, `.key`, or private keys.
- Store secrets in `/etc/apll/calendar-api.env` or your host secret manager.
- Rotate the Google service account key if it is ever pasted into chat, email, or a repo.

## Google permissions

- Use a dedicated Google service account.
- Share only the two required calendars with that service account.
- Grant the minimum practical permission needed to create events.
- Do not share personal primary calendars if a dedicated calendar can be used.

## Network

- Serve only through HTTPS.
- Put Caddy/Nginx in front of Node.
- Expose Node only on `127.0.0.1:8787`.
- Firewall: allow public 80/443 only; SSH only from trusted IPs when possible.

## API controls

- Keep `ALLOWED_ORIGINS` restricted to:
  - `https://aliperlaliberta.it`
  - `https://www.aliperlaliberta.it`
- Keep rate limits enabled.
- Turn on `REQUIRE_TURNSTILE=true` if bots or spam appear.
- Keep request body limit small.

## Monitoring

- Watch `journalctl -u calendar-api -f`.
- Alert on repeated 4xx/5xx or high booking attempts.
- Keep Node and OS packages updated.

## Frontend activation

Only after `/health`, `/api/calendar/availability`, and `/api/calendar/book` work over HTTPS:

```js
CALENDAR_BOOKING: {
  ENABLED: true,
  API_BASE_URL: "https://app.apll.it"
}
```
