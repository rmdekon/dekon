import "server-only";

import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { feeInvoices, payments } from "@/db/schema";

/**
 * Re-derives an invoice's status from the sum of its payments.
 * Called after every payment so `status` is never stale.
 */
export async function recalculateInvoice(invoiceId: string) {
  const [invoice] = await db
    .select()
    .from(feeInvoices)
    .where(eq(feeInvoices.id, invoiceId))
    .limit(1);
  if (!invoice) return null;

  const [row] = await db
    .select({ v: sql<number>`coalesce(sum(${payments.amount}), 0)` })
    .from(payments)
    .where(eq(payments.invoiceId, invoiceId));

  const paid = Number(row?.v ?? 0);
  const status =
    paid >= invoice.amount
      ? "PAID"
      : paid > 0
        ? "PARTIAL"
        : invoice.dueDate < new Date()
          ? "OVERDUE"
          : "UNPAID";

  await db
    .update(feeInvoices)
    .set({ status })
    .where(eq(feeInvoices.id, invoiceId));

  return { paid, status, balance: Math.max(0, invoice.amount - paid) };
}

/** Next sequential invoice number, e.g. INV-2026-00042. */
export async function nextInvoiceNo() {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(feeInvoices);
  return `INV-${new Date().getFullYear()}-${String(Number(row?.n ?? 0) + 1).padStart(5, "0")}`;
}
