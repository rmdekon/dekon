import type { NextRequest } from "next/server";

import { db } from "@/db";
import { announcements } from "@/db/schema";
import { handler, ok } from "@/lib/api";
import { requireRole, requireSession } from "@/lib/auth";
import { getAnnouncementsFor } from "@/lib/queries";
import { announcementCreateSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export const GET = handler(async (request: NextRequest) => {
  const user = await requireSession();
  const limit = Number(new URL(request.url).searchParams.get("limit") ?? 50);
  const items = await getAnnouncementsFor(user.role, limit);
  return ok({ items, total: items.length });
});

export const POST = handler(async (request: NextRequest) => {
  const user = await requireRole("ADMIN", "TEACHER");
  const data = announcementCreateSchema.parse(await request.json().catch(() => ({})));
  const [announcement] = await db
    .insert(announcements)
    .values({ ...data, authorId: user.id })
    .returning();
  return ok({ announcement }, { status: 201 });
});
