import type { NextRequest } from "next/server";

import { recalculateInvoice } from "@/lib/billing";
import { db } from "@/db";
import { auditLogs, payments } from "@/db/schema";
import { handler, ok } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { paymentCreateSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

/** POST /api/fees/payments — record a payment and re-derive invoice status. */
export const POST = handler(async (request: NextRequest) => {
  const user = await requireRole("ADMIN", "ACCOUNTANT");
  const data = paymentCreateSchema.parse(await request.json().catch(() => ({})));

  const [payment] = await db
    .insert(payments)
    .values({ ...data, recordedBy: user.id })
    .returning();

  await recalculateInvoice(data.invoiceId);

  await db.insert(auditLogs).values({
    userId: user.id,
    action: "RECORD_PAYMENT",
    entity: "payments",
    entityId: payment.id,
    metadata: JSON.stringify({ amount: data.amount, method: data.method }),
  });

  return ok({ payment }, { status: 201 });
});
