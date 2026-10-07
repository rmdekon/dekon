import Link from "next/link";
import { ArrowUpRight, Banknote, Megaphone, Users } from "lucide-react";

import { Badge, Card, CardBody, CardHeader, EmptyState, Progress } from "@/components/ui";
import type { SessionUser } from "@/lib/auth";
import { getAnnouncementsFor, getChildrenForUser, getStudentSnapshot } from "@/lib/queries";
import { colorFromString, formatMoney, initials, relativeTime } from "@/lib/utils";

export async function ParentDashboard({ user }: { user: SessionUser }) {
  const children = await getChildrenForUser(user.id);
  const notices = await getAnnouncementsFor("PARENT", 5);

  const snapshots = await Promise.all(
    children.map(async (c) => ({
      ...c,
      snapshot: await getStudentSnapshot(c.student.id),
    })),
  );

  const totalOutstanding = snapshots.reduce(
    (sum, c) => sum + c.snapshot.feesOutstanding,
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink-950 sm:text-2xl">
          Welcome, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Following {children.length} {children.length === 1 ? "child" : "children"} at
          DETECH.
        </p>
      </div>

      {totalOutstanding > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <Banknote className="h-5 w-5 shrink-0 text-amber-600" />
          <p className="flex-1 text-sm text-amber-900">
            You have <strong>{formatMoney(totalOutstanding)}</strong> in
            outstanding school fees.
          </p>
          <Link
            href="/dashboard/fees"
            className="inline-flex h-8 items-center rounded-lg bg-amber-600 px-3 text-xs font-medium text-white hover:bg-amber-700"
          >
            View invoices
          </Link>
        </div>
      ) : null}

      {snapshots.length ? (
        <div className="grid gap-5 md:grid-cols-2">
          {snapshots.map(({ student, classroom, relation, snapshot }) => (
            <Card key={student.id}>
              <CardBody className="space-y-5">
                <div className="flex items-center gap-3.5">
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white ${colorFromString(student.firstName + student.lastName)}`}
                  >
                    {initials(`${student.firstName} ${student.lastName}`)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-950">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="text-xs text-ink-500">
                      {classroom ? `${classroom.name} ${classroom.section}` : "No class"} ·{" "}
                      {student.admissionNo}
                    </p>
                  </div>
                  <Badge tone="neutral">{relation}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Metric
                    label="Attendance"
                    value={`${snapshot.attendanceRate}%`}
                  />
                  <Metric
                    label="Avg score"
                    value={snapshot.averageScore ? `${snapshot.averageScore}` : "—"}
                  />
                  <Metric
                    label="Balance"
                    value={formatMoney(snapshot.feesOutstanding)}
                    tone={snapshot.feesOutstanding > 0 ? "text-rose-600" : "text-emerald-600"}
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex justify-between text-[11px] text-ink-500">
                    <span>Fees paid</span>
                    <span>
                      {formatMoney(snapshot.feesPaid)} / {formatMoney(snapshot.feesBilled)}
                    </span>
                  </div>
                  <Progress
                    value={
                      snapshot.feesBilled
                        ? (snapshot.feesPaid / snapshot.feesBilled) * 100
                        : 0
                    }
                    tone={snapshot.feesOutstanding > 0 ? "warning" : "success"}
                  />
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/students/${student.id}`}
                    className="inline-flex h-8 flex-1 items-center justify-center rounded-lg border border-ink-300 text-xs font-medium text-ink-700 hover:bg-ink-50"
                  >
                    Full profile
                  </Link>
                  <Link
                    href="/dashboard/attendance"
                    className="inline-flex h-8 flex-1 items-center justify-center rounded-lg border border-ink-300 text-xs font-medium text-ink-700 hover:bg-ink-50"
                  >
                    Attendance
                  </Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title="No children linked to your account"
            description="Please contact the school office to link your child's record."
          />
        </Card>
      )}

      <Card>
        <CardHeader
          title="School announcements"
          action={
            <Link
              href="/dashboard/announcements"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-600"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          }
        />
        {notices.length ? (
          <ul className="divide-y divide-ink-100">
            {notices.map((n) => (
              <li key={n.id} className="flex gap-3.5 px-5 py-4">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Megaphone className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900">{n.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-ink-500">{n.body}</p>
                  <p className="mt-1.5 text-[11px] text-ink-400">
                    {relativeTime(n.publishedAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No announcements" />
        )}
      </Card>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "text-ink-950",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-lg bg-ink-50 px-3 py-2.5 text-center">
      <p className="text-[10px] text-ink-500">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
