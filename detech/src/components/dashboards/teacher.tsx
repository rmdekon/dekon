import Link from "next/link";
import { and, asc, eq, gte, sql } from "drizzle-orm";
import {
  ArrowUpRight,
  BookOpenCheck,
  CalendarDays,
  ClipboardCheck,
  Megaphone,
  School,
  Users,
} from "lucide-react";

import { BarChart } from "@/components/charts";
import { StatCard } from "@/components/stat-card";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui";
import { db } from "@/db";
import {
  assignments,
  classSubjects,
  classrooms,
  students,
  subjects,
  timetableSlots,
} from "@/db/schema";
import type { SessionUser } from "@/lib/auth";
import { getAnnouncementsFor, getSubjectAverages, getTeacherForUser } from "@/lib/queries";
import { formatDate, relativeTime } from "@/lib/utils";

export async function TeacherDashboard({ user }: { user: SessionUser }) {
  const teacher = await getTeacherForUser(user.id);

  if (!teacher) {
    return (
      <Card>
        <EmptyState
          title="No teacher record linked"
          description="Your login is not yet attached to a staff profile. Please contact the administrator."
        />
      </Card>
    );
  }

  const today = new Date().getDay() === 0 ? 7 : new Date().getDay();

  const [myClasses, todaySlots, mySubjects, dueWork, notices, averages] =
    await Promise.all([
      db
        .select({
          id: classrooms.id,
          name: classrooms.name,
          section: classrooms.section,
          room: classrooms.room,
          headcount: sql<number>`count(${students.id})`,
        })
        .from(classrooms)
        .leftJoin(students, eq(students.classroomId, classrooms.id))
        .where(eq(classrooms.classTeacherId, teacher.id))
        .groupBy(classrooms.id),
      db
        .select({
          id: timetableSlots.id,
          startTime: timetableSlots.startTime,
          endTime: timetableSlots.endTime,
          room: timetableSlots.room,
          subject: subjects.name,
          className: classrooms.name,
          section: classrooms.section,
        })
        .from(timetableSlots)
        .innerJoin(subjects, eq(subjects.id, timetableSlots.subjectId))
        .innerJoin(classrooms, eq(classrooms.id, timetableSlots.classroomId))
        .where(
          and(
            eq(timetableSlots.teacherId, teacher.id),
            eq(timetableSlots.dayOfWeek, today),
          ),
        )
        .orderBy(asc(timetableSlots.startTime)),
      db
        .select({
          id: classSubjects.id,
          subject: subjects.name,
          className: classrooms.name,
          section: classrooms.section,
        })
        .from(classSubjects)
        .innerJoin(subjects, eq(subjects.id, classSubjects.subjectId))
        .innerJoin(classrooms, eq(classrooms.id, classSubjects.classroomId))
        .where(eq(classSubjects.teacherId, teacher.id)),
      db
        .select({
          id: assignments.id,
          title: assignments.title,
          dueDate: assignments.dueDate,
          className: classrooms.name,
          section: classrooms.section,
        })
        .from(assignments)
        .innerJoin(classrooms, eq(classrooms.id, assignments.classroomId))
        .where(
          and(eq(assignments.teacherId, teacher.id), gte(assignments.dueDate, new Date())),
        )
        .orderBy(asc(assignments.dueDate))
        .limit(5),
      getAnnouncementsFor("TEACHER", 4),
      getSubjectAverages(),
    ]);

  const totalStudents = myClasses.reduce((s, c) => s + Number(c.headcount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink-950 sm:text-2xl">
          Good day, {teacher.firstName}
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          {teacher.specialization ?? "Teaching staff"} · Staff no. {teacher.staffNo}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Classes led"
          value={myClasses.length}
          hint={`${totalStudents} students in total`}
          icon={School}
          tone="brand"
        />
        <StatCard
          label="Lessons today"
          value={todaySlots.length}
          hint={new Date().toLocaleDateString("en-GB", { weekday: "long" })}
          icon={CalendarDays}
          tone="violet"
        />
        <StatCard
          label="Subject allocations"
          value={mySubjects.length}
          hint="class–subject pairings"
          icon={BookOpenCheck}
          tone="emerald"
        />
        <StatCard
          label="Assignments open"
          value={dueWork.length}
          hint="awaiting their due date"
          icon={ClipboardCheck}
          tone="amber"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Today's lessons"
            description={new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
            action={
              <Link
                href="/dashboard/timetable"
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-600"
              >
                Full timetable <ArrowUpRight className="h-3 w-3" />
              </Link>
            }
          />
          {todaySlots.length ? (
            <ul className="divide-y divide-ink-100">
              {todaySlots.map((s) => (
                <li key={s.id} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="w-20 shrink-0 text-xs font-medium text-brand-600 tabular-nums">
                    {s.startTime}–{s.endTime}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900">
                      {s.subject}
                    </p>
                    <p className="text-[11px] text-ink-500">
                      {s.className} {s.section} · {s.room ?? "TBA"}
                    </p>
                  </div>
                  <Link
                    href="/dashboard/attendance"
                    className="shrink-0 rounded-lg border border-ink-300 px-2.5 py-1 text-[11px] font-medium text-ink-700 hover:bg-ink-50"
                  >
                    Mark register
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<CalendarDays className="h-5 w-5" />}
              title="No lessons scheduled today"
            />
          )}
        </Card>

        <Card>
          <CardHeader title="My classes" />
          {myClasses.length ? (
            <ul className="divide-y divide-ink-100">
              {myClasses.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-semibold text-brand-700">
                    {c.name.replace("Grade ", "G")}
                    {c.section}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-ink-900">
                      {c.name} {c.section}
                    </p>
                    <p className="text-[11px] text-ink-500">
                      {Number(c.headcount)} students · {c.room ?? "no room"}
                    </p>
                  </div>
                  <Users className="h-4 w-4 text-ink-300" />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Not a class teacher" description="You are not assigned as a class teacher." />
          )}
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Average score by subject" description="School-wide, out of 100" />
          <CardBody>
            <BarChart data={averages} tone="emerald" height={170} />
          </CardBody>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Assignments due" />
            {dueWork.length ? (
              <ul className="divide-y divide-ink-100">
                {dueWork.map((a) => (
                  <li key={a.id} className="px-5 py-3">
                    <p className="truncate text-xs font-medium text-ink-900">{a.title}</p>
                    <p className="mt-0.5 text-[11px] text-ink-500">
                      {a.className} {a.section} · due {formatDate(a.dueDate)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No open assignments" />
            )}
          </Card>

          <Card>
            <CardHeader title="Staff notices" />
            {notices.length ? (
              <ul className="divide-y divide-ink-100">
                {notices.map((n) => (
                  <li key={n.id} className="flex gap-3 px-5 py-3">
                    <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-ink-900">
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-[10px] text-ink-400">
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
    </div>
  );
}
