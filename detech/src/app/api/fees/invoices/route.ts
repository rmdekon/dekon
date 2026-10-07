import type { NextRequest } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { feeInvoices, students } from "@/db/schema";
import { handler, ok, pagination } from "@/lib/api";
import { requireRole, requireSession } from "@/lib/auth";
import { nextInvoiceNo } from "@/lib/billing";
import { getFinanceSummary } from "@/lib/queries";
import { invoiceCreateSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export const GET = handler(async (request: NextRequest) => {
  await requireSession();
  const url = new URL(request.url);
  const { page, pageSize, offset } = pagination(url);
  const status = url.searchParams.get("status");
  const studentId = url.searchParams.get("studentId");

  const filters = [
    status ? eq(feeInvoices.status, status) : undefined,
    studentId ? eq(feeInvoices.studentId, studentId) : undefined,
  ].filter(Boolean);
  const where = filters.length ? and(...filters) : undefined;

  const [items, [countRow], summary] = await Promise.all([
    db
      .select({
        id: feeInvoices.id,
        invoiceNo: feeInvoices.invoiceNo,
        term: feeInvoices.term,
        amount: feeInvoices.amount,
        status: feeInvoices.status,
        dueDate: feeInvoices.dueDate,
        description: feeInvoices.description,
        student: {
          id: students.id,
          firstName: students.firstName,
          lastName: students.lastName,
          admissionNo: students.admissionNo,
        },
        paid: sql<number>`coalesce((select sum(p.amount) from payments p where p.invoice_id = ${feeInvoices.id}), 0)`,
      })
      .from(feeInvoices)
      .innerJoin(students, eq(students.id, feeInvoices.studentId))
      .where(where)
      .orderBy(desc(feeInvoices.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ n: sql<number>`count(*)` }).from(feeInvoices).where(where),
    getFinanceSummary(),
  ]);

  const total = Number(countRow?.n ?? 0);
  return ok({
    items,
    summary,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
});

export const POST = handler(async (request: NextRequest) => {
  await requireRole("ADMIN", "ACCOUNTANT");
  const data = invoiceCreateSchema.parse(await request.json().catch(() => ({})));

  const [invoice] = await db
    .insert(feeInvoices)
    .values({ ...data, invoiceNo: await nextInvoiceNo() })
    .returning();

  return ok({ invoice }, { status: 201 });
});
