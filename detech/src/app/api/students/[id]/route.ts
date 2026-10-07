import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { classrooms, students } from "@/db/schema";
import { fail, handler, ok } from "@/lib/api";
import { requireRole, requireSession } from "@/lib/auth";
import { getStudentSnapshot } from "@/lib/queries";
import { studentUpdateSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler(async (_req: NextRequest, ctx: Ctx) => {
  await requireSession();
  const { id } = await ctx.params;

  const [row] = await db
    .select({ student: students, classroom: classrooms })
    .from(students)
    .leftJoin(classrooms, eq(classrooms.id, students.classroomId))
    .where(eq(students.id, id))
    .limit(1);

  if (!row) return fail("Student not found", 404);

  const snapshot = await getStudentSnapshot(id);
  return ok({ ...row, snapshot });
});

export const PATCH = handler(async (request: NextRequest, ctx: Ctx) => {
  await requireRole("ADMIN");
  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  const data = studentUpdateSchema.parse(body);

  const [updated] = await db
    .update(students)
    .set({
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      address: data.address,
      phone: data.phone,
      bloodGroup: data.bloodGroup,
      status: data.status,
      classroomId: data.classroomId,
    })
    .where(eq(students.id, id))
    .returning();

  if (!updated) return fail("Student not found", 404);
  return ok({ student: updated });
});

export const DELETE = handler(async (_req: NextRequest, ctx: Ctx) => {
  await requireRole("ADMIN");
  const { id } = await ctx.params;
  const [deleted] = await db
    .delete(students)
    .where(eq(students.id, id))
    .returning({ id: students.id });

  if (!deleted) return fail("Student not found", 404);
  return ok({ deleted: deleted.id });
});
