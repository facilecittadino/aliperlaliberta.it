# Deploy VPS

Questo setup sostituisce il vecchio server non raggiungibile `app.apll.it`.

## Obiettivo

- Servire il sito statico su `https://aliperlaliberta.it`.
- Servire l'API calendario su `https://api.aliperlaliberta.it`.
- Lasciare attivo il form WhatsApp locale finche l'API calendario non e pronta.

## File principali

- `deploy/Caddyfile.example`: reverse proxy HTTPS e static file server.
- `backend/calendar-api`: API Node per disponibilita e prenotazioni Google Calendar.
- `backend/calendar-api/deploy/calendar-api.service.example`: servizio systemd.
- `deploy/DNS_ARUBA.md`: record DNS da impostare nel pannello Aruba.

## Passi sul VPS

1. Crea il VPS Linux.
2. Installa Node.js 22, Caddy e Git.
3. Copia il sito in `/var/www/aliperlaliberta.it`.
4. Copia `backend/calendar-api` in `/opt/apll/calendar-api`.
5. Copia `.env.example` in `/etc/apll/calendar-api.env` e inserisci i segreti Google.
6. Installa dipendenze API:

```bash
cd /opt/apll/calendar-api
npm install --omit=dev
```

7. Installa il servizio systemd partendo da `backend/calendar-api/deploy/calendar-api.service.example`.
8. Copia `deploy/Caddyfile.example` in `/etc/caddy/Caddyfile`.
9. Cambia i record DNS Aruba usando `deploy/DNS_ARUBA.md`.
10. Verifica:

```bash
curl https://api.aliperlaliberta.it/health
curl https://api.aliperlaliberta.it/status
```

## Attivare prenotazione calendario

Solo dopo che API, DNS e credenziali Google sono funzionanti, modifica `js/config.js`:

```js
CALENDAR_BOOKING: Object.freeze({
  ENABLED: true,
  API_BASE_URL: "https://api.aliperlaliberta.it",
  ENDPOINTS: Object.freeze({
    AVAILABILITY: "/api/calendar/availability",
    BOOK: "/api/calendar/book"
  })
})
```

Finche resta `ENABLED: false`, il sito usa il form WhatsApp locale.
