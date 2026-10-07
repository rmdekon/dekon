import type { NextRequest } from "next/server";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { teachers, users } from "@/db/schema";
import { handler, ok } from "@/lib/api";
import { hashPassword, requireRole, requireSession } from "@/lib/auth";
import { teacherCreateSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  await requireSession();
  const rows = await db
    .select({
      id: teachers.id,
      staffNo: teachers.staffNo,
      firstName: teachers.firstName,
      lastName: teachers.lastName,
      specialization: teachers.specialization,
      qualification: teachers.qualification,
      employmentType: teachers.employmentType,
      phone: teachers.phone,
      isActive: teachers.isActive,
      email: users.email,
    })
    .from(teachers)
    .innerJoin(users, eq(users.id, teachers.userId))
    .orderBy(asc(teachers.lastName));

  return ok({ items: rows, total: rows.length });
});

export const POST = handler(async (request: NextRequest) => {
  await requireRole("ADMIN");
  const data = teacherCreateSchema.parse(await request.json().catch(() => ({})));

  const [account] = await db
    .insert(users)
    .values({
      email: data.email.toLowerCase(),
      name: `${data.firstName} ${data.lastName}`,
      passwordHash: await hashPassword(data.password ?? "Password@123"),
      role: "TEACHER",
      phone: data.phone,
    })
    .returning();

  const [teacher] = await db
    .insert(teachers)
    .values({
      userId: account.id,
      staffNo: data.staffNo,
      firstName: data.firstName,
      lastName: data.lastName,
      qualification: data.qualification,
      specialization: data.specialization,
      phone: data.phone,
      employmentType: data.employmentType,
    })
    .returning();

  return ok({ teacher }, { status: 201 });
});
