import Link from "next/link";
import { and, asc, eq, like, or, sql } from "drizzle-orm";
import { Users } from "lucide-react";

import { FilterBar, FilterSelect, Pager } from "@/components/filter-bar";
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  Table,
  Td,
  Th,
  Tr,
  statusTone,
} from "@/components/ui";
import { db } from "@/db";
import { classrooms, students } from "@/db/schema";
import { STUDENT_STATUSES } from "@/lib/enums";
import { colorFromString, formatDate, initials } from "@/lib/utils";

export const metadata = { title: "Students" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    classroomId?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const q = sp.q?.trim();

  const filters = [
    q
      ? or(
          like(students.firstName, `%${q}%`),
          like(students.lastName, `%${q}%`),
          like(students.admissionNo, `%${q}%`),
        )
      : undefined,
    sp.classroomId ? eq(students.classroomId, sp.classroomId) : undefined,
    sp.status ? eq(students.status, sp.status) : undefined,
  ].filter(Boolean);
  const where = filters.length ? and(...filters) : undefined;

  const [rows, [countRow], classList] = await Promise.all([
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
        className: classrooms.name,
        section: classrooms.section,
      })
      .from(students)
      .leftJoin(classrooms, eq(classrooms.id, students.classroomId))
      .where(where)
      .orderBy(asc(students.lastName), asc(students.firstName))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: sql<number>`count(*)` }).from(students).where(where),
    db
      .select()
      .from(classrooms)
      .orderBy(asc(classrooms.level), asc(classrooms.section)),
  ]);

  const total = Number(countRow?.n ?? 0);
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  return (
    <>
      <PageHeader
        title="Students"
        description={`${total} student record${total === 1 ? "" : "s"} found.`}
      />

      <FilterBar
        action="/dashboard/students"
        q={q}
        placeholder="Search by name or admission number…"
      >
        <FilterSelect
          name="classroomId"
          label="All classes"
          defaultValue={sp.classroomId}
          options={classList.map((c) => ({
            value: c.id,
            label: `${c.name} ${c.section}`,
          }))}
        />
        <FilterSelect
          name="status"
          label="Any status"
          defaultValue={sp.status}
          options={STUDENT_STATUSES.map((s) => ({ value: s, label: s }))}
        />
      </FilterBar>

      <Card className="overflow-hidden">
        {rows.length ? (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Student</Th>
                  <Th>Admission no.</Th>
                  <Th>Class</Th>
                  <Th>Gender</Th>
                  <Th>Contact</Th>
                  <Th>Admitted</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <Tr key={s.id}>
                    <Td>
                      <Link
                        href={`/dashboard/students/${s.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${colorFromString(s.firstName + s.lastName)}`}
                        >
                          {initials(`${s.firstName} ${s.lastName}`)}
                        </span>
                        <span className="font-medium text-ink-900 group-hover:text-brand-600">
                          {s.firstName} {s.lastName}
                        </span>
                      </Link>
                    </Td>
                    <Td className="font-mono text-xs">{s.admissionNo}</Td>
                    <Td>
                      {s.className ? (
                        <Badge tone="brand">
                          {s.className} {s.section}
                        </Badge>
                      ) : (
                        <span className="text-ink-400">—</span>
                      )}
                    </Td>
                    <Td className="text-xs">{s.gender}</Td>
                    <Td className="text-xs">{s.phone ?? "—"}</Td>
                    <Td className="text-xs">{formatDate(s.admissionDate)}</Td>
                    <Td>
                      <Badge tone={statusTone(s.status)}>{s.status}</Badge>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <Pager
              basePath="/dashboard/students"
              page={page}
              totalPages={totalPages}
              params={{ q, classroomId: sp.classroomId, status: sp.status }}
            />
          </>
        ) : (
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title="No students match your filters"
            description="Try clearing the search box or choosing a different class."
          />
        )}
      </Card>
    </>
  );
}
