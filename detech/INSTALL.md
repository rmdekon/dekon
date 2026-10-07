# DETECH — Installation & Run Guide

A complete, copy-paste walkthrough. **Total time: about 3 minutes.**

---

## 0. What you need first

| Requirement | Minimum | Check it with | Where to get it |
|---|---|---|---|
| **Node.js** | 20.9 or newer (22 LTS recommended) | `node --version` | <https://nodejs.org> |
| **npm** | 10 or newer (ships with Node) | `npm --version` | — |
| **Git** | any recent version | `git --version` | <https://git-scm.com> |

> You do **not** need Docker, PostgreSQL, MySQL or Redis to run DETECH locally.
> The app ships with a zero-configuration SQLite database.

### Installing Node.js

**Windows** — download the LTS installer from [nodejs.org](https://nodejs.org) and click through it.
Then open **PowerShell** and verify:

```powershell
node --version
npm --version
```

**macOS**

```bash
brew install node@22
node --version
```

**Linux (Ubuntu / Debian)**

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
```

If `node --version` prints something lower than `v20.9`, upgrade before continuing —
the app will refuse to start on older versions.

---

## 1. Get the code

```bash
git clone https://github.com/rmdekon/dekon.git
cd dekon/detech
```

> Already have the repo? Just `cd` into the `detech` folder:
> ```bash
> cd path/to/dekon/detech
> ```

Confirm you are in the right place — you should see `package.json`:

```bash
ls
```

---

## 2. Install dependencies

```bash
npm install
```

This downloads about 140 packages (~1 minute on a normal connection).

<details>
<summary><strong>Troubleshooting:</strong> <code>npm install</code> fails</summary>

| Error | Fix |
|---|---|
| `EACCES: permission denied` | Don't use `sudo npm`. Fix npm's folder permissions, or reinstall Node via [nvm](https://github.com/nvm-sh/nvm). |
| `ETIMEDOUT` / `ECONNRESET` | You're behind a proxy or firewall. `npm config set registry https://registry.npmjs.org/` and retry. |
| `Unsupported engine` | Your Node is too old. Install Node 22 (see step 0). |

</details>

---

## 3. Create your environment file

```bash
cp .env.example .env
```

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

Now generate a real session secret and paste it into `.env` as `AUTH_SECRET`:

```bash
openssl rand -base64 48
```

No `openssl`? Use Node instead:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

Open `.env` in any editor and replace the placeholder:

```ini
DATABASE_URL="file:./dev.db"
AUTH_SECRET="<paste the long random string here>"
```

> For a quick local look-around you can skip the secret entirely — the app falls
> back to a development key and only *refuses* to start without one in production.

---

## 4. Create the database and load demo data

One command does everything — creates the 26 tables and fills them with a
complete demo school:

```bash
npm run setup
```

You should see:

```
✅  Seed complete

    Students      72
    Teachers      8
    Guardians     40
    Classes       6
    Subjects      8
    Attendance    2040 records
    Exam results  1088
    Books         12
    Assignments   18
```

<details>
<summary>What <code>npm run setup</code> actually runs</summary>

```bash
drizzle-kit push        # creates every table from src/db/schema.ts
tsx src/db/seed.ts --reset   # wipes + inserts the demo school
```

Run them separately if you prefer.
</details>

---

## 5. Start the development server

```bash
npm run dev
```

```
▲ Next.js 15.5.27
- Local:   http://localhost:3000
✓ Ready in 1.2s
```

**Open <http://localhost:3000> in your browser.**

Press `Ctrl + C` in the terminal to stop the server.

---

## 6. Sign in

Click **Try the live demo**, then pick any role button on the sign-in page to
auto-fill the form (or type the details manually):

| Role | Email | Password |
|---|---|---|
| **Administrator** | `admin@detech.school` | `Admin@123` |
| **Teacher** | `teacher@detech.school` | `Password@123` |
| **Student** | `student@detech.school` | `Password@123` |
| **Parent** | `parent@detech.school` | `Password@123` |
| **Accountant** | `accountant@detech.school` | `Password@123` |
| **Librarian** | `librarian@detech.school` | `Password@123` |

Each role sees a **different dashboard and a different sidebar** — that's the
RBAC system working. Try signing in as a Student and then visiting
`/dashboard/teachers`: you'll be redirected with an "access denied" banner.

---

## 7. Everyday commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload on port 3000 |
| `npm run build` | Create an optimised production build |
| `npm start` | Run the production build |
| `npm run typecheck` | Type-check the whole project (no emit) |
| `npm test` | Run the 27 unit tests |
| `npm run test:e2e` | Run the Playwright browser tests |
| `npm run db:studio` | Open Drizzle Studio — a visual database browser |
| `npm run db:seed` | Add demo data (skips if data already exists) |
| `npm run db:reset` | **Wipe** all data and reseed from scratch |
| `npm run db:push` | Apply schema changes to the database |
| `npm run db:generate` | Generate a versioned SQL migration file |

---

## 8. Common problems

<details>
<summary><strong>Port 3000 is already in use</strong></summary>

Run on a different port:

```bash
npx next dev -p 3001
```

Or free the port:

```bash
# macOS / Linux
lsof -ti:3000 | xargs kill -9

# Windows PowerShell
netstat -ano | findstr :3000
taskkill /PID <the-PID-shown> /F
```
</details>

<details>
<summary><strong>"no such table: users"</strong></summary>

The database was never created. Run:

```bash
npm run setup
```
</details>

<details>
<summary><strong>The dashboard is empty / all zeros</strong></summary>

The tables exist but have no data:

```bash
npm run db:reset
```
</details>

<details>
<summary><strong>"AUTH_SECRET is missing or too short"</strong></summary>

You're running in production mode without a secret. Put a long random value in
`.env` (step 3), then restart.
</details>

<details>
<summary><strong>I want to start completely fresh</strong></summary>

```bash
rm -f dev.db
rm -rf .next node_modules
npm install
npm run setup
npm run dev
```
</details>

---

## 9. Running with Docker (optional)

Only the app, using the bundled SQLite database:

```bash
docker build -t detech .
docker run -p 3000:3000 -e AUTH_SECRET="$(openssl rand -base64 48)" detech
```

The full stack — app + PostgreSQL + Redis + Nginx reverse proxy:

```bash
echo "AUTH_SECRET=$(openssl rand -base64 48)" > .env
docker compose up -d --build
```

Then open <http://localhost> (port 80, served through Nginx).

```bash
docker compose logs -f app    # follow the app logs
docker compose down           # stop everything
docker compose down -v        # stop and delete the data volumes
```

---

## 10. Switching to PostgreSQL

DETECH is written to be portable — all "enum" columns are plain `TEXT`, so no
schema rewrite is needed.

1. Install the Postgres driver:

   ```bash
   npm install pg
   npm install -D @types/pg
   ```

2. In **`src/db/schema.ts`**, change the import and the table builder:

   ```diff
   - import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";
   + import { pgTable, text, integer, doublePrecision, timestamp, boolean, index, uniqueIndex } from "drizzle-orm/pg-core";
   ```

   Replace `sqliteTable` → `pgTable`, `real(...)` → `doublePrecision(...)`,
   `integer(x, { mode: "timestamp" })` → `timestamp(x)`, and
   `integer(x, { mode: "boolean" })` → `boolean(x)`.

3. In **`src/db/index.ts`**:

   ```ts
   import { drizzle } from "drizzle-orm/node-postgres";
   import { Pool } from "pg";

   const pool = new Pool({ connectionString: process.env.DATABASE_URL });
   export const db = drizzle(pool, { schema });
   ```

4. In **`drizzle.config.ts`** set `dialect: "postgresql"`.

5. Point `DATABASE_URL` at your server and apply the schema:

   ```bash
   DATABASE_URL="postgresql://detech:detech@localhost:5432/detech" npm run db:push
   npm run db:seed
   ```

---

## 11. Deploying

**Vercel** (easiest)

```bash
npm i -g vercel
vercel
```

Set `DATABASE_URL` (a [Turso](https://turso.tech) libSQL URL works with no code
change) and `AUTH_SECRET` in the Vercel dashboard → Settings → Environment Variables.

**Any Node host** (Railway, Render, Fly.io, a VPS)

```bash
npm ci
npm run build
npm start          # serves on $PORT, defaults to 3000
```

Set `NODE_ENV=production`, `AUTH_SECRET` and `DATABASE_URL`, and always put
HTTPS in front — session cookies are marked `Secure` in production.
