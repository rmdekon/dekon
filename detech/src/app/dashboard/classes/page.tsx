import Link from "next/link";
import { asc, eq, sql } from "drizzle-orm";
import { School, Users } from "lucide-react";

import { BarChart } from "@/components/charts";
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
import { classrooms, students, subjects, classSubjects, teachers } from "@/db/schema";
import { getEnrollmentByClass } from "@/lib/queries";
import { percent } from "@/lib/utils";

export const metadata = { title: "Classes" };
export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const [rows, enrollment] = await Promise.all([
    db
      .select({
        id: classrooms.id,
        name: classrooms.name,
        section: classrooms.section,
        level: classrooms.level,
        capacity: classrooms.capacity,
        room: classrooms.room,
        academicYear: classrooms.academicYear,
        headcount: sql<number>`(select count(*) from students s where s.classroom_id = ${classrooms.id})`,
        subjectCount: sql<number>`(select count(*) from class_subjects cs where cs.classroom_id = ${classrooms.id})`,
        teacherFirst: teachers.firstName,
        teacherLast: teachers.lastName,
      })
      .from(classrooms)
      .leftJoin(teachers, eq(teachers.id, classrooms.classTeacherId))
      .orderBy(asc(classrooms.level), asc(classrooms.section)),
    getEnrollmentByClass(),
  ]);

  const totalStudents = rows.reduce((s, r) => s + Number(r.headcount), 0);
  const totalCapacity = rows.reduce((s, r) => s + r.capacity, 0);

  return (
    <>
      <PageHeader
        title="Classes"
        description="Class groups, their form teachers, capacity and subject load."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Classes" value={rows.length} icon={School} tone="brand" />
        <StatCard
          label="Students placed"
          value={totalStudents}
          hint={`of ${totalCapacity} seats`}
          icon={Users}
          tone="emerald"
        />
        <StatCard
          label="Utilisation"
          value={`${percent(totalStudents, totalCapacity)}%`}
          hint="seats filled"
          icon={School}
          tone="amber"
        />
        <StatCard
          label="Average class size"
          value={rows.length ? Math.round(totalStudents / rows.length) : 0}
          icon={Users}
          tone="violet"
        />
      </div>

      <Card className="mb-6">
        <CardHeader title="Enrolment by class" />
        <CardBody>
          <BarChart data={enrollment} height={170} />
        </CardBody>
      </Card>

      {rows.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((c) => {
            const fill = percent(Number(c.headcount), c.capacity);
            return (
              <Card key={c.id}>
                <CardBody className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-ink-950">
                        {c.name} {c.section}
                      </h3>
                      <p className="mt-0.5 text-[11px] text-ink-500">
                        Level {c.level} · {c.room ?? "no room"} · {c.academicYear}
                      </p>
                    </div>
                    <Badge tone={fill > 90 ? "danger" : fill > 70 ? "warning" : "success"}>
                      {fill}% full
                    </Badge>
                  </div>

                  <div>
                    <div className="mb-1.5 flex justify-between text-[11px] text-ink-500">
                      <span>Enrolment</span>
                      <span className="font-medium text-ink-800">
                        {Number(c.headcount)} / {c.capacity}
                      </span>
                    </div>
                    <Progress
                      value={fill}
                      tone={fill > 90 ? "danger" : fill > 70 ? "warning" : "success"}
                    />
                  </div>

                  <dl className="grid grid-cols-2 gap-3 border-t border-ink-100 pt-3 text-[11px]">
                    <div>
                      <dt className="text-ink-500">Form teacher</dt>
                      <dd className="mt-0.5 font-medium text-ink-800">
                        {c.teacherFirst ? `${c.teacherFirst} ${c.teacherLast}` : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ink-500">Subjects</dt>
                      <dd className="mt-0.5 font-medium text-ink-800">
                        {Number(c.subjectCount)}
                      </dd>
                    </div>
                  </dl>

                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/students?classroomId=${c.id}`}
                      className="inline-flex h-8 flex-1 items-center justify-center rounded-lg border border-ink-300 text-[11px] font-medium text-ink-700 hover:bg-ink-50"
                    >
                      Students
                    </Link>
                    <Link
                      href={`/dashboard/timetable?classroomId=${c.id}`}
                      className="inline-flex h-8 flex-1 items-center justify-center rounded-lg border border-ink-300 text-[11px] font-medium text-ink-700 hover:bg-ink-50"
                    >
                      Timetable
                    </Link>
                    <Link
                      href={`/dashboard/attendance?classroomId=${c.id}`}
                      className="inline-flex h-8 flex-1 items-center justify-center rounded-lg border border-ink-300 text-[11px] font-medium text-ink-700 hover:bg-ink-50"
                    >
                      Register
                    </Link>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState icon={<School className="h-5 w-5" />} title="No classes created" />
        </Card>
      )}
    </>
  );
}
