import type { NextRequest } from "next/server";
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { attendance, auditLogs, students } from "@/db/schema";
import { fail, handler, ok } from "@/lib/api";
import { requireRole, requireSession } from "@/lib/auth";
import { getAttendanceTrend } from "@/lib/queries";
import { attendanceMarkSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

/** GET /api/attendance?classroomId=&date=YYYY-MM-DD  (or ?trend=14) */
export const GET = handler(async (request: NextRequest) => {
  await requireSession();
  const url = new URL(request.url);

  const trend = url.searchParams.get("trend");
  if (trend) return ok({ trend: await getAttendanceTrend(Number(trend) || 14) });

  const classroomId = url.searchParams.get("classroomId");
  const date = url.searchParams.get("date");
  if (!classroomId || !date) {
    return fail("classroomId and date query parameters are required", 400);
  }

  const rows = await db
    .select({
      studentId: students.id,
      admissionNo: students.admissionNo,
      firstName: students.firstName,
      lastName: students.lastName,
      status: attendance.status,
      note: attendance.note,
    })
    .from(students)
    .leftJoin(
      attendance,
      and(eq(attendance.studentId, students.id), eq(attendance.date, date)),
    )
    .where(eq(students.classroomId, classroomId))
    .orderBy(asc(students.lastName));

  return ok({ classroomId, date, items: rows });
});

/** POST /api/attendance — bulk upsert a class register. */
export const POST = handler(async (request: NextRequest) => {
  const user = await requireRole("ADMIN", "TEACHER");
  const data = attendanceMarkSchema.parse(await request.json().catch(() => ({})));

  for (const entry of data.entries) {
    await db
      .insert(attendance)
      .values({
        studentId: entry.studentId,
        classroomId: data.classroomId,
        date: data.date,
        status: entry.status,
        note: entry.note,
        markedById: user.id,
      })
      .onConflictDoUpdate({
        target: [attendance.studentId, attendance.date],
        set: { status: entry.status, note: entry.note, markedById: user.id },
      });
  }

  await db.insert(auditLogs).values({
    userId: user.id,
    action: "MARK_ATTENDANCE",
    entity: "attendance",
    entityId: data.classroomId,
    metadata: JSON.stringify({ date: data.date, count: data.entries.length }),
  });

  return ok({ marked: data.entries.length, date: data.date });
});
