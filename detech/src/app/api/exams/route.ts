import type { NextRequest } from "next/server";
import { desc } from "drizzle-orm";

import { db } from "@/db";
import { exams } from "@/db/schema";
import { handler, ok } from "@/lib/api";
import { requireRole, requireSession } from "@/lib/auth";
import { getGradeDistribution, getSubjectAverages } from "@/lib/queries";
import { examCreateSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  await requireSession();
  const [items, grades, averages] = await Promise.all([
    db.select().from(exams).orderBy(desc(exams.startDate)),
    getGradeDistribution(),
    getSubjectAverages(),
  ]);
  return ok({ items, analytics: { grades, averages } });
});

export const POST = handler(async (request: NextRequest) => {
  await requireRole("ADMIN", "TEACHER");
  const data = examCreateSchema.parse(await request.json().catch(() => ({})));
  const [exam] = await db.insert(exams).values(data).returning();
  return ok({ exam }, { status: 201 });
});
