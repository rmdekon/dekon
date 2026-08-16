# 🚀 Deploy DEKON on Netlify (free, no credit card)

The repo is already configured for Netlify (`netlify.toml` +
`netlify/functions/api.js`). It uses a free **Turso** cloud database so your
data persists.

---

## Part A — Create the Turso database (if you haven't)

1. https://turso.tech → **Start free** → sign in with GitHub/Google.
2. **Create Database**, name it `dekon`.
3. Copy the **URL** (`libsql://dekon-xxxx.turso.io`).
4. **Create Token** (Full Access, no expiry) → copy the `eyJ...` token.

---

## Part B — Push code to GitHub

```bash
git init
git add .
git commit -m "DEKON"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/dekon.git
git push -u origin main
```

---

## Part C — Deploy on Netlify

1. Go to https://app.netlify.com → **Sign up** → **Sign up with GitHub** (free).
2. Click **Add new site** → **Import an existing project**.
3. Choose **GitHub** and select your `dekon` repository.
4. Netlify auto-reads `netlify.toml`, so **leave build settings as-is**:
   - Build command: `npm install`
   - Publish directory: `public`
5. Click **Show advanced** → **New variable** and add these environment variables:

   | Key | Value |
   |-----|-------|
   | `JWT_SECRET` | any long random text |
   | `TURSO_DATABASE_URL` | your libsql:// URL |
   | `TURSO_AUTH_TOKEN` | your eyJ... token |
   | `NODE_VERSION` | `22` |

6. Click **Deploy site**. Wait ~1–2 minutes.

---

## Part D — Set APP_URL and enable Google Sign-In

1. In Netlify → **Site configuration** → **Environment variables**, add:
   - `APP_URL` = your site URL (e.g. `https://dekon-xxxx.netlify.app`, no trailing slash)
2. Go to **Deploys** → **Trigger deploy** → **Deploy site** to apply it.

For Google:
1. Add this Authorized redirect URI in Google Cloud Console:
   `https://dekon-xxxx.netlify.app/api/auth/google/callback`
2. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables in
   Netlify, then redeploy.

---

## Updating after code changes

```bash
git add .
git commit -m "changes"
git push
```
Netlify auto-redeploys.

## Troubleshooting

- **Function 404 / API errors** → confirm `netlify.toml` and
  `netlify/functions/api.js` were committed and pushed.
- **500 error / login fails** → open Netlify **Functions** log; usually a
  missing/incorrect `TURSO_DATABASE_URL` or `TURSO_AUTH_TOKEN`.
- **Logged out on refresh** → set `APP_URL` to your exact Netlify URL and redeploy.
