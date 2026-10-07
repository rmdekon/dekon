import { asc, eq, sql } from "drizzle-orm";
import { GraduationCap, UserCheck, Users } from "lucide-react";

import { StatCard } from "@/components/stat-card";
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { db } from "@/db";
import { classSubjects, classrooms, teachers, users } from "@/db/schema";
import { colorFromString, formatDate, initials } from "@/lib/utils";

export const metadata = { title: "Teachers" };
export const dynamic = "force-dynamic";

export default async function TeachersPage() {
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
      hireDate: teachers.hireDate,
      email: users.email,
      allocations: sql<number>`(select count(*) from class_subjects cs where cs.teacher_id = ${teachers.id})`,
      classesLed: sql<number>`(select count(*) from classrooms c where c.class_teacher_id = ${teachers.id})`,
    })
    .from(teachers)
    .innerJoin(users, eq(users.id, teachers.userId))
    .orderBy(asc(teachers.lastName));

  const active = rows.filter((r) => r.isActive).length;
  const fullTime = rows.filter((r) => r.employmentType === "FULL_TIME").length;
  const [allocationRow] = await db
    .select({ n: sql<number>`count(*)` })
    .from(classSubjects);

  return (
    <>
      <PageHeader
        title="Teachers"
        description="Teaching staff, their qualifications and subject allocations."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total staff" value={rows.length} icon={Users} tone="brand" />
        <StatCard label="Active" value={active} icon={UserCheck} tone="emerald" />
        <StatCard
          label="Full-time"
          value={fullTime}
          hint={`${rows.length - fullTime} part-time / contract`}
          icon={GraduationCap}
          tone="violet"
        />
        <StatCard
          label="Subject allocations"
          value={Number(allocationRow?.n ?? 0)}
          hint="class–subject pairings"
          icon={GraduationCap}
          tone="amber"
        />
      </div>

      <Card className="overflow-hidden">
        {rows.length ? (
          <Table>
            <thead>
              <tr>
                <Th>Teacher</Th>
                <Th>Staff no.</Th>
                <Th>Specialisation</Th>
                <Th>Qualification</Th>
                <Th>Employment</Th>
                <Th>Workload</Th>
                <Th>Hired</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <Tr key={t.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${colorFromString(t.firstName + t.lastName)}`}
                      >
                        {initials(`${t.firstName} ${t.lastName}`)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink-900">
                          {t.firstName} {t.lastName}
                        </p>
                        <p className="truncate text-[11px] text-ink-400">
                          {t.email}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td className="font-mono text-xs">{t.staffNo}</Td>
                  <Td className="text-xs">{t.specialization ?? "—"}</Td>
                  <Td className="text-xs">{t.qualification ?? "—"}</Td>
                  <Td>
                    <Badge tone={t.employmentType === "FULL_TIME" ? "brand" : "neutral"}>
                      {t.employmentType.replace("_", " ")}
                    </Badge>
                  </Td>
                  <Td className="text-xs">
                    {Number(t.allocations)} subjects · {Number(t.classesLed)} classes
                  </Td>
                  <Td className="text-xs">{formatDate(t.hireDate)}</Td>
                  <Td>
                    <Badge tone={t.isActive ? "success" : "danger"}>
                      {t.isActive ? "ACTIVE" : "INACTIVE"}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState title="No teachers yet" />
        )}
      </Card>
    </>
  );
}
