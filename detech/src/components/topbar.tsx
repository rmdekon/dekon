import Link from "next/link";
import { Bell, LogOut, Search } from "lucide-react";
import { and, eq, isNull } from "drizzle-orm";

import { Sidebar } from "@/components/sidebar";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { logoutAction } from "@/lib/actions/auth";
import type { SessionUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/enums";
import { colorFromString, initials } from "@/lib/utils";

export async function Topbar({ user }: { user: SessionUser }) {
  const unread = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(eq(notifications.userId, user.id), isNull(notifications.readAt)),
    );

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-ink-200 bg-white/85 px-4 backdrop-blur-md sm:px-6">
      <Sidebar role={user.role} />

      <form action="/dashboard/students" className="relative hidden max-w-xs flex-1 md:block">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          name="q"
          placeholder="Search students…"
          aria-label="Search students"
          className="h-9 w-full rounded-lg border border-ink-200 bg-ink-50 pl-9 text-sm placeholder:text-ink-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
        />
      </form>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
        <Link
          href="/dashboard/notifications"
          aria-label={`Notifications (${unread.length} unread)`}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-600 transition-colors hover:bg-ink-100"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unread.length > 0 ? (
            <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-semibold text-white">
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          ) : null}
        </Link>

        <div className="hidden h-6 w-px bg-ink-200 sm:block" />

        <Link
          href="/dashboard/settings"
          className="flex items-center gap-2.5 rounded-lg px-1.5 py-1 transition-colors hover:bg-ink-100"
        >
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ${colorFromString(user.name)}`}
          >
            {initials(user.name)}
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block max-w-[10rem] truncate text-xs font-semibold text-ink-900">
              {user.name}
            </span>
            <span className="block text-[10px] text-ink-500">
              {ROLE_LABELS[user.role]}
            </span>
          </span>
        </Link>

        <form action={logoutAction}>
          <button
            type="submit"
            aria-label="Sign out"
            title="Sign out"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </form>
      </div>
    </header>
  );
}
