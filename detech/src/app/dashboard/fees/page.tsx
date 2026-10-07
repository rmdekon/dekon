import { and, desc, eq, sql } from "drizzle-orm";
import { AlertTriangle, Banknote, Receipt, TrendingUp } from "lucide-react";

import { BarChart, DonutChart } from "@/components/charts";
import { FilterSelect } from "@/components/filter-bar";
import { StatCard } from "@/components/stat-card";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  Progress,
  Table,
  Td,
  Th,
  Tr,
  statusTone,
} from "@/components/ui";
import { db } from "@/db";
import { feeInvoices, payments, students } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { INVOICE_STATUSES } from "@/lib/enums";
import {
  getChildrenForUser,
  getFinanceSummary,
  getMonthlyCollections,
  getStudentForUser,
} from "@/lib/queries";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata = { title: "Fees & Payments" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function FeesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const user = await getSession();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  // Students and parents only ever see their own / their children's invoices.
  let scopedStudentIds: string[] | null = null;
  if (user?.role === "STUDENT") {
    const me = await getStudentForUser(user.id);
    scopedStudentIds = me ? [me.id] : [];
  } else if (user?.role === "PARENT") {
    const kids = await getChildrenForUser(user.id);
    scopedStudentIds = kids.map((k) => k.student.id);
  }

  const filters = [
    sp.status ? eq(feeInvoices.status, sp.status) : undefined,
    scopedStudentIds
      ? scopedStudentIds.length
        ? sql`${feeInvoices.studentId} in (${sql.join(
            scopedStudentIds.map((id) => sql`${id}`),
            sql`, `,
          )})`
        : sql`1 = 0`
      : undefined,
  ].filter(Boolean);
  const where = filters.length ? and(...filters) : undefined;

  const [rows, [countRow], summary, collections] = await Promise.all([
    db
      .select({
        id: feeInvoices.id,
        invoiceNo: feeInvoices.invoiceNo,
        term: feeInvoices.term,
        amount: feeInvoices.amount,
        status: feeInvoices.status,
        dueDate: feeInvoices.dueDate,
        description: feeInvoices.description,
        firstName: students.firstName,
        lastName: students.lastName,
        admissionNo: students.admissionNo,
        paid: sql<number>`coalesce((select sum(p.amount) from payments p where p.invoice_id = ${feeInvoices.id}), 0)`,
      })
      .from(feeInvoices)
      .innerJoin(students, eq(students.id, feeInvoices.studentId))
      .where(where)
      .orderBy(desc(feeInvoices.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: sql<number>`count(*)` }).from(feeInvoices).where(where),
    getFinanceSummary(),
    getMonthlyCollections(6),
  ]);

  const total = Number(countRow?.n ?? 0);
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  const scoped = scopedStudentIds !== null;

  const statusChart = Object.entries(summary.byStatus).map(([label, value]) => ({
    label: label.charAt(0) + label.slice(1).toLowerCase(),
    value: Number(value),
  }));

  return (
    <>
      <PageHeader
        title="Fees & Payments"
        description={
          scoped
            ? "Your invoices, payments and outstanding balance."
            : "School-wide invoicing, collections and outstanding balances."
        }
      />

      {!scoped ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total billed"
              value={formatMoney(summary.billed)}
              hint={`${total} invoices`}
              icon={Receipt}
              tone="brand"
            />
            <StatCard
              label="Collected"
              value={formatMoney(summary.collected)}
              hint={`${summary.collectionRate}% of billed`}
              icon={Banknote}
              tone="emerald"
            />
            <StatCard
              label="Outstanding"
              value={formatMoney(summary.outstanding)}
              hint={`${summary.unpaidCount} invoices pending`}
              icon={TrendingUp}
              tone="amber"
            />
            <StatCard
              label="Overdue"
              value={summary.overdueCount}
              hint="past their due date"
              icon={AlertTriangle}
              tone="rose"
            />
          </div>

          <div className="mb-6 grid gap-5 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Monthly collections" description="Receipts over the last 6 months" />
              <CardBody className="space-y-5">
                <BarChart data={collections} tone="emerald" height={170} />
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-ink-500">Overall collection rate</span>
                    <span className="font-semibold text-ink-900">
                      {summary.collectionRate}%
                    </span>
                  </div>
                  <Progress
                    value={summary.collectionRate}
                    tone={summary.collectionRate > 70 ? "success" : "warning"}
                  />
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Invoices by status" />
              <CardBody>
                <DonutChart data={statusChart} centerLabel="invoices" />
              </CardBody>
            </Card>
          </div>
        </>
      ) : null}

      <form
        method="get"
        action="/dashboard/fees"
        className="mb-5 flex flex-wrap items-center gap-2.5 rounded-xl border border-ink-200 bg-white p-3"
      >
        <FilterSelect
          name="status"
          label="Any status"
          defaultValue={sp.status}
          options={INVOICE_STATUSES.map((s) => ({ value: s, label: s }))}
        />
        <button
          type="submit"
          className="h-9 rounded-lg bg-brand-600 px-4 text-xs font-medium text-white hover:bg-brand-700"
        >
          Filter
        </button>
        <span className="ml-auto text-xs text-ink-500">
          {total} invoice{total === 1 ? "" : "s"}
        </span>
      </form>

      <Card className="overflow-hidden">
        {rows.length ? (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Invoice</Th>
                  <Th>Student</Th>
                  <Th>Term</Th>
                  <Th>Amount</Th>
                  <Th>Paid</Th>
                  <Th>Balance</Th>
                  <Th>Due</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((inv) => {
                  const paid = Number(inv.paid);
                  const balance = Math.max(0, inv.amount - paid);
                  return (
                    <Tr key={inv.id}>
                      <Td className="font-mono text-[11px] font-medium text-brand-700">
                        {inv.invoiceNo}
                      </Td>
                      <Td>
                        <p className="font-medium text-ink-900">
                          {inv.firstName} {inv.lastName}
                        </p>
                        <p className="font-mono text-[10px] text-ink-400">
                          {inv.admissionNo}
                        </p>
                      </Td>
                      <Td className="text-xs">{inv.term.replace("_", " ")}</Td>
                      <Td className="text-xs tabular-nums">
                        {formatMoney(inv.amount)}
                      </Td>
                      <Td className="text-xs tabular-nums text-emerald-600">
                        {formatMoney(paid)}
                      </Td>
                      <Td
                        className={`text-xs font-semibold tabular-nums ${balance > 0 ? "text-rose-600" : "text-ink-400"}`}
                      >
                        {formatMoney(balance)}
                      </Td>
                      <Td className="text-xs">{formatDate(inv.dueDate)}</Td>
                      <Td>
                        <Badge tone={statusTone(inv.status)}>{inv.status}</Badge>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
            {totalPages > 1 ? (
              <div className="flex items-center justify-between border-t border-ink-200 px-5 py-3">
                <p className="text-xs text-ink-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <a
                    href={`/dashboard/fees?page=${Math.max(1, page - 1)}${sp.status ? `&status=${sp.status}` : ""}`}
                    className={`rounded-lg border border-ink-300 px-3 py-1.5 text-xs font-medium ${page <= 1 ? "pointer-events-none text-ink-300" : "text-ink-700 hover:bg-ink-50"}`}
                  >
                    Previous
                  </a>
                  <a
                    href={`/dashboard/fees?page=${Math.min(totalPages, page + 1)}${sp.status ? `&status=${sp.status}` : ""}`}
                    className={`rounded-lg border border-ink-300 px-3 py-1.5 text-xs font-medium ${page >= totalPages ? "pointer-events-none text-ink-300" : "text-ink-700 hover:bg-ink-50"}`}
                  >
                    Next
                  </a>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <EmptyState
            icon={<Receipt className="h-5 w-5" />}
            title="No invoices found"
            description="Nothing matches the current filter."
          />
        )}
      </Card>
    </>
  );
}
