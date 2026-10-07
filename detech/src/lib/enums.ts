/**
 * Application-level "enums".
 *
 * Stored as TEXT in the database so the schema stays portable across
 * SQLite / MySQL / PostgreSQL, but fully type-checked here and validated
 * at the API boundary by the Zod schemas in `src/lib/validators.ts`.
 */

export const ROLES = [
  "ADMIN",
  "TEACHER",
  "STUDENT",
  "PARENT",
  "ACCOUNTANT",
  "LIBRARIAN",
] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrator",
  TEACHER: "Teacher",
  STUDENT: "Student",
  PARENT: "Parent / Guardian",
  ACCOUNTANT: "Accountant",
  LIBRARIAN: "Librarian",
};

export const ATTENDANCE_STATUSES = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "EXCUSED",
] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const STUDENT_STATUSES = [
  "ACTIVE",
  "GRADUATED",
  "SUSPENDED",
  "WITHDRAWN",
] as const;
export type StudentStatus = (typeof STUDENT_STATUSES)[number];

export const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;
export type Gender = (typeof GENDERS)[number];

export const TERMS = ["TERM_1", "TERM_2", "TERM_3"] as const;
export type Term = (typeof TERMS)[number];

export const TERM_LABELS: Record<Term, string> = {
  TERM_1: "Term 1",
  TERM_2: "Term 2",
  TERM_3: "Term 3",
};

export const EXAM_TYPES = ["QUIZ", "MIDTERM", "FINAL", "ASSESSMENT"] as const;
export type ExamType = (typeof EXAM_TYPES)[number];

export const INVOICE_STATUSES = [
  "UNPAID",
  "PARTIAL",
  "PAID",
  "OVERDUE",
  "WAIVED",
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const PAYMENT_METHODS = [
  "CASH",
  "CARD",
  "BANK_TRANSFER",
  "MOBILE_MONEY",
  "STRIPE",
  "PAYPAL",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const AUDIENCES = [
  "ALL",
  "ADMIN",
  "TEACHER",
  "STUDENT",
  "PARENT",
] as const;
export type Audience = (typeof AUDIENCES)[number];

export const NOTIFICATION_CHANNELS = [
  "IN_APP",
  "EMAIL",
  "SMS",
  "PUSH",
] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

/** Converts a raw percentage into a letter grade + remark. */
export function toGrade(percentage: number): { grade: string; remark: string } {
  if (percentage >= 80) return { grade: "A", remark: "Excellent" };
  if (percentage >= 70) return { grade: "B", remark: "Very good" };
  if (percentage >= 60) return { grade: "C", remark: "Good" };
  if (percentage >= 50) return { grade: "D", remark: "Credit" };
  if (percentage >= 40) return { grade: "E", remark: "Pass" };
  return { grade: "F", remark: "Fail" };
}
