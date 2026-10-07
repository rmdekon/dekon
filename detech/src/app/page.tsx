import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Bus,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  GraduationCap,
  Library,
  LockKeyhole,
  Megaphone,
  MessagesSquare,
  NotebookPen,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";

import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MODULES = [
  { icon: Users, title: "Student Management", text: "Admissions, profiles, guardians, enrolment history and status tracking." },
  { icon: GraduationCap, title: "Teacher Management", text: "Staff records, qualifications, subject allocation and workload." },
  { icon: ClipboardCheck, title: "Attendance System", text: "Daily registers with present / late / absent / excused states and trends." },
  { icon: CalendarDays, title: "Timetable Scheduling", text: "Per-class and per-teacher weekly timetables with clash-free periods." },
  { icon: NotebookPen, title: "Exams & Grading", text: "Exam cycles, score entry, automatic letter grades and report cards." },
  { icon: CreditCard, title: "Fee Management", text: "Invoices, part-payments, balances, overdue tracking and receipts." },
  { icon: Library, title: "Library Management", text: "Catalogue, issue and return loans, overdue fines and availability." },
  { icon: Bus, title: "Transport Management", text: "Vehicles, routes, stops, fares and per-student route assignment." },
  { icon: MessagesSquare, title: "Messaging & Parent Portal", text: "Direct messages between staff, students and guardians." },
  { icon: Megaphone, title: "Announcements", text: "Targeted notices by audience, with pinning and publication dates." },
  { icon: BarChart3, title: "Analytics & Reporting", text: "Academic, attendance and financial dashboards with live charts." },
  { icon: Bell, title: "Notifications", text: "In-app, email, SMS and push channels from a single notification model." },
];

const STACK = [
  { label: "Frontend", items: ["React 19", "Next.js 15 (App Router, SSR)", "TailwindCSS v4", "TypeScript"] },
  { label: "Backend", items: ["Node.js runtime", "Next.js Route Handlers", "REST API", "Server Actions"] },
  { label: "Database", items: ["SQLite (dev)", "PostgreSQL / MySQL ready", "Drizzle ORM", "Typed migrations"] },
  { label: "Security", items: ["JWT sessions (jose)", "bcrypt password hashing", "Role-Based Access Control", "httpOnly cookies"] },
];

export default async function HomePage() {
  const session = await getSession();

  return (
    <div className="bg-white">
      {/* ─────────────────────────── Nav ─────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-ink-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white shadow-md shadow-brand-600/25">
              DT
            </span>
            <span className="text-base font-semibold tracking-tight text-ink-950">
              DETECH
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-ink-600 md:flex">
            <a href="#modules" className="transition-colors hover:text-ink-950">Modules</a>
            <a href="#stack" className="transition-colors hover:text-ink-950">Tech stack</a>
            <a href="#security" className="transition-colors hover:text-ink-950">Security</a>
          </nav>

          <Link
            href={session ? "/dashboard" : "/login"}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            {session ? "Open dashboard" : "Sign in"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* ─────────────────────────── Hero ─────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute top-[-14rem] left-1/2 h-[34rem] w-[64rem] -translate-x-1/2 rounded-full bg-brand-100/70 blur-3xl"
        />
        <div className="relative mx-auto max-w-7xl px-5 pt-20 pb-16 text-center sm:px-8 sm:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-xs font-medium text-brand-700">
            <Zap className="h-3.5 w-3.5" />
            Complete school management, batteries included
          </span>

          <h1 className="mx-auto mt-7 max-w-4xl text-4xl leading-[1.1] font-semibold tracking-tight text-ink-950 sm:text-6xl">
            Run your entire school from{" "}
            <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
              one dashboard
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink-600 sm:text-lg">
            DETECH unifies admissions, attendance, timetables, grading, fees,
            library, transport and parent communication into a single secure
            platform — with role-aware dashboards for administrators, teachers,
            students and parents.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={session ? "/dashboard" : "/login"}
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand-600 px-7 text-sm font-medium text-white shadow-lg shadow-brand-600/25 transition-all hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-600/30"
            >
              {session ? "Go to dashboard" : "Try the live demo"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#modules"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-ink-300 bg-white px-7 text-sm font-medium text-ink-800 transition-colors hover:bg-ink-50"
            >
              Explore the modules
            </a>
          </div>

          <p className="mt-5 text-xs text-ink-400">
            Demo logins are listed on the sign-in page — no setup required.
          </p>

          {/* Stat strip */}
          <dl className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-ink-200 bg-ink-200 sm:grid-cols-4">
            {[
              ["12", "Core modules"],
              ["6", "User roles"],
              ["26", "Database tables"],
              ["100%", "TypeScript"],
            ].map(([value, label]) => (
              <div key={label} className="bg-white px-4 py-6">
                <dt className="text-2xl font-semibold tracking-tight text-ink-950">
                  {value}
                </dt>
                <dd className="mt-1 text-xs text-ink-500">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ───────────────────────── Modules ───────────────────────── */}
      <section id="modules" className="scroll-mt-20 border-t border-ink-200 bg-ink-50/60 py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-ink-950">
              Every module a school actually needs
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-600">
              Not a prototype — each module is backed by real tables, real
              queries and real role permissions.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="group rounded-xl border border-ink-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-600/5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-ink-900">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── Tech stack ───────────────────────── */}
      <section id="stack" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-ink-950">
              A modern, production-shaped stack
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-600">
              Server-rendered React with a typed data layer, portable from a
              single SQLite file on your laptop to PostgreSQL behind a load
              balancer.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STACK.map((group) => (
              <div key={group.label} className="rounded-xl border border-ink-200 bg-white p-6">
                <h3 className="text-xs font-semibold tracking-wider text-brand-600 uppercase">
                  {group.label}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-ink-600">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── Security ───────────────────────── */}
      <section id="security" className="scroll-mt-20 border-y border-ink-200 bg-ink-950 py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-brand-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              Security by default
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white">
              Student data deserves real protection
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-300">
              Authentication, authorisation and auditing are built into the
              foundation — not bolted on later.
            </p>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: LockKeyhole, title: "bcrypt hashing", text: "Passwords stored as salted bcrypt hashes at cost 12." },
              { icon: ShieldCheck, title: "JWT sessions", text: "Signed HS256 tokens in httpOnly, SameSite cookies." },
              { icon: Users, title: "RBAC matrix", text: "Per-module read/write rules enforced at the edge." },
              { icon: ClipboardCheck, title: "Audit trail", text: "Every sensitive mutation recorded with actor and time." },
            ].map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-xl border border-white/10 bg-white/5 p-5">
                <Icon className="h-5 w-5 text-brand-300" />
                <h3 className="mt-3 text-sm font-semibold text-white">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-400">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─────────────────────────── CTA ─────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
          <h2 className="text-3xl font-semibold tracking-tight text-ink-950">
            Ready to look around?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-ink-600">
            The demo database ships with 72 students, 8 teachers, 6 classes,
            2,000+ attendance records and a full term of results.
          </p>
          <Link
            href={session ? "/dashboard" : "/login"}
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-brand-600 px-7 text-sm font-medium text-white shadow-lg shadow-brand-600/25 transition-colors hover:bg-brand-700"
          >
            {session ? "Go to dashboard" : "Open the demo"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ─────────────────────────── Footer ─────────────────────────── */}
      <footer className="border-t border-ink-200 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-[10px] font-bold text-white">
              DT
            </span>
            <span className="text-sm font-medium text-ink-800">DETECH</span>
          </div>
          <p className="text-xs text-ink-500">
            School Management System · © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
