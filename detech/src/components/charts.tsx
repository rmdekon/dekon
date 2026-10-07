/**
 * Dependency-free SVG charts.
 *
 * Rendered on the server (no "use client"), so they add **zero** JavaScript
 * to the client bundle — a deliberate performance choice for dashboards that
 * are read far more often than they are interacted with.
 */
import { cn } from "@/lib/utils";

export type Point = { label: string; value: number };

/* ───────────────────────────── Bar chart ───────────────────────────── */

export function BarChart({
  data,
  height = 180,
  suffix = "",
  tone = "brand",
  className,
}: {
  data: Point[];
  height?: number;
  suffix?: string;
  tone?: "brand" | "emerald" | "amber";
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const fills = {
    brand: "fill-brand-500",
    emerald: "fill-emerald-500",
    amber: "fill-amber-500",
  } as const;

  if (!data.length) {
    return <ChartEmpty height={height} />;
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        className="flex items-end justify-between gap-2"
        style={{ height }}
        role="img"
        aria-label={data.map((d) => `${d.label}: ${d.value}${suffix}`).join(", ")}
      >
        {data.map((d) => {
          const pct = (d.value / max) * 100;
          return (
            <div
              key={d.label}
              className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
            >
              <span className="text-[10px] font-medium text-ink-500 opacity-0 transition-opacity group-hover:opacity-100">
                {Math.round(d.value * 10) / 10}
                {suffix}
              </span>
              <svg
                className="w-full"
                style={{ height: `${Math.max(2, pct)}%` }}
                preserveAspectRatio="none"
                viewBox="0 0 10 100"
              >
                <rect
                  x="0.5"
                  y="0"
                  width="9"
                  height="100"
                  rx="1.4"
                  className={cn(fills[tone], "opacity-85 transition-opacity group-hover:opacity-100")}
                />
              </svg>
              <span className="w-full truncate text-center text-[10px] text-ink-400">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────────── Line chart ───────────────────────────── */

export function LineChart({
  data,
  height = 180,
  suffix = "",
  className,
}: {
  data: Point[];
  height?: number;
  suffix?: string;
  className?: string;
}) {
  if (data.length < 2) return <ChartEmpty height={height} />;

  const W = 600;
  const H = 200;
  const PAD = 8;
  const max = Math.max(...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const span = max - min || 1;

  const x = (i: number) => PAD + (i * (W - PAD * 2)) / (data.length - 1);
  const y = (v: number) => H - PAD - ((v - min) / span) * (H - PAD * 2);

  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d.value)}`).join(" ");
  const area = `${line} L${x(data.length - 1)},${H} L${x(0)},${H} Z`;

  return (
    <div className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
        role="img"
        aria-label={data.map((d) => `${d.label}: ${d.value}${suffix}`).join(", ")}
      >
        <defs>
          <linearGradient id="detech-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={0}
            x2={W}
            y1={H * f}
            y2={H * f}
            stroke="var(--color-ink-200)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        ))}
        <path d={area} fill="url(#detech-area)" />
        <path
          d={line}
          fill="none"
          stroke="var(--color-brand-600)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {data.map((d, i) => (
          <circle
            key={d.label}
            cx={x(i)}
            cy={y(d.value)}
            r={3}
            fill="white"
            stroke="var(--color-brand-600)"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-ink-400">
        {data.map((d, i) =>
          i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2) ? (
            <span key={d.label}>{d.label}</span>
          ) : (
            <span key={d.label} className="hidden sm:inline">
              {d.label}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────── Donut chart ───────────────────────────── */

const DONUT_COLORS = [
  "var(--color-brand-500)",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#8b5cf6",
  "#06b6d4",
];

export function DonutChart({
  data,
  size = 170,
  thickness = 22,
  centerLabel,
  centerValue,
}: {
  data: Point[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;

  let offset = 0;

  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-ink-100)"
            strokeWidth={thickness}
          />
          {total > 0 &&
            data.map((d, i) => {
              const frac = d.value / total;
              const dash = frac * c;
              const el = (
                <circle
                  key={d.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
                  strokeWidth={thickness}
                  strokeDasharray={`${dash} ${c - dash}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              );
              offset += dash;
              return el;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold text-ink-900">
            {centerValue ?? total}
          </span>
          {centerLabel ? (
            <span className="text-[10px] tracking-wide text-ink-400 uppercase">
              {centerLabel}
            </span>
          ) : null}
        </div>
      </div>

      <ul className="min-w-[8rem] space-y-2">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
            />
            <span className="flex-1 text-ink-600">{d.label}</span>
            <span className="font-semibold text-ink-900 tabular-nums">
              {d.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChartEmpty({ height }: { height: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg bg-ink-50 text-xs text-ink-400"
      style={{ height }}
    >
      Not enough data yet
    </div>
  );
}
