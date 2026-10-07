import Link from "next/link";
import {
  ArrowUpRight,
  Banknote,
  BookOpen,
  Bus,
  CalendarClock,
  ClipboardCheck,
  GraduationCap,
  Megaphone,
  Users,
} from "lucide-react";

import { BarChart, DonutChart, LineChart } from "@/components/charts";
import { StatCard } from "@/components/stat-card";
import { Badge, Card, CardBody, CardHeader, EmptyState, Progress } from "@/components/ui";
import type { SessionUser } from "@/lib/auth";
import {
  getAnnouncementsFor,
  getAttendanceBreakdown,
  getAttendanceTrend,
  getEnrollmentByClass,
  getFinanceSummary,
  getGradeDistribution,
  getLibraryStats,
  getMonthlyCollections,
  getSchoolStats,
  getSubjectAverages,
  getTransportStats,
  getUpcomingExams,
} from "@/lib/queries";
import { formatDate, formatMoney, formatNumber, relativeTime } from "@/lib/utils";

export async function AdminDashboard({ user }: { user: SessionUser }) {
  const [
    stats,
    trend,
    breakdown,
    finance,
    collections,
    grades,
    subjectAverages,
    enrollment,
    upcomingExams,
    notices,
    library,
    transport,
  ] = await Promise.all([
    getSchoolStats(),
    getAttendanceTrend(14),
    getAttendanceBreakdown(30),
    getFinanceSummary(),
    getMonthlyCollections(6),
    getGradeDistribution(),
    getSubjectAverages(),
    getEnrollmentByClass(),
    getUpcomingExams(3),
    getAnnouncementsFor(user.role, 4),
    getLibraryStats(),
    getTransportStats(),
  ]);

  const latest = trend.at(-1);
  const previous = trend.at(-2);
  const attendanceTrend =
    latest && previous
      ? Math.round((latest.rate - previous.rate) * 10) / 10
      : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink-950 sm:text-2xl">
          Good day, {user.name.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Here is what is happening across the school today.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active students"
          value={formatNumber(stats.students)}
          hint={`${stats.classes} classes · ${stats.guardians} guardians`}
          icon={Users}
          tone="brand"
        />
        <StatCard
          label="Teaching staff"
          value={formatNumber(stats.teachers)}
          hint={`${stats.subjects} subjects offered`}
          icon={GraduationCap}
          tone="violet"
        />
        <StatCard
          label="Attendance rate"
          value={`${latest?.rate ?? 0}%`}
          hint={latest ? `on ${formatDate(latest.date)}` : "no register yet"}
          icon={ClipboardCheck}
          tone="emerald"
          trend={attendanceTrend}
        />
        <StatCard
          label="Fees collected"
          value={formatMoney(finance.collected)}
          hint={`${finance.collectionRate}% of ${formatMoney(finance.billed)} billed`}
          icon={Banknote}
          tone="amber"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Attendance rate"
            description="Share of students present or late, last 14 school days"
            action={
              <Link
                href="/dashboard/attendance"
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                Open register <ArrowUpRight className="h-3 w-3" />
              </Link>
            }
          />
          <CardBody>
            <LineChart
              data={trend.map((d) => ({
                label: formatDate(d.date, { day: "numeric", month: "short" }),
                value: d.rate,
              }))}
              suffix="%"
              height={210}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Attendance mix"
            description="All registers, last 30 days"
          />
          <CardBody>
            <DonutChart
              data={breakdown}
              centerLabel="records"
              centerValue={formatNumber(
                breakdown.reduce((s, d) => s + d.value, 0),
              )}
            />
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader title="Grade distribution" description="All published results" />
          <CardBody>
            <BarChart data={grades} tone="brand" height={170} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Average score by subject" description="Out of 100" />
          <CardBody>
            <BarChart data={subjectAverages} tone="emerald" height={170} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Enrolment by class" description="Students per class" />
          <CardBody>
            <BarChart data={enrollment} tone="amber" height={170} />
          </CardBody>
        </Card>
      </div>

      {/* Finance + operations */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Fee collection"
            description="Monthly receipts and outstanding balance"
            action={
              <Link
                href="/dashboard/fees"
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                Manage fees <ArrowUpRight className="h-3 w-3" />
              </Link>
            }
          />
          <CardBody className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <Figure label="Billed" value={formatMoney(finance.billed)} />
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

            <BarChart data={collections} tone="emerald" height={140} />
          </CardBody>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Operations" />
            <CardBody className="space-y-3.5">
              <OpsRow
                icon={BookOpen}
                label="Library titles"
                value={`${library.titles} titles · ${library.copies} copies`}
              />
              <OpsRow
                icon={BookOpen}
                label="Books on loan"
                value={`${library.onLoan} out · ${library.overdue} overdue`}
                tone={library.overdue > 0 ? "text-amber-600" : undefined}
              />
              <OpsRow
                icon={Bus}
                label="Transport riders"
                value={`${transport.riders} students`}
              />
              <OpsRow
                icon={Banknote}
                label="Invoices needing action"
                value={`${finance.unpaidCount} unpaid · ${finance.overdueCount} overdue`}
                tone={finance.overdueCount > 0 ? "text-rose-600" : undefined}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Upcoming exams" />
            {upcomingExams.length ? (
              <ul className="divide-y divide-ink-100">
                {upcomingExams.map((exam) => (
                  <li key={exam.id} className="flex items-start gap-3 px-5 py-3.5">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                      <CalendarClock className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-ink-900">
                        {exam.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-ink-500">
                        {formatDate(exam.startDate)} – {formatDate(exam.endDate)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<CalendarClock className="h-5 w-5" />}
                title="No scheduled exams"
                description="Create an exam cycle to see it here."
              />
            )}
          </Card>
        </div>
      </div>

      {/* Announcements */}
      <Card>
        <CardHeader
          title="Latest announcements"
          action={
            <Link
              href="/dashboard/announcements"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          }
        />
        {notices.length ? (
          <ul className="divide-y divide-ink-100">
            {notices.map((n) => (
              <li key={n.id} className="flex items-start gap-3.5 px-5 py-4">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Megaphone className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-ink-900">{n.title}</p>
                    {n.isPinned ? <Badge tone="brand">Pinned</Badge> : null}
                    <Badge tone="neutral">{n.audience}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-500">
                    {n.body}
                  </p>
                  <p className="mt-1.5 text-[11px] text-ink-400">
                    {n.authorName ?? "System"} · {relativeTime(n.publishedAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No announcements yet" />
        )}
      </Card>
    </div>
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
      <p className={`mt-1 text-lg font-semibold tracking-tight ${tone}`}>
        {value}
      </p>
    </div>
  );
}

function OpsRow({
  icon: Icon,
  label,
  value,
  tone = "text-ink-700",
}: {
  icon: typeof BookOpen;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-ink-900">{label}</p>
        <p className={`truncate text-[11px] ${tone}`}>{value}</p>
      </div>
    </div>
  );
}
