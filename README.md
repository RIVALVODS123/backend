# Urban Legacy — Whitelist Backend

Node.js/Express API that receives whitelist form submissions from the frontend, scores the quiz, stores results in PostgreSQL, and sends Discord notifications to staff.

## Stack

| Layer | Tech |
|-------|------|
| Runtime | Node.js 18+ |
| Framework | Express 4 |
| Database | PostgreSQL (Railway) |
| Notifications | Discord Webhooks |
| Deploy | Railway |

## Setup local

```bash
cd backend
cp .env.example .env
# Edit .env with your values
npm install
npm run dev
```

## Environment variables (Railway)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Auto-set by Railway when you add a PostgreSQL service |
| `NODE_ENV` | ✅ | Set to `production` |
| `ALLOWED_ORIGINS` | ✅ | Comma-separated frontend URLs, e.g. `https://urbanlegacy.es` |
| `DISCORD_WEBHOOK_URL` | ⬜ | Discord staff channel webhook URL |

## Deploy to Railway

1. Push this `backend/` folder as a **separate GitHub repository** (or a monorepo with Railway's root directory set to `/backend`).
2. In Railway: **New Project → Deploy from GitHub repo**.
3. Add a **PostgreSQL** service to the same project — Railway will inject `DATABASE_URL` automatically.
4. Set the environment variables listed above.
5. Railway will build and deploy automatically on every push.

## API

### `POST /forms/whitelist`

Receives a whitelist application.

**Body (JSON)**
```json
{
  "discord_id": "Usuario#1234",
  "data": {
    "edad": "22",
    "fuente": "amigo",
    "exp": "media",
    "otros-servers": "...",
    "question-0": "B",
    "question-0-index": "4",
    "...": "...",
    "sit-1": "...",
    "sit-2": "...",
    "sit-3": "...",
    "pg-nombre": "Kael Voss",
    "pg-raza": "Humano",
    "historia": "...",
    "pregunta": "..."
  }
}
```

**Success `201`**
```json
{ "success": true, "id": 42, "quizScore": 8 }
```

**Validation error `422`**
```json
{ "success": false, "errors": [ ... ] }
```

### `GET /health`

Returns `{ "status": "ok" }` — used by Railway health checks.

## Security measures

- **Helmet** — sets secure HTTP headers
- **CORS** — only accepts requests from `ALLOWED_ORIGINS`
- **Rate limiting** — 3 submissions/IP/hour on `/forms/whitelist`, 100 req/15 min globally
- **Input validation** — every field validated server-side with `express-validator`
- **Body size limit** — 64 KB max payload
- **IP hashing** — raw IPs are never stored; only SHA-256 hash for abuse detection
- **Parameterized queries** — SQL injection prevented via `pg` placeholders
