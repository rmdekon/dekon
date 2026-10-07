import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";

const TONES = {
  brand: "bg-brand-50 text-brand-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  violet: "bg-violet-50 text-violet-600",
  sky: "bg-sky-50 text-sky-600",
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
  trend,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: keyof typeof TONES;
  trend?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-ink-200 bg-white p-5 transition-shadow hover:shadow-md hover:shadow-ink-950/5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-ink-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-ink-950 tabular-nums">
            {value}
          </p>
        </div>
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            TONES[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>

      {hint || trend !== undefined ? (
        <div className="mt-3 flex items-center gap-2">
          {trend !== undefined ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium",
                trend >= 0
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700",
              )}
            >
              {trend >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(trend)}%
            </span>
          ) : null}
          {hint ? <span className="truncate text-[11px] text-ink-400">{hint}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
