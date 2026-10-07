import Link from "next/link";
import { and, asc, desc, eq, gte } from "drizzle-orm";
import {
  ArrowUpRight,
  Banknote,
  CalendarDays,
  ClipboardCheck,
  Megaphone,
  NotebookPen,
  Percent,
} from "lucide-react";

import { BarChart } from "@/components/charts";
import { StatCard } from "@/components/stat-card";
import { Badge, Card, CardBody, CardHeader, EmptyState, statusTone } from "@/components/ui";
import { db } from "@/db";
import {
  assignments,
  attendance,
  classrooms,
  examResults,
  exams,
  subjects,
  timetableSlots,
} from "@/db/schema";
import type { SessionUser } from "@/lib/auth";
import { getAnnouncementsFor, getStudentForUser, getStudentSnapshot } from "@/lib/queries";
import { formatDate, formatMoney, relativeTime } from "@/lib/utils";

export async function StudentDashboard({ user }: { user: SessionUser }) {
  const student = await getStudentForUser(user.id);

  if (!student) {
    return (
      <Card>
        <EmptyState
          title="No student record linked"
          description="Your login is not yet attached to a student profile. Please contact the school office."
        />
      </Card>
    );
  }

  const today = new Date().getDay() === 0 ? 7 : new Date().getDay();

  const [snapshot, classroom, slots, recentResults, dueWork, notices, recentAttendance] =
    await Promise.all([
      getStudentSnapshot(student.id),
      student.classroomId
        ? db.select().from(classrooms).where(eq(classrooms.id, student.classroomId)).limit(1)
        : Promise.resolve([]),
      student.classroomId
        ? db
            .select({
              id: timetableSlots.id,
              startTime: timetableSlots.startTime,
              endTime: timetableSlots.endTime,
              room: timetableSlots.room,
              subject: subjects.name,
            })
            .from(timetableSlots)
            .innerJoin(subjects, eq(subjects.id, timetableSlots.subjectId))
            .where(
              and(
                eq(timetableSlots.classroomId, student.classroomId),
                eq(timetableSlots.dayOfWeek, today),
              ),
            )
            .orderBy(asc(timetableSlots.startTime))
        : Promise.resolve([]),
      db
        .select({
          id: examResults.id,
          score: examResults.score,
          maxScore: examResults.maxScore,
          grade: examResults.grade,
          subject: subjects.name,
          exam: exams.name,
        })
        .from(examResults)
        .innerJoin(subjects, eq(subjects.id, examResults.subjectId))
        .innerJoin(exams, eq(exams.id, examResults.examId))
        .where(eq(examResults.studentId, student.id))
        .orderBy(desc(examResults.createdAt))
        .limit(8),
      student.classroomId
        ? db
            .select({
              id: assignments.id,
              title: assignments.title,
              dueDate: assignments.dueDate,
              subject: subjects.name,
            })
            .from(assignments)
            .innerJoin(subjects, eq(subjects.id, assignments.subjectId))
            .where(
              and(
                eq(assignments.classroomId, student.classroomId),
                gte(assignments.dueDate, new Date()),
              ),
            )
            .orderBy(asc(assignments.dueDate))
            .limit(5)
        : Promise.resolve([]),
      getAnnouncementsFor("STUDENT", 4),
      db
        .select({ date: attendance.date, status: attendance.status })
        .from(attendance)
        .where(eq(attendance.studentId, student.id))
        .orderBy(desc(attendance.date))
        .limit(10),
    ]);

  const cls = classroom[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink-950 sm:text-2xl">
          Hello, {student.firstName} 👋
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          {cls ? `${cls.name} ${cls.section}` : "Unassigned class"} ·
          Admission no. {student.admissionNo}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Attendance rate"
          value={`${snapshot.attendanceRate}%`}
          hint={`${snapshot.attendanceDays} days recorded`}
          icon={ClipboardCheck}
          tone="emerald"
        />
        <StatCard
          label="Average score"
          value={snapshot.averageScore || "—"}
          hint="across all published exams"
          icon={Percent}
          tone="brand"
        />
        <StatCard
          label="Fees outstanding"
          value={formatMoney(snapshot.feesOutstanding)}
          hint={`${formatMoney(snapshot.feesPaid)} paid of ${formatMoney(snapshot.feesBilled)}`}
          icon={Banknote}
          tone={snapshot.feesOutstanding > 0 ? "amber" : "emerald"}
        />
        <StatCard
          label="Assignments due"
          value={dueWork.length}
          hint="upcoming deadlines"
          icon={NotebookPen}
          tone="violet"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Recent results" description="Your latest published scores" />
          <CardBody>
            {recentResults.length ? (
              <BarChart
                data={recentResults.slice(0, 8).map((r) => ({
                  label: r.subject.split(" ")[0].slice(0, 6),
                  value: r.score,
                }))}
                height={180}
              />
            ) : (
              <EmptyState title="No results published yet" />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Today's timetable"
            description={
              new Date().toLocaleDateString("en-GB", { weekday: "long" })
            }
          />
          {slots.length ? (
            <ul className="divide-y divide-ink-100">
              {slots.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-12 shrink-0 text-[11px] font-medium text-brand-600 tabular-nums">
                    {s.startTime}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-ink-900">
                      {s.subject}
                    </p>
                    <p className="text-[11px] text-ink-400">
                      {s.startTime}–{s.endTime} · {s.room ?? "TBA"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<CalendarDays className="h-5 w-5" />}
              title="No lessons today"
              description="Enjoy the break."
            />
          )}
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader
            title="Upcoming assignments"
            action={
              <Link
                href="/dashboard/assignments"
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-600"
              >
                All <ArrowUpRight className="h-3 w-3" />
              </Link>
            }
          />
          {dueWork.length ? (
            <ul className="divide-y divide-ink-100">
              {dueWork.map((a) => (
                <li key={a.id} className="px-5 py-3">
                  <p className="truncate text-xs font-medium text-ink-900">{a.title}</p>
                  <p className="mt-0.5 text-[11px] text-ink-500">
                    {a.subject} · due {formatDate(a.dueDate)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nothing due" description="You're all caught up." />
          )}
        </Card>

        <Card>
          <CardHeader title="Recent attendance" />
          {recentAttendance.length ? (
            <ul className="divide-y divide-ink-100">
              {recentAttendance.slice(0, 6).map((a) => (
                <li
                  key={a.date}
                  className="flex items-center justify-between px-5 py-2.5"
                >
                  <span className="text-xs text-ink-600">{formatDate(a.date)}</span>
                  <Badge tone={statusTone(a.status)}>{a.status}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No attendance recorded" />
          )}
        </Card>

        <Card>
          <CardHeader title="Notices" />
          {notices.length ? (
            <ul className="divide-y divide-ink-100">
              {notices.map((n) => (
                <li key={n.id} className="flex gap-3 px-5 py-3">
                  <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-ink-900">
                      {n.title}
                    </p>
                    <p className="line-clamp-2 text-[11px] text-ink-500">{n.body}</p>
                    <p className="mt-1 text-[10px] text-ink-400">
                      {relativeTime(n.publishedAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No notices" />
          )}
        </Card>
      </div>
    </div>
  );
}
