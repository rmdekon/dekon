import { desc, eq, sql } from "drizzle-orm";
import { Award, NotebookPen, TrendingUp, Users } from "lucide-react";

import { BarChart, DonutChart } from "@/components/charts";
import { StatCard } from "@/components/stat-card";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { db } from "@/db";
import { classrooms, examResults, exams, students, subjects } from "@/db/schema";
import { getGradeDistribution, getSubjectAverages } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Exams & Grading" };
export const dynamic = "force-dynamic";

export default async function ExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ examId?: string }>;
}) {
  const sp = await searchParams;

  const examList = await db
    .select({
      id: exams.id,
      name: exams.name,
      term: exams.term,
      type: exams.type,
      academicYear: exams.academicYear,
      startDate: exams.startDate,
      endDate: exams.endDate,
      isPublished: exams.isPublished,
      resultCount: sql<number>`(select count(*) from exam_results er where er.exam_id = ${exams.id})`,
      average: sql<number>`(select round(avg(er.score), 1) from exam_results er where er.exam_id = ${exams.id})`,
    })
    .from(exams)
    .orderBy(desc(exams.startDate));

  const selectedId = sp.examId ?? examList.find((e) => e.isPublished)?.id;

  const [grades, averages, topPerformers, [totalRow]] = await Promise.all([
    getGradeDistribution(),
    getSubjectAverages(),
    selectedId
      ? db
          .select({
            studentId: students.id,
            firstName: students.firstName,
            lastName: students.lastName,
            admissionNo: students.admissionNo,
            className: classrooms.name,
            section: classrooms.section,
            average: sql<number>`round(avg(${examResults.score}), 1)`,
            subjectsTaken: sql<number>`count(*)`,
          })
          .from(examResults)
          .innerJoin(students, eq(students.id, examResults.studentId))
          .leftJoin(classrooms, eq(classrooms.id, students.classroomId))
          .where(eq(examResults.examId, selectedId))
          .groupBy(students.id)
          .orderBy(desc(sql`avg(${examResults.score})`))
          .limit(10)
      : Promise.resolve([]),
    db.select({ n: sql<number>`count(*)` }).from(examResults),
  ]);

  const published = examList.filter((e) => e.isPublished).length;
  const passRate = (() => {
    const total = grades.reduce((s, g) => s + g.value, 0);
    const failed = grades.find((g) => g.label === "F")?.value ?? 0;
    return total ? Math.round(((total - failed) / total) * 1000) / 10 : 0;
  })();

  return (
    <>
      <PageHeader
        title="Exams & Grading"
        description="Examination cycles, score analytics and class rankings."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Exam cycles"
          value={examList.length}
          hint={`${published} published`}
          icon={NotebookPen}
          tone="brand"
        />
        <StatCard
          label="Results recorded"
          value={Number(totalRow?.n ?? 0).toLocaleString()}
          icon={Users}
          tone="violet"
        />
        <StatCard
          label="Pass rate"
          value={`${passRate}%`}
          hint="grade E and above"
          icon={TrendingUp}
          tone="emerald"
        />
        <StatCard
          label="Top grade (A)"
          value={grades.find((g) => g.label === "A")?.value ?? 0}
          hint="scores of 80 and above"
          icon={Award}
          tone="amber"
        />
      </div>

      <div className="mb-6 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Grade distribution" description="All published results" />
          <CardBody>
            <DonutChart data={grades.filter((g) => g.value > 0)} centerLabel="results" />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Average by subject" description="Out of 100" />
          <CardBody>
            <BarChart data={averages} tone="emerald" height={190} />
          </CardBody>
        </Card>
      </div>

      <Card className="mb-6 overflow-hidden">
        <CardHeader title="Examination cycles" />
        {examList.length ? (
          <Table>
            <thead>
              <tr>
                <Th>Examination</Th>
                <Th>Term</Th>
                <Th>Type</Th>
                <Th>Window</Th>
                <Th>Results</Th>
                <Th>Average</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {examList.map((e) => (
                <Tr key={e.id}>
                  <Td className="font-medium text-ink-900">{e.name}</Td>
                  <Td className="text-xs">{e.term.replace("_", " ")}</Td>
                  <Td>
                    <Badge tone="neutral">{e.type}</Badge>
                  </Td>
                  <Td className="text-xs">
                    {formatDate(e.startDate)} – {formatDate(e.endDate)}
                  </Td>
                  <Td className="text-xs tabular-nums">{Number(e.resultCount)}</Td>
                  <Td className="text-xs font-semibold tabular-nums">
                    {e.average ?? "—"}
                  </Td>
                  <Td>
                    <Badge tone={e.isPublished ? "success" : "warning"}>
                      {e.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState title="No exams scheduled" />
        )}
      </Card>

      <Card className="overflow-hidden">
        <CardHeader
          title="Top performers"
          description={
            examList.find((e) => e.id === selectedId)?.name ??
            "Select a published exam"
          }
          action={
            <form method="get" action="/dashboard/exams">
              <select
                name="examId"
                defaultValue={selectedId}
                className="h-8 rounded-lg border border-ink-300 bg-white px-2.5 text-xs focus:border-brand-500 focus:outline-none"
              >
                {examList
                  .filter((e) => e.isPublished)
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
              </select>
              <button
                type="submit"
                className="ml-2 h-8 rounded-lg bg-brand-600 px-3 text-xs font-medium text-white hover:bg-brand-700"
              >
                Show
              </button>
            </form>
          }
        />
        {topPerformers.length ? (
          <Table>
            <thead>
              <tr>
                <Th>#</Th>
                <Th>Student</Th>
                <Th>Admission no.</Th>
                <Th>Class</Th>
                <Th>Subjects</Th>
                <Th>Average</Th>
              </tr>
            </thead>
            <tbody>
              {topPerformers.map((p, i) => (
                <Tr key={p.studentId}>
                  <Td>
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                        i === 0
                          ? "bg-amber-100 text-amber-700"
                          : i === 1
                            ? "bg-ink-200 text-ink-700"
                            : i === 2
                              ? "bg-orange-100 text-orange-700"
                              : "bg-ink-100 text-ink-500"
                      }`}
                    >
                      {i + 1}
                    </span>
                  </Td>
                  <Td className="font-medium text-ink-900">
                    {p.firstName} {p.lastName}
                  </Td>
                  <Td className="font-mono text-xs">{p.admissionNo}</Td>
                  <Td className="text-xs">
                    {p.className ? `${p.className} ${p.section}` : "—"}
                  </Td>
                  <Td className="text-xs tabular-nums">{Number(p.subjectsTaken)}</Td>
                  <Td>
                    <Badge tone={Number(p.average) >= 70 ? "success" : "warning"}>
                      {p.average}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState title="No results for this exam yet" />
        )}
      </Card>
    </>
  );
}
