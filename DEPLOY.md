# 🚀 Deploy DEKON online for FREE (no credit card)

We'll use two free services — **no card required for either**:

- **Turso** → stores your database (free forever, 500 databases, 9 GB)
- **Render** → hosts the app/site (free plan; sleeps after 15 min of no visitors, but wakes in seconds when someone opens it)

The code already supports both. When you run it on your PC, it uses a local
database file; when deployed with the `TURSO_*` settings, it uses the cloud DB.

---

## Part A — Create your free Turso database

1. Go to **https://turso.tech** and click **Start free** → sign up with GitHub or Google.
2. Once in the dashboard, click **Create Database**.
   - Name it anything, e.g. `dekon`
   - Pick any region (closest to you is fine)
   - Click **Create**
3. On the database page, find the **URL** that looks like:
   ```
   libsql://dekon--yourname.turso.io
   ```
   Copy it — this is your `TURSO_DATABASE_URL`.
4. Click **Create Token** (top right), choose **Full Access**, leave expiry as **Never**, and click **Create Token**.
   - Copy the long token that starts with `eyJ...` — this is your `TURSO_AUTH_TOKEN`.
   - **Save these two values somewhere safe** for Part B.

---

## Part B — Put your code on GitHub

Render deploys straight from GitHub.

1. Create a free GitHub account if you don't have one: https://github.com/signup
2. Create a **new repository**: https://github.com/new
   - Name it `dekon` (or anything), set it to **Public**, don't add a README.
3. Push your code. In PowerShell/terminal **inside your dekon folder**:

   ```bash
   git init
   git add .
   git commit -m "DEKON full stack app"
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/dekon.git
   git push -u origin main
   ```

   (If `git` isn't installed, install it from https://git-scm.com/downloads.)

---

## Part C — Deploy on Render

1. Go to **https://render.com** and click **Get Started** → sign up **with GitHub** (free, no card).
2. Click **New +** (top right) → **Web Service**.
3. Find and select your `dekon` repository.
4. Fill in:
   - **Name:** `dekon-finance` (this becomes your URL `dekon-finance.onrender.com`)
   - **Region:** pick one near you
   - **Branch:** `main`
   - **Runtime / Language:** **Node**
   - **Build Command:** `npm install`
   - **Start Command:** `node server/index.js`
   - **Instance Type:** **Free**
5. Open the **Advanced** section and click **Add Environment Variable** for EACH of these:

   | Key | Value |
   |-----|-------|
   | `NODE_VERSION` | `24.19.0` |
   | `JWT_SECRET` | any long random text, e.g. `dekon-secret-9f8a7b6c5d4e3f2a1` |
   | `APP_URL` | `https://dekon-finance.onrender.com` (use YOUR actual Render URL) |
   | `TURSO_DATABASE_URL` | the libsql:// URL from Part A |
   | `TURSO_AUTH_TOKEN` | the eyJ... token from Part A |

   *(Optional — add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` later once you set up Google login.)*

6. Click **Create Web Service**.
7. Wait 2–4 minutes while it builds. When the status says **Live**, click the URL at the top (e.g. `https://dekon-finance.onrender.com`).

🎉 **DEKON is live on the internet.** Open it on your phone, create an account, and your data is saved to the cloud database.

> The free plan "sleeps" after 15 minutes without visitors. The first visit after sleeping takes ~30–60 seconds to wake up; after that it's fast. This is normal and free.

---

## Updating the app after code changes

Any time you change code, push it to GitHub and Render auto-deploys:

```bash
git add .
git commit -m "describe what changed"
git push
```

---

## Enable Google Sign-In on the live site

1. Google Cloud Console → your OAuth client.
2. Add this **Authorized redirect URI** (use your real Render URL):
   ```
   https://dekon-finance.onrender.com/api/auth/google/callback
   ```
3. In Render → your service → **Environment**, add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, then save (it auto-redeploys).

---

## Troubleshooting

- **"Site can't be reached" right after deploy** — wait a minute; Render is still building.
- **502 / app crashed** — open Render → **Logs** to see the error (usually a missing/typo'd environment variable).
- **Data not saving** — double-check `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in Render.
- **Login logs me out on refresh** — make sure `APP_URL` matches your real Render URL exactly (with `https://`).
