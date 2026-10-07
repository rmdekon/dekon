import { asc, desc, eq, sql } from "drizzle-orm";
import { CheckCircle2, Clock, NotebookPen, Percent } from "lucide-react";

import { StatCard } from "@/components/stat-card";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  Progress,
} from "@/components/ui";
import { db } from "@/db";
import {
  assignments,
  classrooms,
  students,
  subjects,
  submissions,
  teachers,
} from "@/db/schema";
import { getSession } from "@/lib/auth";
import { getStudentForUser } from "@/lib/queries";
import { formatDate, percent } from "@/lib/utils";

export const metadata = { title: "Assignments" };
export const dynamic = "force-dynamic";

export default async function AssignmentsPage() {
  const user = await getSession();

  // Students only see work set for their own class.
  let classroomFilter: string | undefined;
  if (user?.role === "STUDENT") {
    const me = await getStudentForUser(user.id);
    classroomFilter = me?.classroomId ?? "none";
  }

  const rows = await db
    .select({
      id: assignments.id,
      title: assignments.title,
      description: assignments.description,
      dueDate: assignments.dueDate,
      maxScore: assignments.maxScore,
      createdAt: assignments.createdAt,
      className: classrooms.name,
      section: classrooms.section,
      classSize: sql<number>`(select count(*) from students s where s.classroom_id = ${classrooms.id})`,
      subject: subjects.name,
      teacherFirst: teachers.firstName,
      teacherLast: teachers.lastName,
      submitted: sql<number>`(select count(*) from submissions sub where sub.assignment_id = ${assignments.id})`,
      graded: sql<number>`(select count(*) from submissions sub where sub.assignment_id = ${assignments.id} and sub.graded_at is not null)`,
      avgScore: sql<number>`(select round(avg(sub.score), 1) from submissions sub where sub.assignment_id = ${assignments.id} and sub.score is not null)`,
    })
    .from(assignments)
    .innerJoin(classrooms, eq(classrooms.id, assignments.classroomId))
    .innerJoin(subjects, eq(subjects.id, assignments.subjectId))
    .leftJoin(teachers, eq(teachers.id, assignments.teacherId))
    .where(classroomFilter ? eq(assignments.classroomId, classroomFilter) : undefined)
    .orderBy(desc(assignments.dueDate));

  const now = Date.now();
  const open = rows.filter((r) => r.dueDate.getTime() >= now);
  const closed = rows.filter((r) => r.dueDate.getTime() < now);
  const totalSubmissions = rows.reduce((s, r) => s + Number(r.submitted), 0);
  const totalGraded = rows.reduce((s, r) => s + Number(r.graded), 0);

  return (
    <>
      <PageHeader
        title="Assignments"
        description="Homework and coursework set across the school, with submission tracking."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total assignments"
          value={rows.length}
          icon={NotebookPen}
          tone="brand"
        />
        <StatCard
          label="Still open"
          value={open.length}
          hint={`${closed.length} past due`}
          icon={Clock}
          tone="amber"
        />
        <StatCard
          label="Submissions"
          value={totalSubmissions}
          icon={CheckCircle2}
          tone="emerald"
        />
        <StatCard
          label="Graded"
          value={`${percent(totalGraded, totalSubmissions)}%`}
          hint={`${totalGraded} of ${totalSubmissions}`}
          icon={Percent}
          tone="violet"
        />
      </div>

      {rows.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {rows.map((a) => {
            const size = Number(a.classSize) || 1;
            const submitted = Number(a.submitted);
            const rate = percent(submitted, size);
            const overdue = a.dueDate.getTime() < now;
            return (
              <Card key={a.id}>
                <CardBody className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-ink-950">
                        {a.title}
                      </h3>
                      <p className="mt-0.5 text-[11px] text-ink-500">
                        {a.subject} · {a.className} {a.section} ·{" "}
                        {a.teacherFirst
                          ? `${a.teacherFirst} ${a.teacherLast}`
                          : "Unassigned"}
                      </p>
                    </div>
                    <Badge tone={overdue ? "neutral" : "warning"}>
                      {overdue ? "Closed" : "Open"}
                    </Badge>
                  </div>

                  <p className="line-clamp-2 text-xs leading-relaxed text-ink-600">
                    {a.description}
                  </p>

                  <div>
                    <div className="mb-1.5 flex justify-between text-[11px]">
                      <span className="text-ink-500">Submissions</span>
                      <span className="font-medium text-ink-800">
                        {submitted} / {size} ({rate}%)
                      </span>
                    </div>
                    <Progress
                      value={rate}
                      tone={rate > 75 ? "success" : rate > 40 ? "warning" : "danger"}
                    />
                  </div>

                  <dl className="grid grid-cols-3 gap-3 border-t border-ink-100 pt-3 text-[11px]">
                    <div>
                      <dt className="text-ink-500">Due</dt>
                      <dd
                        className={`mt-0.5 font-medium ${overdue ? "text-ink-500" : "text-ink-900"}`}
                      >
                        {formatDate(a.dueDate)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ink-500">Graded</dt>
                      <dd className="mt-0.5 font-medium text-ink-900">
                        {Number(a.graded)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ink-500">Average</dt>
                      <dd className="mt-0.5 font-medium text-ink-900">
                        {a.avgScore ?? "—"} / {a.maxScore}
                      </dd>
                    </div>
                  </dl>
                </CardBody>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={<NotebookPen className="h-5 w-5" />}
            title="No assignments yet"
            description="Teachers can post homework from their class pages."
          />
        </Card>
      )}
    </>
  );
}
