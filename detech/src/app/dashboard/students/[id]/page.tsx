import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  ClipboardCheck,
  Mail,
  MapPin,
  Percent,
  Phone,
} from "lucide-react";

import { BarChart } from "@/components/charts";
import { StatCard } from "@/components/stat-card";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Table,
  Td,
  Th,
  Tr,
  statusTone,
} from "@/components/ui";
import { db } from "@/db";
import {
  attendance,
  classrooms,
  examResults,
  exams,
  feeInvoices,
  guardianStudents,
  guardians,
  students,
  subjects,
} from "@/db/schema";
import { getStudentSnapshot } from "@/lib/queries";
import {
  colorFromString,
  formatDate,
  formatMoney,
  initials,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [s] = await db
    .select({ firstName: students.firstName, lastName: students.lastName })
    .from(students)
    .where(eq(students.id, id))
    .limit(1);
  return { title: s ? `${s.firstName} ${s.lastName}` : "Student" };
}

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [row] = await db
    .select({ student: students, classroom: classrooms })
    .from(students)
    .leftJoin(classrooms, eq(classrooms.id, students.classroomId))
    .where(eq(students.id, id))
    .limit(1);

  if (!row) notFound();

  const { student, classroom } = row;

  const [snapshot, results, recentAttendance, invoices, family] = await Promise.all([
    getStudentSnapshot(id),
    db
      .select({
        id: examResults.id,
        score: examResults.score,
        maxScore: examResults.maxScore,
        grade: examResults.grade,
        remark: examResults.remark,
        subject: subjects.name,
        exam: exams.name,
      })
      .from(examResults)
      .innerJoin(subjects, eq(subjects.id, examResults.subjectId))
      .innerJoin(exams, eq(exams.id, examResults.examId))
      .where(eq(examResults.studentId, id))
      .orderBy(desc(examResults.createdAt))
      .limit(16),
    db
      .select()
      .from(attendance)
      .where(eq(attendance.studentId, id))
      .orderBy(desc(attendance.date))
      .limit(10),
    db
      .select()
      .from(feeInvoices)
      .where(eq(feeInvoices.studentId, id))
      .orderBy(desc(feeInvoices.createdAt)),
    db
      .select({
        relation: guardianStudents.relation,
        isPrimary: guardianStudents.isPrimary,
        firstName: guardians.firstName,
        lastName: guardians.lastName,
        phone: guardians.phone,
        occupation: guardians.occupation,
      })
      .from(guardianStudents)
      .innerJoin(guardians, eq(guardians.id, guardianStudents.guardianId))
      .where(eq(guardianStudents.studentId, id)),
  ]);

  const chartData = results.slice(0, 8).map((r) => ({
    label: r.subject.split(" ")[0].slice(0, 6),
    value: r.score,
  }));

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/students"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to students
      </Link>

      {/* Identity header */}
      <Card>
        <CardBody className="flex flex-wrap items-center gap-5">
          <span
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white ${colorFromString(student.firstName + student.lastName)}`}
          >
            {initials(`${student.firstName} ${student.lastName}`)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-semibold tracking-tight text-ink-950">
                {student.firstName} {student.lastName}
              </h1>
              <Badge tone={statusTone(student.status)}>{student.status}</Badge>
            </div>
            <p className="mt-1 font-mono text-xs text-ink-500">
              {student.admissionNo}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-ink-600">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-ink-400" />
                {classroom ? `${classroom.name} ${classroom.section}` : "No class"}
              </span>
              {student.phone ? (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-ink-400" />
                  {student.phone}
                </span>
              ) : null}
              {student.address ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-ink-400" />
                  {student.address}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-ink-400" />
                Born {formatDate(student.dateOfBirth)}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* KPIs */}
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
          hint="all published exams"
          icon={Percent}
          tone="brand"
        />
        <StatCard
          label="Fees billed"
          value={formatMoney(snapshot.feesBilled)}
          hint={`${invoices.length} invoices`}
          icon={Banknote}
          tone="violet"
        />
        <StatCard
          label="Balance due"
          value={formatMoney(snapshot.feesOutstanding)}
          hint={`${formatMoney(snapshot.feesPaid)} paid`}
          icon={Banknote}
          tone={snapshot.feesOutstanding > 0 ? "rose" : "emerald"}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Recent scores" description="Most recent published results" />
          <CardBody>
            {chartData.length ? (
              <BarChart data={chartData} height={180} />
            ) : (
              <EmptyState title="No results yet" />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Guardians" />
          {family.length ? (
            <ul className="divide-y divide-ink-100">
              {family.map((g, i) => (
                <li key={i} className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-ink-900">
                      {g.firstName} {g.lastName}
                    </p>
                    {g.isPrimary ? <Badge tone="brand">Primary</Badge> : null}
                  </div>
                  <p className="mt-0.5 text-[11px] text-ink-500">
                    {g.relation} · {g.occupation ?? "—"}
                  </p>
                  {g.phone ? (
                    <p className="text-[11px] text-ink-500">{g.phone}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No guardian linked" />
          )}
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader title="Examination results" />
          {results.length ? (
            <Table>
              <thead>
                <tr>
                  <Th>Subject</Th>
                  <Th>Exam</Th>
                  <Th>Score</Th>
                  <Th>Grade</Th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <Tr key={r.id}>
                    <Td className="text-xs font-medium text-ink-900">{r.subject}</Td>
                    <Td className="text-xs">{r.exam}</Td>
                    <Td className="text-xs tabular-nums">
                      {r.score}/{r.maxScore}
                    </Td>
                    <Td>
                      <Badge
                        tone={
                          r.grade === "A" || r.grade === "B"
                            ? "success"
                            : r.grade === "F"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {r.grade ?? "—"}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <EmptyState title="No results published" />
          )}
        </Card>

        <div className="space-y-5">
          <Card className="overflow-hidden">
            <CardHeader title="Fee invoices" />
            {invoices.length ? (
              <Table>
                <thead>
                  <tr>
                    <Th>Invoice</Th>
                    <Th>Term</Th>
                    <Th>Amount</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <Tr key={inv.id}>
                      <Td className="font-mono text-[11px]">{inv.invoiceNo}</Td>
                      <Td className="text-xs">{inv.term.replace("_", " ")}</Td>
                      <Td className="text-xs tabular-nums">
                        {formatMoney(inv.amount)}
                      </Td>
                      <Td>
                        <Badge tone={statusTone(inv.status)}>{inv.status}</Badge>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <EmptyState title="No invoices" />
            )}
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Recent attendance" />
            {recentAttendance.length ? (
              <ul className="divide-y divide-ink-100">
                {recentAttendance.map((a) => (
                  <li
                    key={a.id}
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
        </div>
      </div>
    </div>
  );
}
