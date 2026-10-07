"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { attendance, auditLogs } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { ATTENDANCE_STATUSES, type AttendanceStatus } from "@/lib/enums";

export type MarkState = { ok?: boolean; message?: string; error?: string };

/**
 * Saves a whole class register in one transaction-like pass.
 * Re-submitting the same day updates the existing rows (upsert).
 */
export async function markAttendanceAction(
  _prev: MarkState,
  formData: FormData,
): Promise<MarkState> {
  try {
    const user = await requireRole("ADMIN", "TEACHER");

    const classroomId = String(formData.get("classroomId") ?? "");
    const date = String(formData.get("date") ?? "");

    if (!classroomId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return { error: "Pick a class and a valid date first." };
    }

    const entries: { studentId: string; status: AttendanceStatus }[] = [];
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith("status:")) continue;
      const studentId = key.slice("status:".length);
      const status = String(value) as AttendanceStatus;
      if (!ATTENDANCE_STATUSES.includes(status)) continue;
      entries.push({ studentId, status });
    }

    if (!entries.length) return { error: "No students to mark." };

    for (const entry of entries) {
      await db
        .insert(attendance)
        .values({
          studentId: entry.studentId,
          classroomId,
          date,
          status: entry.status,
          markedById: user.id,
        })
        .onConflictDoUpdate({
          target: [attendance.studentId, attendance.date],
          set: { status: entry.status, markedById: user.id },
        });
    }

    await db.insert(auditLogs).values({
      userId: user.id,
      action: "MARK_ATTENDANCE",
      entity: "attendance",
      entityId: classroomId,
      metadata: JSON.stringify({ date, count: entries.length }),
    });

    revalidatePath("/dashboard/attendance");
    revalidatePath("/dashboard");

    return {
      ok: true,
      message: `Register saved — ${entries.length} students marked for ${date}.`,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not save the register.",
    };
  }
}
