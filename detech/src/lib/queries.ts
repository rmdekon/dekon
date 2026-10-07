import "server-only";

import { and, asc, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  announcements,
  assignments,
  attendance,
  bookLoans,
  books,
  classrooms,
  examResults,
  exams,
  feeInvoices,
  guardianStudents,
  guardians,
  payments,
  students,
  subjects,
  teachers,
  transportAssignments,
  users,
} from "@/db/schema";
import { toDateKey } from "@/lib/utils";

/* ────────────────────────── Headline counters ────────────────────────── */

export async function getSchoolStats() {
  const [[studentCount], [teacherCount], [classCount], [subjectCount], [guardianCount]] =
    await Promise.all([
      db
        .select({ n: sql<number>`count(*)` })
        .from(students)
        .where(eq(students.status, "ACTIVE")),
      db
        .select({ n: sql<number>`count(*)` })
        .from(teachers)
        .where(eq(teachers.isActive, true)),
      db.select({ n: sql<number>`count(*)` }).from(classrooms),
      db.select({ n: sql<number>`count(*)` }).from(subjects),
      db.select({ n: sql<number>`count(*)` }).from(guardians),
    ]);

  return {
    students: Number(studentCount?.n ?? 0),
    teachers: Number(teacherCount?.n ?? 0),
    classes: Number(classCount?.n ?? 0),
    subjects: Number(subjectCount?.n ?? 0),
    guardians: Number(guardianCount?.n ?? 0),
  };
}

/* ───────────────────────────── Attendance ───────────────────────────── */

export type AttendanceDay = {
  date: string;
  total: number;
  present: number;
  late: number;
  absent: number;
  excused: number;
  rate: number;
};

export async function getAttendanceTrend(days = 14): Promise<AttendanceDay[]> {
  const rows = await db
    .select({
      date: attendance.date,
      total: sql<number>`count(*)`,
      present: sql<number>`sum(case when ${attendance.status} = 'PRESENT' then 1 else 0 end)`,
      late: sql<number>`sum(case when ${attendance.status} = 'LATE' then 1 else 0 end)`,
      absent: sql<number>`sum(case when ${attendance.status} = 'ABSENT' then 1 else 0 end)`,
      excused: sql<number>`sum(case when ${attendance.status} = 'EXCUSED' then 1 else 0 end)`,
    })
    .from(attendance)
    .groupBy(attendance.date)
    .orderBy(desc(attendance.date))
    .limit(days);

  return rows
    .map((r) => {
      const total = Number(r.total);
      const present = Number(r.present);
      const late = Number(r.late);
      return {
        date: r.date,
        total,
        present,
        late,
        absent: Number(r.absent),
        excused: Number(r.excused),
        rate: total ? Math.round(((present + late) / total) * 1000) / 10 : 0,
      };
    })
    .reverse();
}

export async function getTodayAttendance() {
  const today = toDateKey();
  const [row] = await db
    .select({
      total: sql<number>`count(*)`,
      present: sql<number>`sum(case when ${attendance.status} in ('PRESENT','LATE') then 1 else 0 end)`,
    })
    .from(attendance)
    .where(eq(attendance.date, today));

  const total = Number(row?.total ?? 0);
  const present = Number(row?.present ?? 0);
  return {
    date: today,
    total,
    present,
    rate: total ? Math.round((present / total) * 1000) / 10 : 0,
  };
}

export async function getAttendanceBreakdown(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db
    .select({ status: attendance.status, n: sql<number>`count(*)` })
    .from(attendance)
    .where(gte(attendance.date, toDateKey(since)))
    .groupBy(attendance.status);

  const map = Object.fromEntries(rows.map((r) => [r.status, Number(r.n)]));
  return [
    { label: "Present", value: map.PRESENT ?? 0 },
    { label: "Late", value: map.LATE ?? 0 },
    { label: "Absent", value: map.ABSENT ?? 0 },
    { label: "Excused", value: map.EXCUSED ?? 0 },
  ];
}

/* ──────────────────────────────── Fees ──────────────────────────────── */

export async function getFinanceSummary() {
  const [[billedRow], [collectedRow], statusRows] = await Promise.all([
    db
      .select({ v: sql<number>`coalesce(sum(${feeInvoices.amount}), 0)` })
      .from(feeInvoices),
    db
      .select({ v: sql<number>`coalesce(sum(${payments.amount}), 0)` })
      .from(payments),
    db
      .select({ status: feeInvoices.status, n: sql<number>`count(*)` })
      .from(feeInvoices)
      .groupBy(feeInvoices.status),
  ]);

  const billed = Number(billedRow?.v ?? 0);
  const collected = Number(collectedRow?.v ?? 0);
  const byStatus = Object.fromEntries(
    statusRows.map((r) => [r.status, Number(r.n)]),
  );

  return {
    billed,
    collected,
    outstanding: Math.max(0, billed - collected),
    collectionRate: billed ? Math.round((collected / billed) * 1000) / 10 : 0,
    byStatus,
    overdueCount: byStatus.OVERDUE ?? 0,
    unpaidCount: (byStatus.UNPAID ?? 0) + (byStatus.PARTIAL ?? 0),
  };
}

export async function getMonthlyCollections(months = 6) {
  const rows = await db
    .select({
      month: sql<string>`strftime('%Y-%m', datetime(${payments.paidAt} / 1000, 'unixepoch'))`,
      total: sql<number>`coalesce(sum(${payments.amount}), 0)`,
    })
    .from(payments)
    .groupBy(sql`1`)
    .orderBy(sql`1 desc`)
    .limit(months);

  return rows
    .map((r) => ({
      label: new Date(`${r.month}-01T00:00:00`).toLocaleDateString("en-GB", {
        month: "short",
      }),
      value: Math.round(Number(r.total)),
    }))
    .reverse();
}

/* ──────────────────────────── Academics ──────────────────────────── */

export async function getGradeDistribution() {
  const rows = await db
    .select({ grade: examResults.grade, n: sql<number>`count(*)` })
    .from(examResults)
    .groupBy(examResults.grade);

  const map = Object.fromEntries(rows.map((r) => [r.grade ?? "—", Number(r.n)]));
  return ["A", "B", "C", "D", "E", "F"].map((g) => ({
    label: g,
    value: map[g] ?? 0,
  }));
}

export async function getSubjectAverages() {
  const rows = await db
    .select({
      subject: subjects.name,
      avg: sql<number>`avg(${examResults.score})`,
    })
    .from(examResults)
    .innerJoin(subjects, eq(subjects.id, examResults.subjectId))
    .groupBy(subjects.name)
    .orderBy(desc(sql`avg(${examResults.score})`));

  return rows.map((r) => ({
    label: r.subject.split(" ")[0],
    value: Math.round(Number(r.avg) * 10) / 10,
  }));
}

export async function getEnrollmentByClass() {
  const rows = await db
    .select({
      name: classrooms.name,
      section: classrooms.section,
      level: classrooms.level,
      n: sql<number>`count(${students.id})`,
    })
    .from(classrooms)
    .leftJoin(students, eq(students.classroomId, classrooms.id))
    .groupBy(classrooms.id)
    .orderBy(asc(classrooms.level), asc(classrooms.section));

  return rows.map((r) => ({
    label: `${r.name.replace("Grade ", "G")}${r.section}`,
    value: Number(r.n),
  }));
}

export async function getUpcomingExams(limit = 4) {
  return db
    .select()
    .from(exams)
    .where(gte(exams.startDate, new Date()))
    .orderBy(asc(exams.startDate))
    .limit(limit);
}

/* ─────────────────────────── Communication ─────────────────────────── */

export async function getAnnouncementsFor(role: string, limit = 5) {
  return db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      audience: announcements.audience,
      isPinned: announcements.isPinned,
      publishedAt: announcements.publishedAt,
      authorName: users.name,
    })
    .from(announcements)
    .leftJoin(users, eq(users.id, announcements.authorId))
    .where(inArray(announcements.audience, ["ALL", role]))
    .orderBy(desc(announcements.isPinned), desc(announcements.publishedAt))
    .limit(limit);
}

/* ──────────────────────── Role-specific lookups ──────────────────────── */

/** The Student row attached to a user account (STUDENT role). */
export async function getStudentForUser(userId: string) {
  const [row] = await db
    .select()
    .from(students)
    .where(eq(students.userId, userId))
    .limit(1);
  return row ?? null;
}

/** The Teacher row attached to a user account (TEACHER role). */
export async function getTeacherForUser(userId: string) {
  const [row] = await db
    .select()
    .from(teachers)
    .where(eq(teachers.userId, userId))
    .limit(1);
  return row ?? null;
}

/** All children of a PARENT user. */
export async function getChildrenForUser(userId: string) {
  const [guardian] = await db
    .select()
    .from(guardians)
    .where(eq(guardians.userId, userId))
    .limit(1);
  if (!guardian) return [];

  return db
    .select({
      student: students,
      relation: guardianStudents.relation,
      classroom: classrooms,
    })
    .from(guardianStudents)
    .innerJoin(students, eq(students.id, guardianStudents.studentId))
    .leftJoin(classrooms, eq(classrooms.id, students.classroomId))
    .where(eq(guardianStudents.guardianId, guardian.id));
}

/** Per-student attendance + results + fees snapshot. */
export async function getStudentSnapshot(studentId: string) {
  const [[att], [avg], [fees], [paid]] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)`,
        present: sql<number>`sum(case when ${attendance.status} in ('PRESENT','LATE') then 1 else 0 end)`,
      })
      .from(attendance)
      .where(eq(attendance.studentId, studentId)),
    db
      .select({ v: sql<number>`avg(${examResults.score})` })
      .from(examResults)
      .where(eq(examResults.studentId, studentId)),
    db
      .select({ v: sql<number>`coalesce(sum(${feeInvoices.amount}), 0)` })
      .from(feeInvoices)
      .where(eq(feeInvoices.studentId, studentId)),
    db
      .select({ v: sql<number>`coalesce(sum(${payments.amount}), 0)` })
      .from(payments)
      .innerJoin(feeInvoices, eq(feeInvoices.id, payments.invoiceId))
      .where(eq(feeInvoices.studentId, studentId)),
  ]);

  const total = Number(att?.total ?? 0);
  const present = Number(att?.present ?? 0);
  const billed = Number(fees?.v ?? 0);
  const collected = Number(paid?.v ?? 0);

  return {
    attendanceRate: total ? Math.round((present / total) * 1000) / 10 : 0,
    attendanceDays: total,
    averageScore: avg?.v ? Math.round(Number(avg.v) * 10) / 10 : 0,
    feesBilled: billed,
    feesPaid: collected,
    feesOutstanding: Math.max(0, billed - collected),
  };
}

/* ─────────────────────────── Operations ─────────────────────────── */

export async function getLibraryStats() {
  const [[titles], [copies], [onLoan], [overdue]] = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(books),
    db.select({ n: sql<number>`coalesce(sum(${books.totalCopies}), 0)` }).from(books),
    db
      .select({ n: sql<number>`count(*)` })
      .from(bookLoans)
      .where(isNull(bookLoans.returnedAt)),
    db
      .select({ n: sql<number>`count(*)` })
      .from(bookLoans)
      .where(and(isNull(bookLoans.returnedAt), sql`${bookLoans.dueAt} < ${Date.now()}`)),
  ]);

  return {
    titles: Number(titles?.n ?? 0),
    copies: Number(copies?.n ?? 0),
    onLoan: Number(onLoan?.n ?? 0),
    overdue: Number(overdue?.n ?? 0),
  };
}

export async function getTransportStats() {
  const [[riders]] = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(transportAssignments),
  ]);
  return { riders: Number(riders?.n ?? 0) };
}

export async function getPendingAssignments(limit = 5) {
  return db
    .select({
      id: assignments.id,
      title: assignments.title,
      dueDate: assignments.dueDate,
      className: classrooms.name,
      section: classrooms.section,
      subject: subjects.name,
    })
    .from(assignments)
    .innerJoin(classrooms, eq(classrooms.id, assignments.classroomId))
    .innerJoin(subjects, eq(subjects.id, assignments.subjectId))
    .where(gte(assignments.dueDate, new Date()))
    .orderBy(asc(assignments.dueDate))
    .limit(limit);
}
