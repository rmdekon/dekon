import { Search } from "lucide-react";

/**
 * Server-rendered filter bar. Submits as a plain GET form so filtering
 * works without any client-side JavaScript (progressive enhancement).
 */
export function FilterBar({
  action,
  q,
  placeholder = "Search…",
  children,
}: {
  action: string;
  q?: string;
  placeholder?: string;
  children?: React.ReactNode;
}) {
  return (
    <form
      action={action}
      method="get"
      className="mb-5 flex flex-wrap items-center gap-2.5 rounded-xl border border-ink-200 bg-white p-3"
    >
      <div className="relative min-w-[12rem] flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-9 w-full rounded-lg border border-ink-200 bg-ink-50 pl-9 text-sm placeholder:text-ink-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
        />
      </div>
      {children}
      <button
        type="submit"
        className="h-9 rounded-lg bg-brand-600 px-4 text-xs font-medium text-white transition-colors hover:bg-brand-700"
      >
        Apply
      </button>
    </form>
  );
}

export function FilterSelect({
  name,
  defaultValue,
  options,
  label,
}: {
  name: string;
  defaultValue?: string;
  label: string;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue ?? ""}
      aria-label={label}
      className="h-9 rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Simple prev/next pager driven by query string. */
export function Pager({
  basePath,
  page,
  totalPages,
  params = {},
}: {
  basePath: string;
  page: number;
  totalPages: number;
  params?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const link = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    sp.set("page", String(p));
    return `${basePath}?${sp.toString()}`;
  };

  return (
    <div className="flex items-center justify-between border-t border-ink-200 px-5 py-3">
      <p className="text-xs text-ink-500">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <a
          href={link(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={`rounded-lg border border-ink-300 px-3 py-1.5 text-xs font-medium ${
            page <= 1
              ? "pointer-events-none text-ink-300"
              : "text-ink-700 hover:bg-ink-50"
          }`}
        >
          Previous
        </a>
        <a
          href={link(Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          className={`rounded-lg border border-ink-300 px-3 py-1.5 text-xs font-medium ${
            page >= totalPages
              ? "pointer-events-none text-ink-300"
              : "text-ink-700 hover:bg-ink-50"
          }`}
        >
          Next
        </a>
      </div>
    </div>
  );
}
