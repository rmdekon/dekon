"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

import { NAV_GROUP_ORDER, NAV_ITEMS } from "@/components/nav-config";
import type { Role } from "@/lib/enums";
import { canAccess } from "@/lib/rbac";
import { cn } from "@/lib/utils";

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the drawer whenever the route changes (mobile).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const visible = NAV_ITEMS.filter((item) => canAccess(role, item.key));

  const nav = (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4 scrollbar-none">
      {NAV_GROUP_ORDER.map((group) => {
        const items = visible.filter((i) => i.group === group);
        if (!items.length) return null;
        return (
          <div key={group}>
            <p className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-ink-500 uppercase">
              {group}
            </p>
            <ul className="space-y-0.5">
              {items.map((item) => {
                const active =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-brand-600 font-medium text-white shadow-sm"
                          : "text-ink-300 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          active ? "text-white" : "text-ink-400 group-hover:text-white",
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  const brand = (
    <Link href="/dashboard" className="flex items-center gap-2.5 px-5 py-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white shadow-lg shadow-brand-600/30">
        DT
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold tracking-tight text-white">
          DETECH
        </span>
        <span className="block text-[10px] tracking-wide text-ink-400 uppercase">
          School Manager
        </span>
      </span>
    </Link>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-ink-950 lg:flex">
        {brand}
        {nav}
        <SidebarFooter />
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
          />
          <aside className="animate-rise absolute inset-y-0 left-0 flex w-72 flex-col bg-ink-950 shadow-2xl">
            <div className="flex items-center justify-between pr-3">
              {brand}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="rounded-lg p-2 text-ink-400 hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
            <SidebarFooter />
          </aside>
        </div>
      ) : null}
    </>
  );
}

function SidebarFooter() {
  return (
    <div className="border-t border-white/10 px-5 py-4">
      <p className="text-[10px] leading-relaxed text-ink-500">
        DETECH v1.0 · {new Date().getFullYear()}
        <br />
        Academic year 2025/2026
      </p>
    </div>
  );
}
