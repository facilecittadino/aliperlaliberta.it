# APLL Portal API

Backend per area clienti e area admin.

## Endpoint principali

- `GET /api/portal/health`
- `GET /api/portal/setup-status`
- `POST /api/portal/setup-admin`
- `GET /api/portal/auth/providers`
- `GET /api/portal/oauth/google/start`
- `GET /api/portal/oauth/apple/start`
- `POST /api/portal/auth/register`
- `POST /api/portal/auth/login`
- `POST /api/portal/auth/logout`
- `GET /api/portal/auth/me`
- `GET /api/portal/users`
- `GET /api/portal/requests`
- `POST /api/portal/requests`
- `PATCH /api/portal/requests/:id`

## Deploy Docker

```bash
docker build -t apll-portal-api /opt/apll/portal-api
docker run -d --name apll-portal-api \
  --restart unless-stopped \
  --env-file /etc/apll/portal-api.env \
  -v /srv/aliperlaliberta/portal-data:/data \
  -p 127.0.0.1:8790:8790 \
  apll-portal-api
```

Il primo admin si crea da `/admin/` usando `ADMIN_SETUP_TOKEN`.

## Credenziali OAuth

### Google

In Google Cloud Console crea un OAuth Client di tipo Web.

- Authorized JavaScript origins:
  - `https://aliperlaliberta.it`
  - `https://www.aliperlaliberta.it`
- Authorized redirect URI:
  - `https://api.aliperlaliberta.it/api/portal/oauth/google/callback`

Poi inserisci in `/etc/apll/portal-api.env`:

```env
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
```

### Apple

In Apple Developer configura Sign in with Apple per il web usando il dominio pubblico.

- Domain:
  - `aliperlaliberta.it`
- Return URL:
  - `https://api.aliperlaliberta.it/api/portal/oauth/apple/callback`

Poi inserisci in `/etc/apll/portal-api.env` una di queste configurazioni:

```env
APPLE_CLIENT_ID=...
APPLE_CLIENT_SECRET=...
```

oppure:

```env
APPLE_CLIENT_ID=...
APPLE_TEAM_ID=...
APPLE_KEY_ID=...
APPLE_PRIVATE_KEY=...
```

Il login social crea solo utenti cliente. Gli admin devono usare username/password.
