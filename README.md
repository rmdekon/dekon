# DEKON — Personal Finance Hub 🇬🇭 (Full Stack)

A Ghana Cedi (GH₵) personal finance tracker with a real backend:

- **Email + password** sign-up / sign-in (passwords hashed with bcrypt)
- **Sign in with Google** (OAuth 2.0 — add keys to `.env` to enable)
- Per-user **transactions** and **budgets** stored in SQLite
- Same dashboard, deep analytics, ledger (search/filter/sort), CSV export, and budget manager as the original app

## Tech stack

| Layer    | Technology |
|----------|------------|
| Frontend | Static HTML + Tailwind (CDN) + Chart.js |
| Backend  | Node.js + Express |
| Database | Built-in SQLite via `node:sqlite` (requires **Node.js 22.5+**, file in `data/`). No native compilation needed. |
| Auth     | JWT in an httpOnly cookie + Passport (Google) |

> Requires **Node.js 22.5 or newer** (your v24 is perfect).

## Quick start

```bash
cd dekon
npm install
cp .env.example .env      # then edit .env (JWT_SECRET is required)
npm start
```

Open http://localhost:3000.

The first time you register, your account is seeded with the same Ghana demo
transactions and budgets from the original app. You can reset them any time
with the circular-arrow button in the header.

## Configuration (.env)

| Variable | Required | Purpose |
|----------|----------|---------|
| `JWT_SECRET` | **yes** | Secret used to sign login tokens. Use a long random string. |
| `JWT_EXPIRES_IN` | no | Session lifetime, e.g. `7d`, `24h`. Default `7d`. |
| `PORT` | no | Port to listen on. Default `3000`. |
| `APP_URL` | for Google | Public base URL, e.g. `http://localhost:3000` (no trailing slash). |
| `GOOGLE_CLIENT_ID` | for Google | From Google Cloud Console → Credentials. |
| `GOOGLE_CLIENT_SECRET` | for Google | From Google Cloud Console → Credentials. |

## Enabling "Sign in with Google"

Password login works with no extra setup. To enable Google:

1. Go to https://console.cloud.google.com/apis/credentials
2. Create an **OAuth 2.0 Client ID** (Web application type).
3. Add an **Authorized redirect URI**:
   - Local dev: `http://localhost:3000/api/auth/google/callback`
   - Production: `https://YOUR_DOMAIN/api/auth/google/callback`
4. Put the client ID/secret in `.env` as `GOOGLE_CLIENT_ID` and
   `GOOGLE_CLIENT_SECRET`, set `APP_URL`, and restart the server.

If Google keys are absent, the Google button is automatically disabled with a
note — email/password sign-in continues to work.

## API reference

All data routes require a valid session cookie.

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/auth/me` | Current user + whether Google is enabled |
| `POST` | `/api/auth/register` | `{ name, email, password }` → sets cookie |
| `POST` | `/api/auth/login` | `{ email, password }` → sets cookie |
| `POST` | `/api/auth/logout` | Clears session |
| `GET`  | `/api/auth/google` | Starts Google OAuth |
| `GET`  | `/api/auth/google/callback` | Google redirect target |
| `GET`  | `/api/state` | `{ transactions, budgets }` for the user |
| `POST` | `/api/transactions` | Create a transaction |
| `DELETE` | `/api/transactions/:id` | Delete a transaction |
| `PUT`  | `/api/budgets` | `{ budgets: [{ category, limit }] }` |
| `DELETE` | `/api/account` | Delete account and all its data |

## Project structure

```
dekon/
├── package.json
├── .env.example
├── server/
│   ├── index.js     # Express app, API + OAuth routes
│   ├── db.js        # SQLite schema/connection
│   └── auth.js      # JWT cookie helpers + middleware
├── public/
│   └── index.html   # Frontend app
└── data/            # SQLite database is created here (git-ignored)
```

## Security notes

- Passwords are never stored in plain text — bcrypt hashes only.
- The JWT lives in an `httpOnly`, `SameSite=Lax` cookie (not accessible to JS).
- In production set `NODE_ENV=production` so the cookie is marked `Secure`,
  and serve the app over HTTPS.
