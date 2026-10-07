/**
 * DETECH — database seed.
 *
 *   npm run db:seed     # add demo data
 *   npm run db:reset    # wipe tables first, then seed
 *
 * Creates a complete, believable school so every dashboard, chart and
 * report has something real to display.
 */
import "../lib/load-env";

import bcrypt from "bcryptjs";

import { db, client } from "./index";
import * as t from "./schema";
import { toGrade } from "../lib/enums";

const RESET = process.argv.includes("--reset");

/* ───────────────────────────── helpers ───────────────────────────── */

const pick = <T,>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const chance = (p: number) => Math.random() < p;
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(9, 0, 0, 0);
  return d;
};
const daysAhead = (n: number) => daysAgo(-n);
const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

const FIRST_NAMES = [
  "Ama", "Kwame", "Esi", "Yaw", "Akosua", "Kofi", "Abena", "Kojo", "Adwoa",
  "Kwabena", "Afia", "Kwaku", "Akua", "Yaa", "Fiifi", "Maame", "Nana", "Serwaa",
  "Kusi", "Efua", "Kweku", "Araba", "Mensah", "Adjoa", "Aba", "Kobina", "Nyarko",
  "Dufie", "Ohemaa", "Baaba",
];
const LAST_NAMES = [
  "Mensah", "Owusu", "Boateng", "Asante", "Addo", "Appiah", "Darko", "Frimpong",
  "Osei", "Agyeman", "Antwi", "Amoah", "Baidoo", "Quartey", "Tetteh", "Danso",
  "Sarpong", "Acheampong", "Nkrumah", "Yeboah",
];

const uniqueName = (() => {
  const used = new Set<string>();
  return () => {
    for (let i = 0; i < 500; i++) {
      const first = pick(FIRST_NAMES);
      const last = pick(LAST_NAMES);
      const key = `${first} ${last}`;
      if (!used.has(key)) {
        used.add(key);
        return { first, last };
      }
    }
    const n = used.size;
    return { first: pick(FIRST_NAMES), last: `${pick(LAST_NAMES)}-${n}` };
  };
})();

const TABLES_IN_DELETE_ORDER = [
  "audit_logs", "notifications", "announcements", "messages", "submissions",
  "assignments", "transport_assignments", "transport_routes", "vehicles",
  "book_loans", "books", "payments", "fee_invoices", "exam_results", "exams",
  "timetable_slots", "attendance", "class_subjects", "guardian_students",
  "subjects", "students", "guardians", "classrooms", "teachers", "sessions",
  "users",
];

async function reset() {
  for (const table of TABLES_IN_DELETE_ORDER) {
    await client.execute(`DELETE FROM ${table}`);
  }
  console.log("  ↳ cleared existing rows");
}

/* ─────────────────────────────── seed ─────────────────────────────── */

async function main() {
  console.log("\n🏫  DETECH — seeding database\n");

  if (RESET) {
    console.log("• Resetting…");
    await reset();
  } else {
    const existing = await db.select().from(t.users).limit(1);
    if (existing.length) {
      console.log(
        "✋ Database already contains data. Run `npm run db:reset` to wipe and reseed.\n",
      );
      return;
    }
  }

  // One hash reused for all demo accounts — bcrypt is intentionally slow.
  const demoHash = await bcrypt.hash("Password@123", 10);
  const adminHash = await bcrypt.hash("Admin@123", 10);

  /* ---------------------------- Staff users ---------------------------- */
  console.log("• Users & staff…");

  const [admin] = await db
    .insert(t.users)
    .values({
      email: "admin@detech.school",
      passwordHash: adminHash,
      name: "Sarah Mensah",
      role: "ADMIN",
      phone: "+233 24 000 0001",
    })
    .returning();

  const [accountant] = await db
    .insert(t.users)
    .values({
      email: "accountant@detech.school",
      passwordHash: demoHash,
      name: "Daniel Osei",
      role: "ACCOUNTANT",
      phone: "+233 24 000 0002",
    })
    .returning();

  const [librarian] = await db
    .insert(t.users)
    .values({
      email: "librarian@detech.school",
      passwordHash: demoHash,
      name: "Grace Appiah",
      role: "LIBRARIAN",
      phone: "+233 24 000 0003",
    })
    .returning();

  /* ------------------------------ Teachers ------------------------------ */
  const TEACHER_SPECS = [
    "Mathematics", "English Language", "Integrated Science", "Social Studies",
    "ICT", "French", "Creative Arts", "Physical Education",
  ];

  const teacherRows: (typeof t.teachers.$inferSelect)[] = [];
  for (let i = 0; i < TEACHER_SPECS.length; i++) {
    const { first, last } = uniqueName();
    const email =
      i === 0
        ? "teacher@detech.school"
        : `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, "") +
          "@detech.school";

    const [u] = await db
      .insert(t.users)
      .values({
        email,
        passwordHash: demoHash,
        name: `${first} ${last}`,
        role: "TEACHER",
        phone: `+233 24 ${randInt(100, 999)} ${randInt(1000, 9999)}`,
      })
      .returning();

    const [teacher] = await db
      .insert(t.teachers)
      .values({
        userId: u.id,
        staffNo: `TCH-${String(i + 1).padStart(3, "0")}`,
        firstName: first,
        lastName: last,
        qualification: pick(["B.Ed", "M.Ed", "B.Sc + PGDE", "M.Sc"]),
        specialization: TEACHER_SPECS[i],
        phone: u.phone,
        employmentType: chance(0.8) ? "FULL_TIME" : "PART_TIME",
        hireDate: daysAgo(randInt(200, 2200)),
      })
      .returning();

    teacherRows.push(teacher);
  }

  /* ----------------------------- Classrooms ----------------------------- */
  console.log("• Classes & subjects…");

  const CLASS_DEFS = [
    { name: "Grade 7", section: "A", level: 7 },
    { name: "Grade 7", section: "B", level: 7 },
    { name: "Grade 8", section: "A", level: 8 },
    { name: "Grade 8", section: "B", level: 8 },
    { name: "Grade 9", section: "A", level: 9 },
    { name: "Grade 9", section: "B", level: 9 },
  ];

  const classroomRows: (typeof t.classrooms.$inferSelect)[] = [];
  for (let i = 0; i < CLASS_DEFS.length; i++) {
    const def = CLASS_DEFS[i];
    const [c] = await db
      .insert(t.classrooms)
      .values({
        ...def,
        capacity: 40,
        room: `Block ${String.fromCharCode(65 + (i % 3))}-${100 + i}`,
        academicYear: "2025/2026",
        classTeacherId: teacherRows[i % teacherRows.length].id,
      })
      .returning();
    classroomRows.push(c);
  }

  /* ------------------------------ Subjects ------------------------------ */
  const SUBJECT_DEFS = [
    { code: "MTH101", name: "Mathematics", creditHours: 4 },
    { code: "ENG101", name: "English Language", creditHours: 4 },
    { code: "SCI101", name: "Integrated Science", creditHours: 4 },
    { code: "SOC101", name: "Social Studies", creditHours: 3 },
    { code: "ICT101", name: "Information Technology", creditHours: 3 },
    { code: "FRE101", name: "French", creditHours: 2, isElective: true },
    { code: "ART101", name: "Creative Arts", creditHours: 2, isElective: true },
    { code: "PHE101", name: "Physical Education", creditHours: 2 },
  ];

  const subjectRows = await db
    .insert(t.subjects)
    .values(
      SUBJECT_DEFS.map((s) => ({
        ...s,
        description: `${s.name} for junior high school.`,
      })),
    )
    .returning();

  // Map every subject into every class, with the matching specialist teacher.
  const classSubjectValues: (typeof t.classSubjects.$inferInsert)[] = [];
  for (const c of classroomRows) {
    for (let i = 0; i < subjectRows.length; i++) {
      classSubjectValues.push({
        classroomId: c.id,
        subjectId: subjectRows[i].id,
        teacherId: teacherRows[i % teacherRows.length].id,
      });
    }
  }
  await db.insert(t.classSubjects).values(classSubjectValues);

  /* ------------------------------ Timetable ------------------------------ */
  console.log("• Timetable…");

  const PERIODS = [
    ["08:00", "09:00"], ["09:00", "10:00"], ["10:30", "11:30"],
    ["11:30", "12:30"], ["13:30", "14:30"],
  ];
  const slotValues: (typeof t.timetableSlots.$inferInsert)[] = [];
  for (const c of classroomRows) {
    for (let day = 1; day <= 5; day++) {
      const shuffled = [...subjectRows].sort(() => Math.random() - 0.5);
      PERIODS.forEach(([start, end], p) => {
        const subject = shuffled[p % shuffled.length];
        const subjectIndex = subjectRows.findIndex((s) => s.id === subject.id);
        slotValues.push({
          classroomId: c.id,
          subjectId: subject.id,
          teacherId: teacherRows[subjectIndex % teacherRows.length].id,
          dayOfWeek: day,
          startTime: start,
          endTime: end,
          room: c.room,
        });
      });
    }
  }
  await db.insert(t.timetableSlots).values(slotValues);

  /* ------------------------------ Students ------------------------------ */
  console.log("• Students & guardians…");

  const studentRows: (typeof t.students.$inferSelect)[] = [];
  const STUDENT_COUNT = 72;

  for (let i = 0; i < STUDENT_COUNT; i++) {
    const { first, last } = uniqueName();
    const classroom = classroomRows[i % classroomRows.length];
    const email =
      i === 0
        ? "student@detech.school"
        : `${first}.${last}${i}`.toLowerCase().replace(/[^a-z.0-9]/g, "") +
          "@student.detech.school";

    const [u] = await db
      .insert(t.users)
      .values({
        email,
        passwordHash: demoHash,
        name: `${first} ${last}`,
        role: "STUDENT",
      })
      .returning();

    const [s] = await db
      .insert(t.students)
      .values({
        userId: u.id,
        admissionNo: `DET/2025/${String(i + 1).padStart(4, "0")}`,
        firstName: first,
        lastName: last,
        dateOfBirth: daysAgo(randInt(12, 16) * 365 + randInt(0, 364)),
        gender: chance(0.5) ? "MALE" : "FEMALE",
        address: `${randInt(1, 99)} ${pick(["Ring Road", "Oxford St", "Liberation Rd", "Spintex Rd", "Achimota Rd"])}, Accra`,
        phone: `+233 20 ${randInt(100, 999)} ${randInt(1000, 9999)}`,
        bloodGroup: pick(["A+", "O+", "B+", "AB+", "O-"]),
        status: chance(0.96) ? "ACTIVE" : pick(["SUSPENDED", "WITHDRAWN"]),
        admissionDate: daysAgo(randInt(30, 900)),
        classroomId: classroom.id,
      })
      .returning();

    studentRows.push(s);
  }

  /* ------------------------------ Guardians ------------------------------ */
  const guardianRows: (typeof t.guardians.$inferSelect)[] = [];
  for (let i = 0; i < 40; i++) {
    const { first, last } = uniqueName();
    const email =
      i === 0
        ? "parent@detech.school"
        : `${first}.${last}${i}`.toLowerCase().replace(/[^a-z.0-9]/g, "") +
          "@parent.detech.school";

    const [u] = await db
      .insert(t.users)
      .values({
        email,
        passwordHash: demoHash,
        name: `${first} ${last}`,
        role: "PARENT",
        phone: `+233 27 ${randInt(100, 999)} ${randInt(1000, 9999)}`,
      })
      .returning();

    const [g] = await db
      .insert(t.guardians)
      .values({
        userId: u.id,
        firstName: first,
        lastName: last,
        phone: u.phone,
        address: `${randInt(1, 99)} ${pick(["Ring Road", "Oxford St", "Spintex Rd"])}, Accra`,
        occupation: pick([
          "Trader", "Teacher", "Engineer", "Nurse", "Accountant", "Farmer",
          "Civil Servant", "Entrepreneur",
        ]),
      })
      .returning();

    guardianRows.push(g);
  }

  // Guardian #0 (parent@detech.school) is linked to student #0 so the demo
  // parent login always has a child to look at.
  const links: (typeof t.guardianStudents.$inferInsert)[] = [
    {
      guardianId: guardianRows[0].id,
      studentId: studentRows[0].id,
      relation: "MOTHER",
      isPrimary: true,
    },
  ];
  for (let i = 1; i < studentRows.length; i++) {
    links.push({
      guardianId: guardianRows[i % guardianRows.length].id,
      studentId: studentRows[i].id,
      relation: pick(["FATHER", "MOTHER", "GUARDIAN"]),
      isPrimary: true,
    });
  }
  await db.insert(t.guardianStudents).values(links);

  /* ----------------------------- Attendance ----------------------------- */
  console.log("• Attendance (last 30 school days)…");

  const attendanceValues: (typeof t.attendance.$inferInsert)[] = [];
  for (let d = 0; d < 42; d++) {
    const day = daysAgo(d);
    const dow = day.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends
    for (const s of studentRows) {
      if (s.status !== "ACTIVE") continue;
      const roll = Math.random();
      const status =
        roll < 0.9 ? "PRESENT" : roll < 0.95 ? "LATE" : roll < 0.98 ? "ABSENT" : "EXCUSED";
      attendanceValues.push({
        studentId: s.id,
        classroomId: s.classroomId!,
        date: dateKey(day),
        status,
        markedById: admin.id,
        note: status === "EXCUSED" ? "Medical leave" : null,
      });
    }
  }
  // chunked insert — SQLite has a bound-parameter ceiling
  for (let i = 0; i < attendanceValues.length; i += 400) {
    await db.insert(t.attendance).values(attendanceValues.slice(i, i + 400));
  }

  /* -------------------------- Exams & results -------------------------- */
  console.log("• Exams & results…");

  const examRows = await db
    .insert(t.exams)
    .values([
      {
        name: "Term 1 Mid-Term Assessment",
        term: "TERM_1",
        type: "MIDTERM",
        startDate: daysAgo(70),
        endDate: daysAgo(65),
        isPublished: true,
      },
      {
        name: "Term 1 End of Term Examination",
        term: "TERM_1",
        type: "FINAL",
        startDate: daysAgo(25),
        endDate: daysAgo(18),
        isPublished: true,
      },
      {
        name: "Term 2 Mid-Term Assessment",
        term: "TERM_2",
        type: "MIDTERM",
        startDate: daysAhead(20),
        endDate: daysAhead(25),
        isPublished: false,
      },
    ])
    .returning();

  const resultValues: (typeof t.examResults.$inferInsert)[] = [];
  for (const exam of examRows.filter((e) => e.isPublished)) {
    for (const s of studentRows) {
      if (s.status !== "ACTIVE") continue;
      for (const subject of subjectRows) {
        const score = Math.min(100, Math.max(15, Math.round(randInt(35, 98))));
        const { grade, remark } = toGrade(score);
        resultValues.push({
          examId: exam.id,
          studentId: s.id,
          subjectId: subject.id,
          score,
          maxScore: 100,
          grade,
          remark,
        });
      }
    }
  }
  for (let i = 0; i < resultValues.length; i += 400) {
    await db.insert(t.examResults).values(resultValues.slice(i, i + 400));
  }

  /* ------------------------------- Fees ------------------------------- */
  console.log("• Fees & payments…");

  let invoiceSeq = 1;
  for (const s of studentRows) {
    for (const term of ["TERM_1", "TERM_2"] as const) {
      const amount = 1200 + randInt(0, 6) * 50;
      const roll = Math.random();
      const status =
        roll < 0.55 ? "PAID" : roll < 0.75 ? "PARTIAL" : roll < 0.92 ? "UNPAID" : "OVERDUE";
      const dueDate = term === "TERM_1" ? daysAgo(40) : daysAhead(25);

      const [inv] = await db
        .insert(t.feeInvoices)
        .values({
          invoiceNo: `INV-2025-${String(invoiceSeq++).padStart(5, "0")}`,
          studentId: s.id,
          term,
          amount,
          status,
          dueDate,
          description: `${term === "TERM_1" ? "Term 1" : "Term 2"} tuition, books & levies`,
        })
        .returning();

      if (status === "PAID") {
        await db.insert(t.payments).values({
          invoiceId: inv.id,
          amount,
          method: pick(["CASH", "MOBILE_MONEY", "BANK_TRANSFER", "CARD"]),
          reference: `PAY-${randInt(100000, 999999)}`,
          paidAt: daysAgo(randInt(1, 60)),
          recordedBy: accountant.id,
        });
      } else if (status === "PARTIAL") {
        await db.insert(t.payments).values({
          invoiceId: inv.id,
          amount: Math.round(amount * (0.3 + Math.random() * 0.4)),
          method: pick(["CASH", "MOBILE_MONEY"]),
          reference: `PAY-${randInt(100000, 999999)}`,
          paidAt: daysAgo(randInt(1, 50)),
          recordedBy: accountant.id,
        });
      }
    }
  }

  /* ------------------------------ Library ------------------------------ */
  console.log("• Library…");

  const BOOKS = [
    ["978-0143127741", "Things Fall Apart", "Chinua Achebe", "Literature"],
    ["978-0241950425", "The Beautyful Ones Are Not Yet Born", "Ayi Kwei Armah", "Literature"],
    ["978-0199535569", "A Brief History of Time", "Stephen Hawking", "Science"],
    ["978-0262033848", "Introduction to Algorithms", "Cormen et al.", "Computing"],
    ["978-1107189638", "Core Mathematics for JHS", "K. Ofori", "Mathematics"],
    ["978-0521767507", "Integrated Science Companion", "A. Badu", "Science"],
    ["978-0198392828", "Oxford English Dictionary (School)", "Oxford Press", "Reference"],
    ["978-0140449136", "The Republic", "Plato", "Philosophy"],
    ["978-0393609394", "Astrophysics for People in a Hurry", "Neil deGrasse Tyson", "Science"],
    ["978-0061120084", "To Kill a Mockingbird", "Harper Lee", "Literature"],
    ["978-0330508117", "The Famished Road", "Ben Okri", "Literature"],
    ["978-1471156267", "Social Studies for JHS", "E. Ansah", "Social Studies"],
  ];

  const bookRows = await db
    .insert(t.books)
    .values(
      BOOKS.map(([isbn, title, author, category], i) => ({
        isbn,
        title,
        author,
        category,
        publisher: pick(["Pearson", "Oxford Press", "Longman", "Sedco"]),
        publishedYear: randInt(1998, 2024),
        totalCopies: randInt(3, 15),
        shelf: `S${String.fromCharCode(65 + (i % 5))}-${randInt(1, 9)}`,
      })),
    )
    .returning();

  const loanValues: (typeof t.bookLoans.$inferInsert)[] = [];
  for (let i = 0; i < 46; i++) {
    const issuedAt = daysAgo(randInt(2, 45));
    const dueAt = new Date(issuedAt);
    dueAt.setDate(dueAt.getDate() + 14);
    const returned = chance(0.6);
    const returnedAt = returned ? daysAgo(randInt(0, 10)) : null;
    const overdueDays =
      !returned && dueAt < new Date()
        ? Math.floor((Date.now() - dueAt.getTime()) / 86400000)
        : 0;
    loanValues.push({
      bookId: pick(bookRows).id,
      studentId: pick(studentRows).id,
      issuedAt,
      dueAt,
      returnedAt,
      fine: overdueDays * 0.5,
    });
  }
  await db.insert(t.bookLoans).values(loanValues);

  /* ----------------------------- Transport ----------------------------- */
  console.log("• Transport…");

  const vehicleRows = await db
    .insert(t.vehicles)
    .values([
      { regNumber: "GR-4521-24", model: "Toyota Coaster", capacity: 30, driverName: "Issah Fuseini", driverPhone: "+233 24 555 1010" },
      { regNumber: "GT-8890-23", model: "Mercedes Sprinter", capacity: 22, driverName: "Peter Nyame", driverPhone: "+233 24 555 2020" },
      { regNumber: "GW-1177-25", model: "Hyundai County", capacity: 26, driverName: "Mohammed Alhassan", driverPhone: "+233 24 555 3030" },
    ])
    .returning();

  const routeRows = await db
    .insert(t.transportRoutes)
    .values([
      { name: "Route A — Achimota Line", stops: "Achimota Mall, Tesano, Abeka, School", fare: 180, vehicleId: vehicleRows[0].id },
      { name: "Route B — Spintex Line", stops: "Baatsona, Manet, Coca-Cola, School", fare: 220, vehicleId: vehicleRows[1].id },
      { name: "Route C — Madina Line", stops: "Madina Market, Adenta, Legon, School", fare: 200, vehicleId: vehicleRows[2].id },
    ])
    .returning();

  const transportValues: (typeof t.transportAssignments.$inferInsert)[] = [];
  const seen = new Set<string>();
  for (const s of studentRows) {
    if (!chance(0.45)) continue;
    const route = pick(routeRows);
    const key = `${s.id}:${route.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    transportValues.push({
      studentId: s.id,
      routeId: route.id,
      pickupStop: pick(route.stops.split(", ").slice(0, -1)),
    });
  }
  await db.insert(t.transportAssignments).values(transportValues);

  /* -------------------------- Assignments -------------------------- */
  console.log("• Assignments & submissions…");

  const ASSIGNMENT_TITLES = [
    ["Quadratic equations worksheet", "Complete exercises 1–20 on solving quadratic equations by factorisation and the quadratic formula. Show all working."],
    ["Essay: My community", "Write a 500-word descriptive essay about your community. Pay attention to paragraphing and punctuation."],
    ["Photosynthesis lab report", "Write up the leaf-starch experiment. Include aim, apparatus, method, observation and conclusion."],
    ["Map work: Regions of Ghana", "Draw an outline map of Ghana and label all 16 regions and their capitals."],
    ["Build a personal webpage", "Create a single HTML page about yourself using at least 5 different HTML tags and basic CSS."],
    ["Les verbes du premier groupe", "Conjuguez les 15 verbes de la liste au présent, au passé composé et au futur simple."],
  ];

  const assignmentRows: (typeof t.assignments.$inferSelect)[] = [];
  for (const c of classroomRows) {
    for (let i = 0; i < 3; i++) {
      const [title, description] = pick(ASSIGNMENT_TITLES);
      const subjectIndex = randInt(0, subjectRows.length - 1);
      const [a] = await db
        .insert(t.assignments)
        .values({
          title,
          description,
          classroomId: c.id,
          subjectId: subjectRows[subjectIndex].id,
          teacherId: teacherRows[subjectIndex % teacherRows.length].id,
          dueDate: chance(0.5) ? daysAhead(randInt(1, 14)) : daysAgo(randInt(1, 14)),
          maxScore: 100,
        })
        .returning();
      assignmentRows.push(a);
    }
  }

  const submissionValues: (typeof t.submissions.$inferInsert)[] = [];
  for (const a of assignmentRows) {
    const classStudents = studentRows.filter((s) => s.classroomId === a.classroomId);
    for (const s of classStudents) {
      if (!chance(0.65)) continue;
      const graded = chance(0.6);
      const score = graded ? randInt(40, 100) : null;
      submissionValues.push({
        assignmentId: a.id,
        studentId: s.id,
        content: "Submitted via the DETECH student portal.",
        submittedAt: daysAgo(randInt(0, 12)),
        score,
        feedback: graded ? pick(["Well done!", "Good effort — check your workings.", "Needs more detail.", "Excellent presentation."]) : null,
        gradedAt: graded ? daysAgo(randInt(0, 5)) : null,
      });
    }
  }
  for (let i = 0; i < submissionValues.length; i += 400) {
    await db.insert(t.submissions).values(submissionValues.slice(i, i + 400));
  }

  /* ------------------- Announcements / messages / alerts ------------------- */
  console.log("• Communication…");

  await db.insert(t.announcements).values([
    {
      title: "Term 2 resumption date",
      body: "All students are to report to school on Monday, 12 January 2026 by 7:30am in full school uniform. Boarding students should arrive the previous evening.",
      audience: "ALL",
      authorId: admin.id,
      isPinned: true,
      publishedAt: daysAgo(3),
    },
    {
      title: "Mid-term examination timetable published",
      body: "The Term 2 mid-term examination timetable is now available under Exams. Please review it with your class teacher.",
      audience: "STUDENT",
      authorId: admin.id,
      publishedAt: daysAgo(6),
    },
    {
      title: "PTA general meeting",
      body: "The Parent–Teacher Association meets on Saturday at 10:00am in the school assembly hall. Attendance is strongly encouraged.",
      audience: "PARENT",
      authorId: admin.id,
      publishedAt: daysAgo(9),
    },
    {
      title: "Staff lesson-note submission",
      body: "All teaching staff should submit lesson notes for the coming week to the Head of Academics by Friday 4:00pm.",
      audience: "TEACHER",
      authorId: admin.id,
      publishedAt: daysAgo(12),
    },
    {
      title: "Inter-house sports festival",
      body: "The annual inter-house sports festival takes place at the end of the month. Trials begin next week — see your PE teacher.",
      audience: "ALL",
      authorId: admin.id,
      publishedAt: daysAgo(15),
    },
  ]);

  await db.insert(t.messages).values([
    {
      senderId: admin.id,
      recipientId: guardianRows[0].userId,
      subject: "Welcome to the DETECH parent portal",
      body: "Dear parent, your portal account is now active. You can follow attendance, results, fees and school notices here. Reply to this message if you need help.",
      createdAt: daysAgo(2),
    },
    {
      senderId: admin.id,
      recipientId: studentRows[0].userId!,
      subject: "Library book overdue",
      body: "Please return 'Things Fall Apart' to the library before Friday to avoid a late fee.",
      createdAt: daysAgo(1),
    },
    {
      senderId: accountant.id,
      recipientId: guardianRows[0].userId,
      subject: "Term 2 invoice available",
      body: "The Term 2 invoice has been issued and is due in 25 days. Mobile money and bank transfer are both accepted.",
      createdAt: daysAgo(4),
    },
    {
      senderId: librarian.id,
      recipientId: admin.id,
      subject: "New book donations",
      body: "We received 40 donated titles from the alumni association. I will catalogue them this week.",
      createdAt: daysAgo(5),
    },
  ]);

  await db.insert(t.notifications).values([
    { userId: admin.id, type: "WARNING", channel: "IN_APP", title: "14 invoices are overdue", body: "Fee collection is below target for Term 1.", link: "/dashboard/fees" },
    { userId: admin.id, type: "INFO", channel: "IN_APP", title: "Attendance register pending", body: "2 classes have not submitted today's register.", link: "/dashboard/attendance" },
    { userId: admin.id, type: "SUCCESS", channel: "EMAIL", title: "End of term results published", body: "Term 1 results are now visible to parents.", link: "/dashboard/exams", readAt: daysAgo(1) },
    { userId: guardianRows[0].userId, type: "INFO", channel: "SMS", title: "Fee reminder", body: "Term 2 fees are due in 25 days.", link: "/dashboard/fees" },
    { userId: studentRows[0].userId!, type: "INFO", channel: "PUSH", title: "New assignment posted", body: "Mathematics — quadratic equations worksheet.", link: "/dashboard/assignments" },
  ]);

  await db.insert(t.auditLogs).values([
    { userId: admin.id, action: "SEED", entity: "system", metadata: JSON.stringify({ students: studentRows.length }) },
  ]);

  /* ------------------------------ Summary ------------------------------ */
  console.log(`
✅  Seed complete

    Students      ${studentRows.length}
    Teachers      ${teacherRows.length}
    Guardians     ${guardianRows.length}
    Classes       ${classroomRows.length}
    Subjects      ${subjectRows.length}
    Attendance    ${attendanceValues.length} records
    Exam results  ${resultValues.length}
    Books         ${bookRows.length}
    Assignments   ${assignmentRows.length}

────────────────────────────────────────────────────────
  DEMO LOGINS                     (all on /login)
────────────────────────────────────────────────────────
  Admin        admin@detech.school        Admin@123
  Teacher      teacher@detech.school      Password@123
  Student      student@detech.school      Password@123
  Parent       parent@detech.school       Password@123
  Accountant   accountant@detech.school   Password@123
  Librarian    librarian@detech.school    Password@123
────────────────────────────────────────────────────────
`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Seed failed:\n", err);
    process.exit(1);
  });
