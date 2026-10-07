import { and, asc, eq } from "drizzle-orm";
import { ClipboardCheck } from "lucide-react";

import { BarChart, DonutChart } from "@/components/charts";
import { StatCard } from "@/components/stat-card";
import { Card, CardBody, CardHeader, EmptyState, PageHeader } from "@/components/ui";
import { db } from "@/db";
import { attendance, classrooms, students } from "@/db/schema";
import { getSession } from "@/lib/auth";
import {
  getAttendanceBreakdown,
  getAttendanceTrend,
  getTodayAttendance,
} from "@/lib/queries";
import { canWrite } from "@/lib/rbac";
import { formatDate, toDateKey } from "@/lib/utils";

import { AttendanceRegister } from "./register";

export const metadata = { title: "Attendance" };
export const dynamic = "force-dynamic";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ classroomId?: string; date?: string }>;
}) {
  const user = await getSession();
  const sp = await searchParams;
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : toDateKey();

  const classList = await db
    .select()
    .from(classrooms)
    .orderBy(asc(classrooms.level), asc(classrooms.section));

  const classroomId = sp.classroomId ?? classList[0]?.id;
  const mayMark = canWrite(user?.role, "attendance");

  const [rows, trend, breakdown, today] = await Promise.all([
    classroomId
      ? db
          .select({
            studentId: students.id,
            admissionNo: students.admissionNo,
            firstName: students.firstName,
            lastName: students.lastName,
            status: attendance.status,
          })
          .from(students)
          .leftJoin(
            attendance,
            and(eq(attendance.studentId, students.id), eq(attendance.date, date)),
          )
          .where(
            and(eq(students.classroomId, classroomId), eq(students.status, "ACTIVE")),
          )
          .orderBy(asc(students.lastName), asc(students.firstName))
      : Promise.resolve([]),
    getAttendanceTrend(14),
    getAttendanceBreakdown(30),
    getTodayAttendance(),
  ]);

  const selectedClass = classList.find((c) => c.id === classroomId);

  return (
    <>
      <PageHeader
        title="Attendance"
        description="Mark daily registers and review attendance trends across the school."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Today's rate"
          value={`${today.rate}%`}
          hint={`${today.present}/${today.total} marked present`}
          icon={ClipboardCheck}
          tone="emerald"
        />
        <StatCard
          label="Records today"
          value={today.total}
          hint={formatDate(today.date)}
          icon={ClipboardCheck}
          tone="brand"
        />
        <StatCard
          label="14-day average"
          value={`${
            trend.length
              ? Math.round(
                  (trend.reduce((s, d) => s + d.rate, 0) / trend.length) * 10,
                ) / 10
              : 0
          }%`}
          hint="rolling attendance rate"
          icon={ClipboardCheck}
          tone="violet"
        />
        <StatCard
          label="Absences (30d)"
          value={breakdown.find((b) => b.label === "Absent")?.value ?? 0}
          hint="unexcused absences"
          icon={ClipboardCheck}
          tone="rose"
        />
      </div>

      <div className="mb-6 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Attendance rate" description="Last 14 school days" />
          <CardBody>
            <BarChart
              data={trend.map((d) => ({
                label: formatDate(d.date, { day: "numeric", month: "short" }),
                value: d.rate,
              }))}
              suffix="%"
              tone="emerald"
              height={170}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Status mix" description="Last 30 days" />
          <CardBody>
            <DonutChart data={breakdown} centerLabel="records" />
          </CardBody>
        </Card>
      </div>

      {/* Register */}
      <Card className="mb-5">
        <CardBody>
          <form
            method="get"
            action="/dashboard/attendance"
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
            <div>
              <label
                htmlFor="date"
                className="mb-1.5 block text-xs font-medium text-ink-700"
              >
                Date
              </label>
              <input
                id="date"
                type="date"
                name="date"
                defaultValue={date}
                className="h-9.5 rounded-lg border border-ink-300 bg-white px-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="h-9.5 rounded-lg border border-ink-300 bg-white px-4 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50"
            >
              Load register
            </button>
          </form>
        </CardBody>
      </Card>

      {!classroomId || !rows.length ? (
        <Card>
          <EmptyState
            icon={<ClipboardCheck className="h-5 w-5" />}
            title="No active students in this class"
            description="Choose another class, or add students to it first."
          />
        </Card>
      ) : mayMark ? (
        <>
          <h2 className="mb-3 text-sm font-semibold text-ink-900">
            Register — {selectedClass?.name} {selectedClass?.section} ·{" "}
            {formatDate(date, { weekday: "long", day: "numeric", month: "long" })}
          </h2>
          <AttendanceRegister
            key={`${classroomId}:${date}`}
            classroomId={classroomId}
            date={date}
            rows={rows}
          />
        </>
      ) : (
        <Card className="overflow-hidden">
          <CardHeader
            title={`Register — ${selectedClass?.name} ${selectedClass?.section}`}
            description={formatDate(date, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          />
          <ul className="divide-y divide-ink-100">
            {rows.map((r) => (
              <li
                key={r.studentId}
                className="flex items-center justify-between px-5 py-2.5"
              >
                <span className="text-sm text-ink-800">
                  {r.firstName} {r.lastName}
                </span>
                <span className="text-xs text-ink-500">
                  {r.status ?? "not marked"}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
