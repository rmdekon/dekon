import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  CreditCard,
  ShieldCheck,
  Users,
} from "lucide-react";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to the DETECH school management system.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink-950 p-12 lg:flex">
        <div
          aria-hidden
          className="absolute -top-40 -right-32 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl"
        />

        <Link href="/" className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 font-bold text-white shadow-lg shadow-brand-600/40">
            DT
          </span>
          <span className="text-lg font-semibold tracking-tight text-white">
            DETECH
          </span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-3xl leading-tight font-semibold tracking-tight text-white">
            Everything your school runs on, in one place.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-ink-300">
            Admissions, attendance, timetables, grading, fees, library,
            transport and parent communication — unified behind one secure,
            role-aware dashboard.
          </p>

          <ul className="mt-8 space-y-3.5">
            {[
              { icon: Users, text: "Student, teacher & parent records" },
              { icon: CalendarDays, text: "Attendance & timetable scheduling" },
              { icon: CreditCard, text: "Fee invoicing and payment tracking" },
              { icon: BarChart3, text: "Live academic & financial analytics" },
              { icon: ShieldCheck, text: "JWT sessions with role-based access" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-ink-200">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-brand-200">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-ink-500">
          © {new Date().getFullYear()} DETECH. Academic year 2025/2026.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 flex items-center gap-2.5 lg:hidden"
            aria-label="DETECH home"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              DT
            </span>
            <span className="font-semibold tracking-tight text-ink-900">
              DETECH
            </span>
          </Link>

          <h1 className="text-2xl font-semibold tracking-tight text-ink-950">
            Welcome back
          </h1>
          <p className="mt-1.5 mb-8 text-sm text-ink-500">
            Sign in to your DETECH account to continue.
          </p>

          <LoginForm next={next ?? "/dashboard"} />
        </div>
      </div>
    </div>
  );
}
