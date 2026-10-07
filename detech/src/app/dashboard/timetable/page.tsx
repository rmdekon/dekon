import { asc, eq } from "drizzle-orm";
import { CalendarDays } from "lucide-react";

import { Card, CardBody, EmptyState, PageHeader } from "@/components/ui";
import { db } from "@/db";
import { classrooms, subjects, teachers, timetableSlots } from "@/db/schema";
import { DAYS } from "@/lib/enums";

export const metadata = { title: "Timetable" };
export const dynamic = "force-dynamic";

const SUBJECT_COLORS = [
  "bg-brand-50 text-brand-800 border-brand-200",
  "bg-emerald-50 text-emerald-800 border-emerald-200",
  "bg-amber-50 text-amber-800 border-amber-200",
  "bg-rose-50 text-rose-800 border-rose-200",
  "bg-violet-50 text-violet-800 border-violet-200",
  "bg-sky-50 text-sky-800 border-sky-200",
  "bg-teal-50 text-teal-800 border-teal-200",
  "bg-orange-50 text-orange-800 border-orange-200",
];

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return SUBJECT_COLORS[hash % SUBJECT_COLORS.length];
}

export default async function TimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ classroomId?: string }>;
}) {
  const sp = await searchParams;

  const classList = await db
    .select()
    .from(classrooms)
    .orderBy(asc(classrooms.level), asc(classrooms.section));

  const classroomId = sp.classroomId ?? classList[0]?.id;

  const slots = classroomId
    ? await db
        .select({
          id: timetableSlots.id,
          dayOfWeek: timetableSlots.dayOfWeek,
          startTime: timetableSlots.startTime,
          endTime: timetableSlots.endTime,
          room: timetableSlots.room,
          subject: subjects.name,
          teacherFirst: teachers.firstName,
          teacherLast: teachers.lastName,
        })
        .from(timetableSlots)
        .innerJoin(subjects, eq(subjects.id, timetableSlots.subjectId))
        .leftJoin(teachers, eq(teachers.id, timetableSlots.teacherId))
        .where(eq(timetableSlots.classroomId, classroomId))
        .orderBy(asc(timetableSlots.dayOfWeek), asc(timetableSlots.startTime))
    : [];

  // Unique period rows, sorted by start time.
  const periods = [...new Set(slots.map((s) => `${s.startTime}-${s.endTime}`))].sort();
  const selected = classList.find((c) => c.id === classroomId);
  const todayDow = new Date().getDay() === 0 ? 7 : new Date().getDay();

  return (
    <>
      <PageHeader
        title="Timetable"
        description="Weekly lesson schedule per class, Monday to Friday."
      />

      <Card className="mb-5">
        <CardBody>
          <form
            method="get"
            action="/dashboard/timetable"
            className="flex flex-wrap items-end gap-3"
          >
            <div>
              <label
                htmlFor="classroomId"
                className="mb-1.5 block text-xs font-medium text-ink-700"
              >
                Class
              </label>
              <select
                id="classroomId"
                name="classroomId"
                defaultValue={classroomId}
                className="h-9.5 rounded-lg border border-ink-300 bg-white px-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
              >
                {classList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.section}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="h-9.5 rounded-lg border border-ink-300 bg-white px-4 text-sm font-medium text-ink-700 hover:bg-ink-50"
            >
              Show timetable
            </button>
          </form>
        </CardBody>
      </Card>

      {periods.length ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] border-collapse">
              <thead>
                <tr>
                  <th className="w-28 border-b border-ink-200 bg-ink-50/60 px-4 py-3 text-left text-[11px] font-semibold tracking-wide text-ink-500 uppercase">
                    Period
                  </th>
                  {DAYS.slice(0, 5).map((day, i) => (
                    <th
                      key={day}
                      className={`border-b border-l border-ink-200 px-4 py-3 text-left text-[11px] font-semibold tracking-wide uppercase ${
                        i + 1 === todayDow
                          ? "bg-brand-50 text-brand-700"
                          : "bg-ink-50/60 text-ink-500"
                      }`}
                    >
                      {day}
                      {i + 1 === todayDow ? (
                        <span className="ml-1.5 text-[9px] normal-case">(today)</span>
                      ) : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periods.map((period) => {
                  const [start, end] = period.split("-");
                  return (
                    <tr key={period}>
                      <td className="border-b border-ink-100 px-4 py-3 align-top">
                        <p className="text-xs font-semibold text-ink-900 tabular-nums">
                          {start}
                        </p>
                        <p className="text-[10px] text-ink-400 tabular-nums">{end}</p>
                      </td>
                      {[1, 2, 3, 4, 5].map((day) => {
                        const slot = slots.find(
                          (s) =>
                            s.dayOfWeek === day &&
                            `${s.startTime}-${s.endTime}` === period,
                        );
                        return (
                          <td
                            key={day}
                            className={`border-b border-l border-ink-100 p-2 align-top ${
                              day === todayDow ? "bg-brand-50/30" : ""
                            }`}
                          >
                            {slot ? (
                              <div
                                className={`rounded-lg border px-2.5 py-2 ${colorFor(slot.subject)}`}
                              >
                                <p className="text-[11px] font-semibold">
                                  {slot.subject}
                                </p>
                                <p className="mt-0.5 text-[10px] opacity-75">
                                  {slot.teacherFirst
                                    ? `${slot.teacherFirst} ${slot.teacherLast}`
                                    : "Unassigned"}
                                </p>
                                <p className="text-[10px] opacity-60">
                                  {slot.room ?? "TBA"}
                                </p>
                              </div>
                            ) : (
                              <div className="flex h-12 items-center justify-center text-[10px] text-ink-300">
                                —
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-ink-200 bg-ink-50/60 px-5 py-3 text-xs text-ink-500">
            {selected ? `${selected.name} ${selected.section}` : ""} ·{" "}
            {slots.length} scheduled periods per week
          </div>
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={<CalendarDays className="h-5 w-5" />}
            title="No timetable for this class"
            description="Lesson slots have not been scheduled yet."
          />
        </Card>
      )}
    </>
  );
}
