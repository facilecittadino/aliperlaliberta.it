# Deploy VPS

Questo setup sostituisce il vecchio server non raggiungibile `app.apll.it`.

## Obiettivo

- Servire il sito statico su `https://aliperlaliberta.it`.
- Servire l'API calendario su `https://api.aliperlaliberta.it`.
- Servire l'area clienti/admin su `https://api.aliperlaliberta.it/api/portal`.
- Lasciare attivo il form WhatsApp locale finche l'API calendario non e pronta.

## File principali

- `deploy/Caddyfile.example`: reverse proxy HTTPS e static file server.
- `deploy/Caddyfile.docker.example`: Caddyfile usato quando Caddy gira in Docker.
- `backend/calendar-api`: API Node per disponibilita e prenotazioni Google Calendar.
- `backend/portal-api`: API Node per login clienti/admin e richieste.
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
curl https://api.aliperlaliberta.it/api/portal/health
```

## Attivare area clienti/admin

1. Copia `backend/portal-api` in `/opt/apll/portal-api`.
2. Crea `/etc/apll/portal-api.env` partendo da `backend/portal-api/.env.example`.
3. Verifica che l'account admin sia gia provisionato offline nel data store server.
4. Avvia il container:

```bash
docker network create apll-net
docker network connect apll-net aliperlaliberta-caddy
docker build -t apll-portal-api /opt/apll/portal-api
docker run -d --name apll-portal-api \
  --restart unless-stopped \
  --network apll-net \
  --env-file /etc/apll/portal-api.env \
  -v /srv/aliperlaliberta/portal-data:/data \
  apll-portal-api
```

5. Apri `https://aliperlaliberta.it/admin/` e accedi con l'account admin gia creato.

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
