/**
 * DETECH — database schema (Drizzle ORM / SQLite dialect).
 *
 * Portability: every "enum" column is a TEXT column constrained in the app
 * layer by the union types in `src/lib/enums.ts`. That keeps this schema
 * valid on SQLite (dev), MySQL and PostgreSQL (prod) with only the import
 * line changing (`drizzle-orm/sqlite-core` -> `drizzle-orm/pg-core`).
 */
import { randomUUID } from "node:crypto";
import { relations } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/** Short, URL-safe, collision-resistant primary key. */
export const createId = () => randomUUID().replace(/-/g, "").slice(0, 24);

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => createId());

const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date());

const updatedAt = () =>
  integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date());

/* ───────────────────────── Identity & access ───────────────────────── */

export const users = sqliteTable(
  "users",
  {
    id: id(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    /** ADMIN | TEACHER | STUDENT | PARENT | ACCOUNTANT | LIBRARIAN */
    role: text("role").notNull().default("STUDENT"),
    phone: text("phone"),
    avatarUrl: text("avatar_url"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    mfaEnabled: integer("mfa_enabled", { mode: "boolean" })
      .notNull()
      .default(false),
    mfaSecret: text("mfa_secret"),
    lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("users_role_idx").on(t.role)],
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenId: text("token_id").notNull().unique(),
    userAgent: text("user_agent"),
    ip: text("ip"),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    revokedAt: integer("revoked_at", { mode: "timestamp" }),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/* ──────────────────────────── People ──────────────────────────── */

export const teachers = sqliteTable("teachers", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  staffNo: text("staff_no").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  qualification: text("qualification"),
  specialization: text("specialization"),
  phone: text("phone"),
  address: text("address"),
  /** FULL_TIME | PART_TIME | CONTRACT */
  employmentType: text("employment_type").notNull().default("FULL_TIME"),
  hireDate: integer("hire_date", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const classrooms = sqliteTable(
  "classrooms",
  {
    id: id(),
    name: text("name").notNull(),
    section: text("section").notNull().default("A"),
    level: integer("level").notNull().default(1),
    capacity: integer("capacity").notNull().default(40),
    room: text("room"),
    academicYear: text("academic_year").notNull().default("2025/2026"),
    classTeacherId: text("class_teacher_id").references(() => teachers.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("classrooms_name_section_year_idx").on(
      t.name,
      t.section,
      t.academicYear,
    ),
  ],
);

export const students = sqliteTable(
  "students",
  {
    id: id(),
    userId: text("user_id")
      .unique()
      .references(() => users.id, { onDelete: "set null" }),
    admissionNo: text("admission_no").notNull().unique(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    dateOfBirth: integer("date_of_birth", { mode: "timestamp" }),
    /** MALE | FEMALE | OTHER */
    gender: text("gender").notNull().default("OTHER"),
    address: text("address"),
    phone: text("phone"),
    bloodGroup: text("blood_group"),
    photoUrl: text("photo_url"),
    /** ACTIVE | GRADUATED | SUSPENDED | WITHDRAWN */
    status: text("status").notNull().default("ACTIVE"),
    admissionDate: integer("admission_date", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    classroomId: text("classroom_id").references(() => classrooms.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("students_classroom_idx").on(t.classroomId),
    index("students_status_idx").on(t.status),
  ],
);

export const guardians = sqliteTable("guardians", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  address: text("address"),
  occupation: text("occupation"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const guardianStudents = sqliteTable(
  "guardian_students",
  {
    id: id(),
    guardianId: text("guardian_id")
      .notNull()
      .references(() => guardians.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    /** FATHER | MOTHER | GUARDIAN | OTHER */
    relation: text("relation").notNull().default("GUARDIAN"),
    isPrimary: integer("is_primary", { mode: "boolean" })
      .notNull()
      .default(false),
  },
  (t) => [uniqueIndex("guardian_student_idx").on(t.guardianId, t.studentId)],
);

/* ──────────────────────── Academic structure ──────────────────────── */

export const subjects = sqliteTable("subjects", {
  id: id(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  creditHours: integer("credit_hours").notNull().default(1),
  isElective: integer("is_elective", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const classSubjects = sqliteTable(
  "class_subjects",
  {
    id: id(),
    classroomId: text("classroom_id")
      .notNull()
      .references(() => classrooms.id, { onDelete: "cascade" }),
    subjectId: text("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    teacherId: text("teacher_id").references(() => teachers.id, {
      onDelete: "set null",
    }),
  },
  (t) => [uniqueIndex("class_subject_idx").on(t.classroomId, t.subjectId)],
);

/* ──────────────────────────── Attendance ──────────────────────────── */

export const attendance = sqliteTable(
  "attendance",
  {
    id: id(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    classroomId: text("classroom_id")
      .notNull()
      .references(() => classrooms.id, { onDelete: "cascade" }),
    /** Stored as a YYYY-MM-DD string so a day is unambiguous across zones. */
    date: text("date").notNull(),
    /** PRESENT | ABSENT | LATE | EXCUSED */
    status: text("status").notNull().default("PRESENT"),
    note: text("note"),
    markedById: text("marked_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("attendance_student_date_idx").on(t.studentId, t.date),
    index("attendance_class_date_idx").on(t.classroomId, t.date),
  ],
);

/* ──────────────────────────── Timetable ──────────────────────────── */

export const timetableSlots = sqliteTable(
  "timetable_slots",
  {
    id: id(),
    classroomId: text("classroom_id")
      .notNull()
      .references(() => classrooms.id, { onDelete: "cascade" }),
    subjectId: text("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    teacherId: text("teacher_id").references(() => teachers.id, {
      onDelete: "set null",
    }),
    /** 1 = Monday … 7 = Sunday */
    dayOfWeek: integer("day_of_week").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    room: text("room"),
  },
  (t) => [
    index("timetable_class_day_idx").on(t.classroomId, t.dayOfWeek),
    index("timetable_teacher_day_idx").on(t.teacherId, t.dayOfWeek),
  ],
);

/* ──────────────────────── Exams & grading ──────────────────────── */

export const exams = sqliteTable("exams", {
  id: id(),
  name: text("name").notNull(),
  /** TERM_1 | TERM_2 | TERM_3 */
  term: text("term").notNull().default("TERM_1"),
  academicYear: text("academic_year").notNull().default("2025/2026"),
  /** QUIZ | MIDTERM | FINAL | ASSESSMENT */
  type: text("type").notNull().default("FINAL"),
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }).notNull(),
  isPublished: integer("is_published", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const examResults = sqliteTable(
  "exam_results",
  {
    id: id(),
    examId: text("exam_id")
      .notNull()
      .references(() => exams.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    subjectId: text("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    score: real("score").notNull(),
    maxScore: real("max_score").notNull().default(100),
    grade: text("grade"),
    remark: text("remark"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("exam_result_idx").on(t.examId, t.studentId, t.subjectId),
    index("exam_result_student_idx").on(t.studentId),
  ],
);

/* ────────────────────────── Fee management ────────────────────────── */

export const feeInvoices = sqliteTable(
  "fee_invoices",
  {
    id: id(),
    invoiceNo: text("invoice_no").notNull().unique(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    term: text("term").notNull().default("TERM_1"),
    academicYear: text("academic_year").notNull().default("2025/2026"),
    amount: real("amount").notNull(),
    /** UNPAID | PARTIAL | PAID | OVERDUE | WAIVED */
    status: text("status").notNull().default("UNPAID"),
    dueDate: integer("due_date", { mode: "timestamp" }).notNull(),
    description: text("description"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("invoice_student_idx").on(t.studentId),
    index("invoice_status_idx").on(t.status),
  ],
);

export const payments = sqliteTable(
  "payments",
  {
    id: id(),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => feeInvoices.id, { onDelete: "cascade" }),
    amount: real("amount").notNull(),
    /** CASH | CARD | BANK_TRANSFER | MOBILE_MONEY | STRIPE | PAYPAL */
    method: text("method").notNull().default("CASH"),
    reference: text("reference"),
    paidAt: integer("paid_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    recordedBy: text("recorded_by"),
  },
  (t) => [index("payment_invoice_idx").on(t.invoiceId)],
);

/* ──────────────────────── Library management ──────────────────────── */

export const books = sqliteTable("books", {
  id: id(),
  isbn: text("isbn").notNull().unique(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  category: text("category"),
  publisher: text("publisher"),
  publishedYear: integer("published_year"),
  totalCopies: integer("total_copies").notNull().default(1),
  shelf: text("shelf"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const bookLoans = sqliteTable(
  "book_loans",
  {
    id: id(),
    bookId: text("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    issuedAt: integer("issued_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    dueAt: integer("due_at", { mode: "timestamp" }).notNull(),
    returnedAt: integer("returned_at", { mode: "timestamp" }),
    fine: real("fine").notNull().default(0),
  },
  (t) => [
    index("loan_book_idx").on(t.bookId),
    index("loan_student_idx").on(t.studentId),
  ],
);

/* ─────────────────────── Transport management ─────────────────────── */

export const vehicles = sqliteTable("vehicles", {
  id: id(),
  regNumber: text("reg_number").notNull().unique(),
  model: text("model").notNull(),
  capacity: integer("capacity").notNull().default(30),
  driverName: text("driver_name").notNull(),
  driverPhone: text("driver_phone"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
});

export const transportRoutes = sqliteTable("transport_routes", {
  id: id(),
  name: text("name").notNull(),
  /** Comma-separated list of stops */
  stops: text("stops").notNull().default(""),
  fare: real("fare").notNull().default(0),
  vehicleId: text("vehicle_id").references(() => vehicles.id, {
    onDelete: "set null",
  }),
});

export const transportAssignments = sqliteTable(
  "transport_assignments",
  {
    id: id(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    routeId: text("route_id")
      .notNull()
      .references(() => transportRoutes.id, { onDelete: "cascade" }),
    pickupStop: text("pickup_stop"),
  },
  (t) => [uniqueIndex("transport_assignment_idx").on(t.studentId, t.routeId)],
);

/* ───────────────── Assignments / homework / e-learning ───────────────── */

export const assignments = sqliteTable(
  "assignments",
  {
    id: id(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    classroomId: text("classroom_id")
      .notNull()
      .references(() => classrooms.id, { onDelete: "cascade" }),
    subjectId: text("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    teacherId: text("teacher_id").references(() => teachers.id, {
      onDelete: "set null",
    }),
    dueDate: integer("due_date", { mode: "timestamp" }).notNull(),
    maxScore: real("max_score").notNull().default(100),
    attachmentUrl: text("attachment_url"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("assignment_class_idx").on(t.classroomId)],
);

export const submissions = sqliteTable(
  "submissions",
  {
    id: id(),
    assignmentId: text("assignment_id")
      .notNull()
      .references(() => assignments.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    content: text("content"),
    fileUrl: text("file_url"),
    submittedAt: integer("submitted_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    score: real("score"),
    feedback: text("feedback"),
    gradedAt: integer("graded_at", { mode: "timestamp" }),
  },
  (t) => [uniqueIndex("submission_idx").on(t.assignmentId, t.studentId)],
);

/* ──────────────────── Communication & notifications ──────────────────── */

export const messages = sqliteTable(
  "messages",
  {
    id: id(),
    senderId: text("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recipientId: text("recipient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    readAt: integer("read_at", { mode: "timestamp" }),
    createdAt: createdAt(),
  },
  (t) => [index("message_recipient_idx").on(t.recipientId, t.readAt)],
);

export const announcements = sqliteTable(
  "announcements",
  {
    id: id(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    /** ALL | ADMIN | TEACHER | STUDENT | PARENT */
    audience: text("audience").notNull().default("ALL"),
    authorId: text("author_id").references(() => users.id, {
      onDelete: "set null",
    }),
    isPinned: integer("is_pinned", { mode: "boolean" }).notNull().default(false),
    publishedAt: integer("published_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("announcement_audience_idx").on(t.audience, t.publishedAt)],
);

export const notifications = sqliteTable(
  "notifications",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** INFO | SUCCESS | WARNING | ERROR */
    type: text("type").notNull().default("INFO"),
    /** IN_APP | EMAIL | SMS | PUSH */
    channel: text("channel").notNull().default("IN_APP"),
    title: text("title").notNull(),
    body: text("body"),
    link: text("link"),
    readAt: integer("read_at", { mode: "timestamp" }),
    createdAt: createdAt(),
  },
  (t) => [index("notification_user_idx").on(t.userId, t.readAt)],
);

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: id(),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    metadata: text("metadata"),
    ip: text("ip"),
    createdAt: createdAt(),
  },
  (t) => [index("audit_entity_idx").on(t.entity, t.createdAt)],
);

/* ───────────────────────────── Relations ───────────────────────────── */

export const usersRelations = relations(users, ({ one, many }) => ({
  teacher: one(teachers, { fields: [users.id], references: [teachers.userId] }),
  student: one(students, { fields: [users.id], references: [students.userId] }),
  guardian: one(guardians, {
    fields: [users.id],
    references: [guardians.userId],
  }),
  notifications: many(notifications),
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "recipient" }),
}));

export const teachersRelations = relations(teachers, ({ one, many }) => ({
  user: one(users, { fields: [teachers.userId], references: [users.id] }),
  classesLed: many(classrooms),
  classSubjects: many(classSubjects),
  timetableSlots: many(timetableSlots),
  assignments: many(assignments),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, { fields: [students.userId], references: [users.id] }),
  classroom: one(classrooms, {
    fields: [students.classroomId],
    references: [classrooms.id],
  }),
  guardians: many(guardianStudents),
  attendance: many(attendance),
  results: many(examResults),
  invoices: many(feeInvoices),
  loans: many(bookLoans),
  transport: many(transportAssignments),
  submissions: many(submissions),
}));

export const guardiansRelations = relations(guardians, ({ one, many }) => ({
  user: one(users, { fields: [guardians.userId], references: [users.id] }),
  children: many(guardianStudents),
}));

export const guardianStudentsRelations = relations(
  guardianStudents,
  ({ one }) => ({
    guardian: one(guardians, {
      fields: [guardianStudents.guardianId],
      references: [guardians.id],
    }),
    student: one(students, {
      fields: [guardianStudents.studentId],
      references: [students.id],
    }),
  }),
);

export const classroomsRelations = relations(classrooms, ({ one, many }) => ({
  classTeacher: one(teachers, {
    fields: [classrooms.classTeacherId],
    references: [teachers.id],
  }),
  students: many(students),
  classSubjects: many(classSubjects),
  timetableSlots: many(timetableSlots),
  assignments: many(assignments),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  classSubjects: many(classSubjects),
  timetableSlots: many(timetableSlots),
  results: many(examResults),
  assignments: many(assignments),
}));

export const classSubjectsRelations = relations(classSubjects, ({ one }) => ({
  classroom: one(classrooms, {
    fields: [classSubjects.classroomId],
    references: [classrooms.id],
  }),
  subject: one(subjects, {
    fields: [classSubjects.subjectId],
    references: [subjects.id],
  }),
  teacher: one(teachers, {
    fields: [classSubjects.teacherId],
    references: [teachers.id],
  }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  student: one(students, {
    fields: [attendance.studentId],
    references: [students.id],
  }),
  classroom: one(classrooms, {
    fields: [attendance.classroomId],
    references: [classrooms.id],
  }),
}));

export const timetableSlotsRelations = relations(timetableSlots, ({ one }) => ({
  classroom: one(classrooms, {
    fields: [timetableSlots.classroomId],
    references: [classrooms.id],
  }),
  subject: one(subjects, {
    fields: [timetableSlots.subjectId],
    references: [subjects.id],
  }),
  teacher: one(teachers, {
    fields: [timetableSlots.teacherId],
    references: [teachers.id],
  }),
}));

export const examsRelations = relations(exams, ({ many }) => ({
  results: many(examResults),
}));

export const examResultsRelations = relations(examResults, ({ one }) => ({
  exam: one(exams, { fields: [examResults.examId], references: [exams.id] }),
  student: one(students, {
    fields: [examResults.studentId],
    references: [students.id],
  }),
  subject: one(subjects, {
    fields: [examResults.subjectId],
    references: [subjects.id],
  }),
}));

export const feeInvoicesRelations = relations(feeInvoices, ({ one, many }) => ({
  student: one(students, {
    fields: [feeInvoices.studentId],
    references: [students.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(feeInvoices, {
    fields: [payments.invoiceId],
    references: [feeInvoices.id],
  }),
}));

export const booksRelations = relations(books, ({ many }) => ({
  loans: many(bookLoans),
}));

export const bookLoansRelations = relations(bookLoans, ({ one }) => ({
  book: one(books, { fields: [bookLoans.bookId], references: [books.id] }),
  student: one(students, {
    fields: [bookLoans.studentId],
    references: [students.id],
  }),
}));

export const vehiclesRelations = relations(vehicles, ({ many }) => ({
  routes: many(transportRoutes),
}));

export const transportRoutesRelations = relations(
  transportRoutes,
  ({ one, many }) => ({
    vehicle: one(vehicles, {
      fields: [transportRoutes.vehicleId],
      references: [vehicles.id],
    }),
    assignments: many(transportAssignments),
  }),
);

export const transportAssignmentsRelations = relations(
  transportAssignments,
  ({ one }) => ({
    student: one(students, {
      fields: [transportAssignments.studentId],
      references: [students.id],
    }),
    route: one(transportRoutes, {
      fields: [transportAssignments.routeId],
      references: [transportRoutes.id],
    }),
  }),
);

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  classroom: one(classrooms, {
    fields: [assignments.classroomId],
    references: [classrooms.id],
  }),
  subject: one(subjects, {
    fields: [assignments.subjectId],
    references: [subjects.id],
  }),
  teacher: one(teachers, {
    fields: [assignments.teacherId],
    references: [teachers.id],
  }),
  submissions: many(submissions),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  assignment: one(assignments, {
    fields: [submissions.assignmentId],
    references: [assignments.id],
  }),
  student: one(students, {
    fields: [submissions.studentId],
    references: [students.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  recipient: one(users, {
    fields: [messages.recipientId],
    references: [users.id],
    relationName: "recipient",
  }),
}));

export const announcementsRelations = relations(announcements, ({ one }) => ({
  author: one(users, {
    fields: [announcements.authorId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

/* ───────────────────────── Inferred TS types ───────────────────────── */

export type User = typeof users.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Teacher = typeof teachers.$inferSelect;
export type Guardian = typeof guardians.$inferSelect;
export type Classroom = typeof classrooms.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type TimetableSlot = typeof timetableSlots.$inferSelect;
export type Exam = typeof exams.$inferSelect;
export type ExamResult = typeof examResults.$inferSelect;
export type FeeInvoice = typeof feeInvoices.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Book = typeof books.$inferSelect;
export type BookLoan = typeof bookLoans.$inferSelect;
export type Vehicle = typeof vehicles.$inferSelect;
export type TransportRoute = typeof transportRoutes.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
export type Submission = typeof submissions.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
