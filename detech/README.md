<div align="center">

# 🎓 DETECH

**A complete School Management System**

Students · Teachers · Attendance · Timetables · Exams · Fees · Library · Transport · Parent Portal · Analytics

[![CI](https://github.com/rmdekon/dekon/actions/workflows/ci.yml/badge.svg)](https://github.com/rmdekon/dekon/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8)

</div>

---

## Quick start

```bash
cd detech
npm install
cp .env.example .env
npm run setup      # creates the database + loads a demo school
npm run dev
```

Open **<http://localhost:3000>**.

> 📖 New to this? **[INSTALL.md](./INSTALL.md)** is a full step-by-step guide,
> including installing Node.js, troubleshooting and Docker.

### Demo logins

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@detech.school` | `Admin@123` |
| Teacher | `teacher@detech.school` | `Password@123` |
| Student | `student@detech.school` | `Password@123` |
| Parent | `parent@detech.school` | `Password@123` |
| Accountant | `accountant@detech.school` | `Password@123` |
| Librarian | `librarian@detech.school` | `Password@123` |

Each role gets a **different dashboard and a different sidebar**.

---

## What's inside

### Core modules

| Module | Capability |
|---|---|
| 👩‍🎓 **Student Management** | Admissions, profiles, guardians, status tracking, per-student analytics |
| 👨‍🏫 **Teacher Management** | Staff records, qualifications, employment type, workload |
| 🏫 **Classes & Subjects** | Class groups, capacity/utilisation, curriculum, class–subject–teacher mapping |
| ✅ **Attendance** | Daily registers (present/late/absent/excused), quick-fill, 14-day trends |
| 📅 **Timetable** | Weekly grid per class, colour-coded, "today" highlighting |
| 📝 **Exams & Grading** | Exam cycles, automatic letter grades, subject averages, top-10 rankings |
| 💳 **Fee Management** | Invoices, part-payments, balances, overdue tracking, collection rate |
| 📚 **Library** | Catalogue, availability, circulation, overdue fines |
| 🚌 **Transport** | Fleet, routes, stops, fares, occupancy, rider assignments |
| 📒 **Assignments** | Homework with submission + grading rates per class |
| 📣 **Announcements** | Audience-targeted notices with pinning |
| 💬 **Messaging** | Direct messages between any members, with read receipts |
| 🔔 **Notifications** | In-app / email / SMS / push channels in one model |
| 📊 **Reports** | Academic, attendance and financial analytics + per-class scorecards |

### Security

- **bcrypt** password hashing (cost 12)
- **JWT** sessions (HS256 via `jose`) in `httpOnly`, `SameSite=Lax`, `Secure`-in-prod cookies
- **RBAC** — a single permission matrix (`src/lib/rbac.ts`) enforced at the **edge middleware**, in the **sidebar**, and in **every API route**
- **Zod** validation on every write endpoint
- **Audit log** table recording actor, action, entity and timestamp
- Security headers: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
- Nginx rate-limits `/api/auth/login` to blunt credential stuffing

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | SSR for SEO, Server Components, Route Handlers, Server Actions |
| **UI** | React 19 + TailwindCSS v4 | Server-first components; design tokens in `globals.css` |
| **Language** | TypeScript 5.9 (strict) | End-to-end type safety from schema to JSX |
| **ORM** | Drizzle | Fully typed SQL, no codegen binaries, portable across SQLite/Postgres/MySQL |
| **Database** | SQLite (dev) → PostgreSQL / Turso (prod) | Zero-setup locally, production-ready later |
| **Auth** | `jose` + `bcryptjs` | Edge-compatible JWT verification in middleware |
| **Charts** | Hand-written SVG | **Zero** chart dependency — server-rendered, no client JS |
| **Tests** | Vitest + Playwright | 27 unit tests, 9 E2E browser tests |
| **Ops** | Docker, Compose, Nginx, GitHub Actions | Multi-stage non-root image, full-stack compose, 3-job CI |

**Bundle:** ~106 kB first-load JS; most pages ship **under 200 B** of their own JavaScript
because the dashboards are server components and the charts are plain SVG.

---

## Project structure

```
detech/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Landing page (SSR + SEO metadata)
│   │   ├── login/                    # Sign-in (Server Action + useActionState)
│   │   ├── dashboard/
│   │   │   ├── layout.tsx            # Sidebar + topbar shell
│   │   │   ├── page.tsx              # Role-aware router → 4 dashboards
│   │   │   ├── students/[id]/        # List + full student profile
│   │   │   ├── attendance/           # Interactive register (Server Action)
│   │   │   ├── timetable/ exams/ fees/ library/ transport/
│   │   │   ├── assignments/ messages/ announcements/
│   │   │   └── reports/ notifications/ settings/
│   │   └── api/                      # REST API (18 route handlers)
│   ├── components/
│   │   ├── ui.tsx                    # Card, Badge, Button, Table, Progress…
│   │   ├── charts.tsx                # Bar / Line / Donut — pure SVG, no deps
│   │   ├── dashboards/               # admin · teacher · student · parent
│   │   ├── sidebar.tsx  topbar.tsx  stat-card.tsx  filter-bar.tsx
│   ├── db/
│   │   ├── schema.ts                 # 26 tables + relations + inferred types
│   │   ├── index.ts                  # Drizzle client
│   │   └── seed.ts                   # Demo school generator
│   ├── lib/
│   │   ├── auth.ts  jwt.ts  rbac.ts  # Authn / authz
│   │   ├── queries.ts                # Shared analytics queries
│   │   ├── validators.ts             # Zod schemas
│   │   ├── billing.ts  enums.ts  utils.ts
│   │   └── actions/                  # Server Actions
│   └── middleware.ts                 # Edge route guard
├── tests/{unit,e2e}/
├── drizzle/                          # Generated SQL migrations
├── Dockerfile  docker-compose.yml  nginx/
└── .github/workflows/ci.yml
```

---

## REST API

All routes return `{ ok: true, data }` or `{ ok: false, error }`.
Everything except `/api/health` requires the session cookie.

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| `GET` | `/api/health` | public | Liveness + DB probe |
| `POST` | `/api/auth/login` | public | Sign in, sets session cookie |
| `POST` | `/api/auth/logout` | any | Clear session |
| `GET` | `/api/auth/me` | any | Current user + permitted modules |
| `GET` | `/api/stats` | any | Every dashboard metric as JSON |
| `GET`/`POST` | `/api/students` | any / ADMIN | Search + paginate / create |
| `GET`/`PATCH`/`DELETE` | `/api/students/:id` | any / ADMIN | Profile with snapshot |
| `GET`/`POST` | `/api/teachers` | any / ADMIN | Staff directory |
| `GET`/`POST` | `/api/classes` | any / ADMIN | Classes with headcounts |
| `GET`/`POST` | `/api/subjects` | any / ADMIN | Curriculum |
| `GET`/`POST` | `/api/attendance` | any / ADMIN·TEACHER | Register read / bulk upsert |
| `GET`/`POST` | `/api/exams` | any / ADMIN·TEACHER | Cycles + grade analytics |
| `GET`/`POST` | `/api/fees/invoices` | any / ADMIN·ACCOUNTANT | Invoices + summary |
| `POST` | `/api/fees/payments` | ADMIN·ACCOUNTANT | Record payment, re-derive status |
| `GET`/`POST` | `/api/library/books` | any / ADMIN·LIBRARIAN | Catalogue |
| `GET`/`POST` | `/api/announcements` | any / ADMIN·TEACHER | Audience-filtered notices |
| `GET`/`PATCH` | `/api/notifications` | any | List / mark read |

**Example**

```bash
curl -c jar.txt -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@detech.school","password":"Admin@123"}'

curl -b jar.txt "http://localhost:3000/api/students?q=ama&page=1"
curl -b jar.txt http://localhost:3000/api/stats
```

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server, hot reload, port 3000 |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit suite |
| `npm run test:e2e` | Playwright browser suite |
| `npm run setup` | Create schema + seed demo data |
| `npm run db:reset` | Wipe and reseed |
| `npm run db:studio` | Visual database browser |
| `npm run db:generate` | Emit a versioned SQL migration |

---

## Roadmap

Shipped foundations with clear extension points:

- **Mobile** — React Native / Flutter clients can consume the existing REST API as-is
- **GraphQL** — add an Apollo/Yoga handler beside the REST routes
- **Microservices** — the `src/lib/*` data layer is transport-agnostic and extractable
- **MFA** — `users.mfaEnabled` / `mfaSecret` columns and the Settings UI are already in place
- **Payments** — Stripe / PayPal / Mobile Money keys are wired into `.env`; `payments.method` already models them
- **Observability** — `/api/health` is Prometheus-friendly; add Sentry via `SENTRY_DSN`
- **Scaling** — stateless app + Redis sessions + Postgres read replicas behind the bundled Nginx

---

## License

MIT
