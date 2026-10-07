import { z } from "zod";

import {
  ATTENDANCE_STATUSES,
  AUDIENCES,
  EXAM_TYPES,
  GENDERS,
  INVOICE_STATUSES,
  PAYMENT_METHODS,
  ROLES,
  STUDENT_STATUSES,
  TERMS,
} from "@/lib/enums";

const dateish = z.union([z.string(), z.number(), z.date()]).transform((v) => {
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date");
  return d;
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const userCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2),
  role: z.enum(ROLES),
  phone: z.string().optional(),
});

export const studentCreateSchema = z.object({
  admissionNo: z.string().min(3),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  dateOfBirth: dateish.optional(),
  gender: z.enum(GENDERS).default("OTHER"),
  address: z.string().optional(),
  phone: z.string().optional(),
  bloodGroup: z.string().optional(),
  status: z.enum(STUDENT_STATUSES).default("ACTIVE"),
  classroomId: z.string().optional(),
});

export const studentUpdateSchema = studentCreateSchema.partial();

export const teacherCreateSchema = z.object({
  staffNo: z.string().min(2),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  phone: z.string().optional(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]).default("FULL_TIME"),
});

export const classroomCreateSchema = z.object({
  name: z.string().min(1),
  section: z.string().min(1).default("A"),
  level: z.coerce.number().int().min(1).max(20).default(1),
  capacity: z.coerce.number().int().min(1).max(200).default(40),
  room: z.string().optional(),
  academicYear: z.string().default("2025/2026"),
  classTeacherId: z.string().optional(),
});

export const subjectCreateSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  description: z.string().optional(),
  creditHours: z.coerce.number().int().min(0).max(12).default(1),
  isElective: z.coerce.boolean().default(false),
});

export const attendanceMarkSchema = z.object({
  classroomId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  entries: z
    .array(
      z.object({
        studentId: z.string().min(1),
        status: z.enum(ATTENDANCE_STATUSES),
        note: z.string().optional(),
      }),
    )
    .min(1),
});

export const examCreateSchema = z.object({
  name: z.string().min(2),
  term: z.enum(TERMS).default("TERM_1"),
  type: z.enum(EXAM_TYPES).default("FINAL"),
  academicYear: z.string().default("2025/2026"),
  startDate: dateish,
  endDate: dateish,
  isPublished: z.coerce.boolean().default(false),
});

export const resultCreateSchema = z.object({
  examId: z.string().min(1),
  studentId: z.string().min(1),
  subjectId: z.string().min(1),
  score: z.coerce.number().min(0),
  maxScore: z.coerce.number().min(1).default(100),
});

export const invoiceCreateSchema = z.object({
  studentId: z.string().min(1),
  term: z.enum(TERMS).default("TERM_1"),
  academicYear: z.string().default("2025/2026"),
  amount: z.coerce.number().positive(),
  dueDate: dateish,
  description: z.string().optional(),
  status: z.enum(INVOICE_STATUSES).default("UNPAID"),
});

export const paymentCreateSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.coerce.number().positive(),
  method: z.enum(PAYMENT_METHODS).default("CASH"),
  reference: z.string().optional(),
});

export const bookCreateSchema = z.object({
  isbn: z.string().min(5),
  title: z.string().min(1),
  author: z.string().min(1),
  category: z.string().optional(),
  publisher: z.string().optional(),
  publishedYear: z.coerce.number().int().optional(),
  totalCopies: z.coerce.number().int().min(1).default(1),
  shelf: z.string().optional(),
});

export const announcementCreateSchema = z.object({
  title: z.string().min(3),
  body: z.string().min(3),
  audience: z.enum(AUDIENCES).default("ALL"),
  isPinned: z.coerce.boolean().default(false),
});

export const messageCreateSchema = z.object({
  recipientId: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
});

export const assignmentCreateSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(3),
  classroomId: z.string().min(1),
  subjectId: z.string().min(1),
  dueDate: dateish,
  maxScore: z.coerce.number().min(1).default(100),
});
