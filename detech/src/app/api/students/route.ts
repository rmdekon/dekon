import type { NextRequest } from "next/server";
import { and, asc, eq, like, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { classrooms, students, users } from "@/db/schema";
import { handler, ok, pagination } from "@/lib/api";
import { hashPassword, requireRole, requireSession } from "@/lib/auth";
import { studentCreateSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

/**
 * GET /api/students?q=&classroomId=&status=&page=&pageSize=
 */
export const GET = handler(async (request: NextRequest) => {
  await requireSession();
  const url = new URL(request.url);
  const { page, pageSize, offset } = pagination(url);

  const q = url.searchParams.get("q")?.trim();
  const classroomId = url.searchParams.get("classroomId");
  const status = url.searchParams.get("status");

  const filters = [
    q
      ? or(
          like(students.firstName, `%${q}%`),
          like(students.lastName, `%${q}%`),
          like(students.admissionNo, `%${q}%`),
        )
      : undefined,
    classroomId ? eq(students.classroomId, classroomId) : undefined,
    status ? eq(students.status, status) : undefined,
  ].filter(Boolean);

  const where = filters.length ? and(...filters) : undefined;

  const [rows, [countRow]] = await Promise.all([
    db
      .select({
        id: students.id,
        admissionNo: students.admissionNo,
        firstName: students.firstName,
        lastName: students.lastName,
        gender: students.gender,
        status: students.status,
        phone: students.phone,
        admissionDate: students.admissionDate,
        classroom: {
          id: classrooms.id,
          name: classrooms.name,
          section: classrooms.section,
        },
      })
      .from(students)
      .leftJoin(classrooms, eq(classrooms.id, students.classroomId))
      .where(where)
      .orderBy(asc(students.lastName), asc(students.firstName))
      .limit(pageSize)
      .offset(offset),
    db.select({ n: sql<number>`count(*)` }).from(students).where(where),
  ]);

  const total = Number(countRow?.n ?? 0);
  return ok({
    items: rows,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
});

/** POST /api/students — admin only. Optionally creates a linked login. */
export const POST = handler(async (request: NextRequest) => {
  await requireRole("ADMIN");
  const body = await request.json().catch(() => ({}));
  const data = studentCreateSchema.parse(body);

  let userId: string | undefined;
  if (data.email) {
    const [account] = await db
      .insert(users)
      .values({
        email: data.email.toLowerCase(),
        name: `${data.firstName} ${data.lastName}`,
        passwordHash: await hashPassword("Password@123"),
        role: "STUDENT",
        phone: data.phone,
      })
      .returning();
    userId = account.id;
  }

  const [student] = await db
    .insert(students)
    .values({
      userId,
      admissionNo: data.admissionNo,
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
    .returning();

  return ok({ student }, { status: 201 });
});
