import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { AlertTriangle, BookOpen, BookUp, Library } from "lucide-react";

import { StatCard } from "@/components/stat-card";
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { db } from "@/db";
import { bookLoans, books, students } from "@/db/schema";
import { getLibraryStats } from "@/lib/queries";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata = { title: "Library" };
export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const now = Date.now();

  const [catalogue, loans, stats] = await Promise.all([
    db
      .select({
        id: books.id,
        isbn: books.isbn,
        title: books.title,
        author: books.author,
        category: books.category,
        publisher: books.publisher,
        publishedYear: books.publishedYear,
        totalCopies: books.totalCopies,
        shelf: books.shelf,
        onLoan: sql<number>`(select count(*) from book_loans bl where bl.book_id = ${books.id} and bl.returned_at is null)`,
      })
      .from(books)
      .orderBy(asc(books.title)),
    db
      .select({
        id: bookLoans.id,
        issuedAt: bookLoans.issuedAt,
        dueAt: bookLoans.dueAt,
        returnedAt: bookLoans.returnedAt,
        fine: bookLoans.fine,
        title: books.title,
        firstName: students.firstName,
        lastName: students.lastName,
        admissionNo: students.admissionNo,
      })
      .from(bookLoans)
      .innerJoin(books, eq(books.id, bookLoans.bookId))
      .innerJoin(students, eq(students.id, bookLoans.studentId))
      .orderBy(desc(bookLoans.issuedAt))
      .limit(25),
    getLibraryStats(),
  ]);

  const totalFines = loans.reduce((s, l) => s + l.fine, 0);

  return (
    <>
      <PageHeader
        title="Library"
        description="Catalogue, circulation and overdue tracking."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Titles in catalogue"
          value={stats.titles}
          hint={`${stats.copies} physical copies`}
          icon={Library}
          tone="brand"
        />
        <StatCard
          label="Currently on loan"
          value={stats.onLoan}
          hint={`${stats.copies - stats.onLoan} available`}
          icon={BookUp}
          tone="violet"
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          hint="past the return date"
          icon={AlertTriangle}
          tone={stats.overdue > 0 ? "rose" : "emerald"}
        />
        <StatCard
          label="Fines accrued"
          value={formatMoney(totalFines)}
          hint="across recent loans"
          icon={BookOpen}
          tone="amber"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader title="Catalogue" description={`${catalogue.length} titles`} />
          {catalogue.length ? (
            <Table>
              <thead>
                <tr>
                  <Th>Title</Th>
                  <Th>Category</Th>
                  <Th>Shelf</Th>
                  <Th>Available</Th>
                </tr>
              </thead>
              <tbody>
                {catalogue.map((b) => {
                  const available = b.totalCopies - Number(b.onLoan);
                  return (
                    <Tr key={b.id}>
                      <Td>
                        <p className="font-medium text-ink-900">{b.title}</p>
                        <p className="text-[11px] text-ink-400">
                          {b.author} · {b.publishedYear ?? "—"}
                        </p>
                      </Td>
                      <Td className="text-xs">{b.category ?? "—"}</Td>
                      <Td className="font-mono text-[11px]">{b.shelf ?? "—"}</Td>
                      <Td>
                        <Badge
                          tone={
                            available === 0
                              ? "danger"
                              : available < 3
                                ? "warning"
                                : "success"
                          }
                        >
                          {available} / {b.totalCopies}
                        </Badge>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          ) : (
            <EmptyState title="Catalogue is empty" />
          )}
        </Card>

        <Card className="overflow-hidden">
          <CardHeader title="Recent circulation" description="Latest 25 loans" />
          {loans.length ? (
            <Table>
              <thead>
                <tr>
                  <Th>Book</Th>
                  <Th>Borrower</Th>
                  <Th>Due</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {loans.map((l) => {
                  const overdue = !l.returnedAt && l.dueAt.getTime() < now;
                  return (
                    <Tr key={l.id}>
                      <Td>
                        <p className="max-w-[12rem] truncate font-medium text-ink-900">
                          {l.title}
                        </p>
                        <p className="text-[11px] text-ink-400">
                          issued {formatDate(l.issuedAt)}
                        </p>
                      </Td>
                      <Td>
                        <p className="text-xs text-ink-800">
                          {l.firstName} {l.lastName}
                        </p>
                        <p className="font-mono text-[10px] text-ink-400">
                          {l.admissionNo}
                        </p>
                      </Td>
                      <Td className="text-xs">{formatDate(l.dueAt)}</Td>
                      <Td>
                        {l.returnedAt ? (
                          <Badge tone="success">Returned</Badge>
                        ) : overdue ? (
                          <Badge tone="danger">
                            Overdue{l.fine > 0 ? ` · ${formatMoney(l.fine)}` : ""}
                          </Badge>
                        ) : (
                          <Badge tone="info">On loan</Badge>
                        )}
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          ) : (
            <EmptyState title="No loans recorded" />
          )}
        </Card>
      </div>
    </>
  );
}
