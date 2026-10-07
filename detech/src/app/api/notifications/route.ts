import type { NextRequest } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { notifications } from "@/db/schema";
import { handler, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  const user = await requireSession();
  const items = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  return ok({ items, unread: items.filter((n) => !n.readAt).length });
});

/** PATCH /api/notifications  — body `{ id }` or `{ all: true }` */
export const PATCH = handler(async (request: NextRequest) => {
  const user = await requireSession();
  const body = (await request.json().catch(() => ({}))) as {
    id?: string;
    all?: boolean;
  };

  if (body.all) {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));
    return ok({ markedAll: true });
  }

  if (!body.id) return ok({ markedAll: false });

  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, body.id), eq(notifications.userId, user.id)));

  return ok({ marked: body.id });
});
