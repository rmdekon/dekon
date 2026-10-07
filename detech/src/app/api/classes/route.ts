import type { NextRequest } from "next/server";
import { asc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { classrooms, students, teachers } from "@/db/schema";
import { handler, ok } from "@/lib/api";
import { requireRole, requireSession } from "@/lib/auth";
import { classroomCreateSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  await requireSession();
  const rows = await db
    .select({
      id: classrooms.id,
      name: classrooms.name,
      section: classrooms.section,
      level: classrooms.level,
      capacity: classrooms.capacity,
      room: classrooms.room,
      academicYear: classrooms.academicYear,
      headcount: sql<number>`count(${students.id})`,
      classTeacher: {
        id: teachers.id,
        firstName: teachers.firstName,
        lastName: teachers.lastName,
      },
    })
    .from(classrooms)
    .leftJoin(students, eq(students.classroomId, classrooms.id))
    .leftJoin(teachers, eq(teachers.id, classrooms.classTeacherId))
    .groupBy(classrooms.id)
    .orderBy(asc(classrooms.level), asc(classrooms.section));

  return ok({ items: rows, total: rows.length });
});

export const POST = handler(async (request: NextRequest) => {
  await requireRole("ADMIN");
  const data = classroomCreateSchema.parse(await request.json().catch(() => ({})));
  const [classroom] = await db.insert(classrooms).values(data).returning();
  return ok({ classroom }, { status: 201 });
});
