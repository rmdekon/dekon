# 🚀 Deploy DEKON online for FREE with Vercel (no credit card)

Vercel gives you a real `https://your-app.vercel.app` address, generous free
usage, and no sleep/spin-down like other free hosts. We'll pair it with a free
**Turso** cloud database so all accounts and transactions are saved permanently.

> Both services are free and **no credit card is required**.

---

## Part A — Create your free Turso database

1. Go to **https://turso.tech** → **Start free** → sign up with GitHub or Google.
2. Click **Create Database**. Name it `dekon`, pick any region, and create it.
3. Copy the **Database URL** (looks like `libsql://dekon-xxxx.turso.io`).
4. Click **Create Token** (Full Access, no expiry) and copy the token (starts with `eyJ...`).
   Keep both values — you'll paste them into Vercel in Part C.

---

## Part B — Push your code to GitHub

1. Create a free account at https://github.com/signup if needed.
2. Create a new repo at https://github.com/new:
   - Name: `dekon`
   - **Public**
   - Leave all checkboxes (README, .gitignore, license) **unchecked**
3. In a terminal **inside your `dekon` folder**, run:
   ```bash
   git init
   git add .
   git commit -m "DEKON full stack app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/dekon.git
   git push -u origin main
   ```
   If Git asks for your name/email first, run:
   ```bash
   git config user.name "Your Name"
   git config user.email "you@example.com"
   ```

---

## Part C — Deploy on Vercel

1. Go to **https://vercel.com** → **Sign Up** → choose **Continue with GitHub**
   (free, no card). Authorize Vercel when GitHub asks.
2. In the Vercel dashboard click **Add New…** → **Project**.
3. Find your **`dekon`** repository and click **Import**.
   (If it's not listed, click **Adjust GitHub App Permissions** and grant access.)
4. On the configure page, **expand "Environment Variables"** and add these one by one:

   | Key | Value |
   |-----|-------|
   | `JWT_SECRET` | any long random text, e.g. `dekon-vercel-secret-9f8a7b6c5d` |
   | `TURSO_DATABASE_URL` | your `libsql://...` URL from Part A |
   | `TURSO_AUTH_TOKEN` | your `eyJ...` token from Part A |

   Leave the Build/Output settings at their defaults — the included `vercel.json`
   configures everything automatically.

5. Click **Deploy**. Wait ~1–2 minutes. When you see the celebration screen,
   click the picture/URL to open your live site, e.g.
   `https://dekon-xxxx.vercel.app`.

🎉 Create an account on the live site — your data now saves to the cloud.

---

## Part D — Set APP_URL and enable Google Sign-In (optional but recommended)

For cookies/login to work reliably after deploy, tell the app its own URL:

1. In Vercel → your project → **Settings** → **Environment Variables**.
2. Add:
   - **Key:** `APP_URL`
   - **Value:** your full Vercel URL, e.g. `https://dekon-xxxx.vercel.app`
3. Go to the **Deployments** tab → open the latest deployment's menu (⋯) →
   **Redeploy** (so the new variable takes effect).

For "Sign in with Google":
1. Google Cloud Console → your OAuth client.
2. Add this **Authorized redirect URI** (use your real Vercel URL):
   ```
   https://dekon-xxxx.vercel.app/api/auth/google/callback
   ```
3. In Vercel environment variables add `GOOGLE_CLIENT_ID` and
   `GOOGLE_CLIENT_SECRET`, then redeploy.

---

## Updating the app after changes

```bash
git add .
git commit -m "describe your change"
git push
```
Vercel automatically rebuilds and deploys in ~1 minute.

---

## Troubleshooting

- **Login doesn't "stick" / logged out on refresh** → `APP_URL` is missing or
  wrong. Add it as shown in Part D and redeploy.
- **"Internal server error" on sign up** → check Vercel → **Logs**, and verify
  `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are correct with no extra spaces.
- **Function timeout on first visit** — rare on the free plan; just refresh.
- **Local development still works** — `npm start` uses your local database file
  unless you create a `.env` with the Turso values.
