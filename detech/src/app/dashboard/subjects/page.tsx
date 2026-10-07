import { asc, eq, sql } from "drizzle-orm";
import { BookOpen, GraduationCap } from "lucide-react";

import { BarChart } from "@/components/charts";
import { StatCard } from "@/components/stat-card";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { db } from "@/db";
import { subjects } from "@/db/schema";
import { getSubjectAverages } from "@/lib/queries";

export const metadata = { title: "Subjects" };
export const dynamic = "force-dynamic";

export default async function SubjectsPage() {
  const [rows, averages] = await Promise.all([
    db
      .select({
        id: subjects.id,
        code: subjects.code,
        name: subjects.name,
        description: subjects.description,
        creditHours: subjects.creditHours,
        isElective: subjects.isElective,
        classCount: sql<number>`(select count(*) from class_subjects cs where cs.subject_id = ${subjects.id})`,
        resultCount: sql<number>`(select count(*) from exam_results er where er.subject_id = ${subjects.id})`,
        avgScore: sql<number>`(select round(avg(er.score), 1) from exam_results er where er.subject_id = ${subjects.id})`,
      })
      .from(subjects)
      .orderBy(asc(subjects.code)),
    getSubjectAverages(),
  ]);

  const electives = rows.filter((r) => r.isElective).length;
  const totalCredits = rows.reduce((s, r) => s + r.creditHours, 0);

  return (
    <>
      <PageHeader
        title="Subjects"
        description="The school curriculum, credit weighting and performance per subject."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Subjects" value={rows.length} icon={BookOpen} tone="brand" />
        <StatCard
          label="Core subjects"
          value={rows.length - electives}
          hint={`${electives} electives`}
          icon={GraduationCap}
          tone="emerald"
        />
        <StatCard label="Total credit hours" value={totalCredits} icon={BookOpen} tone="violet" />
        <StatCard
          label="Class allocations"
          value={rows.reduce((s, r) => s + Number(r.classCount), 0)}
          icon={GraduationCap}
          tone="amber"
        />
      </div>

      <Card className="mb-6">
        <CardHeader title="Average score by subject" description="Across all published results" />
        <CardBody>
          <BarChart data={averages} tone="emerald" height={170} />
        </CardBody>
      </Card>

      <Card className="overflow-hidden">
        {rows.length ? (
          <Table>
            <thead>
              <tr>
                <Th>Code</Th>
                <Th>Subject</Th>
                <Th>Type</Th>
                <Th>Credits</Th>
                <Th>Classes</Th>
                <Th>Results</Th>
                <Th>Average</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <Tr key={s.id}>
                  <Td className="font-mono text-xs font-medium text-brand-700">
                    {s.code}
                  </Td>
                  <Td>
                    <p className="font-medium text-ink-900">{s.name}</p>
                    {s.description ? (
                      <p className="truncate text-[11px] text-ink-400">
                        {s.description}
                      </p>
                    ) : null}
                  </Td>
                  <Td>
                    <Badge tone={s.isElective ? "violet" : "brand"}>
                      {s.isElective ? "Elective" : "Core"}
                    </Badge>
                  </Td>
                  <Td className="text-xs tabular-nums">{s.creditHours}</Td>
                  <Td className="text-xs tabular-nums">{Number(s.classCount)}</Td>
                  <Td className="text-xs tabular-nums">{Number(s.resultCount)}</Td>
                  <Td className="text-xs font-semibold tabular-nums text-ink-900">
                    {s.avgScore ?? "—"}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState title="No subjects defined" />
        )}
      </Card>
    </>
  );
}
