"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { announcements, messages, notifications } from "@/db/schema";
import { requireRole, requireSession } from "@/lib/auth";
import { announcementCreateSchema, messageCreateSchema } from "@/lib/validators";

export type ActionState = { ok?: boolean; message?: string; error?: string };

export async function createAnnouncementAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const user = await requireRole("ADMIN", "TEACHER");
    const data = announcementCreateSchema.parse({
      title: formData.get("title"),
      body: formData.get("body"),
      audience: formData.get("audience") || "ALL",
      isPinned: formData.get("isPinned") === "on",
    });

    await db.insert(announcements).values({ ...data, authorId: user.id });
    revalidatePath("/dashboard/announcements");
    revalidatePath("/dashboard");
    return { ok: true, message: "Announcement published." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? "Could not publish — check the title and body."
          : "Something went wrong.",
    };
  }
}

export async function sendMessageAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const user = await requireSession();
    const data = messageCreateSchema.parse({
      recipientId: formData.get("recipientId"),
      subject: formData.get("subject"),
      body: formData.get("body"),
    });

    await db.insert(messages).values({ ...data, senderId: user.id });
    await db.insert(notifications).values({
      userId: data.recipientId,
      type: "INFO",
      channel: "IN_APP",
      title: `New message from ${user.name}`,
      body: data.subject,
      link: "/dashboard/messages",
    });

    revalidatePath("/dashboard/messages");
    return { ok: true, message: "Message sent." };
  } catch {
    return { error: "Could not send the message. Pick a recipient and try again." };
  }
}

export async function markAllNotificationsReadAction() {
  const user = await requireSession();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard");
}

export async function markMessageReadAction(formData: FormData) {
  const user = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db
    .update(messages)
    .set({ readAt: new Date() })
    .where(and(eq(messages.id, id), eq(messages.recipientId, user.id)));
  revalidatePath("/dashboard/messages");
}
