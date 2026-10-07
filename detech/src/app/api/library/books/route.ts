import type { NextRequest } from "next/server";
import { asc, sql } from "drizzle-orm";

import { db } from "@/db";
import { books } from "@/db/schema";
import { handler, ok } from "@/lib/api";
import { requireRole, requireSession } from "@/lib/auth";
import { getLibraryStats } from "@/lib/queries";
import { bookCreateSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  await requireSession();
  const [items, stats] = await Promise.all([
    db
      .select({
        id: books.id,
        isbn: books.isbn,
        title: books.title,
        author: books.author,
        category: books.category,
        totalCopies: books.totalCopies,
        shelf: books.shelf,
        onLoan: sql<number>`(select count(*) from book_loans bl where bl.book_id = ${books.id} and bl.returned_at is null)`,
      })
      .from(books)
      .orderBy(asc(books.title)),
    getLibraryStats(),
  ]);

  return ok({ items, stats });
});

export const POST = handler(async (request: NextRequest) => {
  await requireRole("ADMIN", "LIBRARIAN");
  const data = bookCreateSchema.parse(await request.json().catch(() => ({})));
  const [book] = await db.insert(books).values(data).returning();
  return ok({ book }, { status: 201 });
});
