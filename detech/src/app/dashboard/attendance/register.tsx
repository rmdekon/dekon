"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";

import { markAttendanceAction, type MarkState } from "@/lib/actions/attendance";
import { ATTENDANCE_STATUSES, type AttendanceStatus } from "@/lib/enums";
import { cn, colorFromString, initials } from "@/lib/utils";

export type RegisterRow = {
  studentId: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  status: string | null;
};

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  PRESENT: "peer-checked:bg-emerald-600 peer-checked:text-white peer-checked:border-emerald-600",
  LATE: "peer-checked:bg-amber-500 peer-checked:text-white peer-checked:border-amber-500",
  ABSENT: "peer-checked:bg-rose-600 peer-checked:text-white peer-checked:border-rose-600",
  EXCUSED: "peer-checked:bg-sky-600 peer-checked:text-white peer-checked:border-sky-600",
};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9.5 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:bg-brand-400"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Saving…
        </>
      ) : (
        <>
          <Save className="h-4 w-4" /> Save register
        </>
      )}
    </button>
  );
}

export function AttendanceRegister({
  classroomId,
  date,
  rows,
}: {
  classroomId: string;
  date: string;
  rows: RegisterRow[];
}) {
  const [state, formAction] = useActionState<MarkState, FormData>(
    markAttendanceAction,
    {},
  );

  // Local mirror so "mark all present" can update every radio at once.
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>(
    () =>
      Object.fromEntries(
        rows.map((r) => [
          r.studentId,
          (r.status as AttendanceStatus) ?? "PRESENT",
        ]),
      ),
  );

  const setAll = (status: AttendanceStatus) =>
    setStatuses(Object.fromEntries(rows.map((r) => [r.studentId, status])));

  const counts = ATTENDANCE_STATUSES.map((s) => ({
    status: s,
    n: Object.values(statuses).filter((v) => v === s).length,
  }));

  return (
    <form action={formAction}>
      <input type="hidden" name="classroomId" value={classroomId} />
      <input type="hidden" name="date" value={date} />

      {state.error ? (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </div>
      ) : null}
      {state.ok ? (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {state.message}
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-ink-500">Quick fill:</span>
          {ATTENDANCE_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setAll(s)}
              className="rounded-lg border border-ink-300 bg-white px-2.5 py-1 text-[11px] font-medium text-ink-700 transition-colors hover:bg-ink-50"
            >
              All {s.toLowerCase()}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 text-[11px] text-ink-500">
          {counts.map((c) => (
            <span key={c.status}>
              {c.status.toLowerCase()}:{" "}
              <strong className="text-ink-900">{c.n}</strong>
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
        <ul className="divide-y divide-ink-100">
          {rows.map((r) => (
            <li
              key={r.studentId}
              className="flex flex-wrap items-center gap-3 px-4 py-2.5 transition-colors hover:bg-ink-50/60"
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${colorFromString(r.firstName + r.lastName)}`}
              >
                {initials(`${r.firstName} ${r.lastName}`)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-900">
                  {r.firstName} {r.lastName}
                </p>
                <p className="font-mono text-[11px] text-ink-400">
                  {r.admissionNo}
                </p>
              </div>

              <div className="flex gap-1.5">
                {ATTENDANCE_STATUSES.map((s) => (
                  <label key={s} className="cursor-pointer">
                    <input
                      type="radio"
                      name={`status:${r.studentId}`}
                      value={s}
                      checked={statuses[r.studentId] === s}
                      onChange={() =>
                        setStatuses((prev) => ({ ...prev, [r.studentId]: s }))
                      }
                      className="peer sr-only"
                    />
                    <span
                      className={cn(
                        "inline-flex h-7 items-center rounded-lg border border-ink-300 bg-white px-2.5 text-[11px] font-medium text-ink-600 transition-colors hover:bg-ink-100",
                        STATUS_STYLES[s],
                      )}
                    >
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </span>
                  </label>
                ))}
              </div>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between gap-3 border-t border-ink-200 bg-ink-50/60 px-4 py-3">
          <p className="text-xs text-ink-500">
            {rows.length} students · {date}
          </p>
          <SaveButton />
        </div>
      </div>
    </form>
  );
}
