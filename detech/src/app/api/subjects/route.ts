import type { NextRequest } from "next/server";
import { asc } from "drizzle-orm";

import { db } from "@/db";
import { subjects } from "@/db/schema";
import { handler, ok } from "@/lib/api";
import { requireRole, requireSession } from "@/lib/auth";
import { subjectCreateSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  await requireSession();
  const rows = await db.select().from(subjects).orderBy(asc(subjects.code));
  return ok({ items: rows, total: rows.length });
});

export const POST = handler(async (request: NextRequest) => {
  await requireRole("ADMIN");
  const data = subjectCreateSchema.parse(await request.json().catch(() => ({})));
  const [subject] = await db.insert(subjects).values(data).returning();
  return ok({ subject }, { status: 201 });
});
