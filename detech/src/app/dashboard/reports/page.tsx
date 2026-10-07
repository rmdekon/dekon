import { asc, desc, eq, sql } from "drizzle-orm";
import {
  Banknote,
  ClipboardCheck,
  GraduationCap,
  TrendingUp,
} from "lucide-react";

import { BarChart, DonutChart, LineChart } from "@/components/charts";
import { StatCard } from "@/components/stat-card";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  PageHeader,
  Progress,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { db } from "@/db";
import { attendance, classrooms, examResults, students } from "@/db/schema";
import {
  getAttendanceBreakdown,
  getAttendanceTrend,
  getEnrollmentByClass,
  getFinanceSummary,
  getGradeDistribution,
  getMonthlyCollections,
  getSchoolStats,
  getSubjectAverages,
} from "@/lib/queries";
import { formatDate, formatMoney, percent } from "@/lib/utils";

export const metadata = { title: "Reports & Analytics" };
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [
    stats,
    trend,
    breakdown,
    grades,
    averages,
    enrollment,
    finance,
    collections,
    classPerformance,
  ] = await Promise.all([
    getSchoolStats(),
    getAttendanceTrend(21),
    getAttendanceBreakdown(90),
    getGradeDistribution(),
    getSubjectAverages(),
    getEnrollmentByClass(),
    getFinanceSummary(),
    getMonthlyCollections(6),
    db
      .select({
        id: classrooms.id,
        name: classrooms.name,
        section: classrooms.section,
        headcount: sql<number>`count(distinct ${students.id})`,
        average: sql<number>`round(avg(${examResults.score}), 1)`,
        attendanceRate: sql<number>`(
          select round(
            100.0 * sum(case when a.status in ('PRESENT','LATE') then 1 else 0 end) / count(*), 1
          )
          from attendance a where a.classroom_id = ${classrooms.id}
        )`,
      })
      .from(classrooms)
      .leftJoin(students, eq(students.classroomId, classrooms.id))
      .leftJoin(examResults, eq(examResults.studentId, students.id))
      .groupBy(classrooms.id)
      .orderBy(asc(classrooms.level), asc(classrooms.section)),
  ]);

  const avgAttendance = trend.length
    ? Math.round((trend.reduce((s, d) => s + d.rate, 0) / trend.length) * 10) / 10
    : 0;

  const totalGrades = grades.reduce((s, g) => s + g.value, 0);
  const passRate = totalGrades
    ? Math.round(
        ((totalGrades - (grades.find((g) => g.label === "F")?.value ?? 0)) /
          totalGrades) *
          1000,
      ) / 10
    : 0;

  const schoolAverage = averages.length
    ? Math.round(
        (averages.reduce((s, a) => s + a.value, 0) / averages.length) * 10,
      ) / 10
    : 0;

  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        description="Academic performance, attendance and financial insight across the school."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="School average"
          value={schoolAverage || "—"}
          hint="mean score out of 100"
          icon={GraduationCap}
          tone="brand"
        />
        <StatCard
          label="Pass rate"
          value={`${passRate}%`}
          hint={`${totalGrades.toLocaleString()} results analysed`}
          icon={TrendingUp}
          tone="emerald"
        />
        <StatCard
          label="Attendance (21d)"
          value={`${avgAttendance}%`}
          hint="rolling average"
          icon={ClipboardCheck}
          tone="violet"
        />
        <StatCard
          label="Collection rate"
          value={`${finance.collectionRate}%`}
          hint={`${formatMoney(finance.outstanding)} outstanding`}
          icon={Banknote}
          tone="amber"
        />
      </div>

      {/* Attendance report */}
      <Card className="mb-6">
        <CardHeader
          title="Attendance report"
          description="Daily attendance rate over the last 21 school days"
        />
        <CardBody>
          <LineChart
            data={trend.map((d) => ({
              label: formatDate(d.date, { day: "numeric", month: "short" }),
              value: d.rate,
            }))}
            suffix="%"
            height={220}
          />
        </CardBody>
      </Card>

      <div className="mb-6 grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader title="Attendance mix" description="Last 90 days" />
          <CardBody>
            <DonutChart data={breakdown} centerLabel="records" />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Grade distribution" description="All published results" />
          <CardBody>
            <BarChart data={grades} height={190} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Enrolment" description="Students per class" />
          <CardBody>
            <BarChart data={enrollment} tone="amber" height={190} />
          </CardBody>
        </Card>
      </div>

      {/* Financial report */}
      <Card className="mb-6">
        <CardHeader
          title="Financial report"
          description="Billing, receipts and outstanding balances"
        />
        <CardBody className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <Figure label="Total billed" value={formatMoney(finance.billed)} />
            <Figure
              label="Collected"
              value={formatMoney(finance.collected)}
              tone="text-emerald-600"
            />
            <Figure
              label="Outstanding"
              value={formatMoney(finance.outstanding)}
              tone="text-rose-600"
            />
            <Figure
              label="Overdue invoices"
              value={String(finance.overdueCount)}
              tone="text-amber-600"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-ink-500">Collection rate</span>
              <span className="font-semibold text-ink-900">
                {finance.collectionRate}%
              </span>
            </div>
            <Progress
              value={finance.collectionRate}
              tone={finance.collectionRate > 70 ? "success" : "warning"}
            />
          </div>

          <BarChart data={collections} tone="emerald" height={170} />
        </CardBody>
      </Card>

      {/* Per-class performance */}
      <Card className="overflow-hidden">
        <CardHeader
          title="Class performance summary"
          description="Average score and attendance rate per class"
        />
        <Table>
          <thead>
            <tr>
              <Th>Class</Th>
              <Th>Students</Th>
              <Th>Average score</Th>
              <Th>Attendance rate</Th>
              <Th>Standing</Th>
            </tr>
          </thead>
          <tbody>
            {classPerformance.map((c) => {
              const avg = Number(c.average ?? 0);
              const att = Number(c.attendanceRate ?? 0);
              return (
                <Tr key={c.id}>
                  <Td className="font-medium text-ink-900">
                    {c.name} {c.section}
                  </Td>
                  <Td className="text-xs tabular-nums">{Number(c.headcount)}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <span className="w-10 text-xs font-semibold tabular-nums">
                        {avg || "—"}
                      </span>
                      <Progress
                        value={avg}
                        className="w-24"
                        tone={avg >= 70 ? "success" : avg >= 50 ? "warning" : "danger"}
                      />
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <span className="w-10 text-xs font-semibold tabular-nums">
                        {att || "—"}%
                      </span>
                      <Progress
                        value={att}
                        className="w-24"
                        tone={att >= 90 ? "success" : att >= 75 ? "warning" : "danger"}
                      />
                    </div>
                  </Td>
                  <Td>
                    <Badge
                      tone={
                        avg >= 70 ? "success" : avg >= 55 ? "warning" : "danger"
                      }
                    >
                      {avg >= 70
                        ? "Strong"
                        : avg >= 55
                          ? "Satisfactory"
                          : "Needs support"}
                    </Badge>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
    </>
  );
}

function Figure({
  label,
  value,
  tone = "text-ink-950",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-lg bg-ink-50 px-4 py-3">
      <p className="text-[11px] text-ink-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold tracking-tight ${tone}`}>{value}</p>
    </div>
  );
}
