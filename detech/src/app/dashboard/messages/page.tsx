import { aliasedTable, desc, eq, ne } from "drizzle-orm";
import { Inbox, MailOpen, Send } from "lucide-react";

import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
} from "@/components/ui";
import { db } from "@/db";
import { messages, users } from "@/db/schema";
import { markMessageReadAction } from "@/lib/actions/communication";
import { getSession } from "@/lib/auth";
import { colorFromString, initials, relativeTime } from "@/lib/utils";

import { MessageComposer } from "./compose";

export const metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const user = await getSession();
  if (!user) return null;

  const sender = aliasedTable(users, "sender");
  const recipient = aliasedTable(users, "recipient");

  const [inbox, sent, contacts] = await Promise.all([
    db
      .select({
        id: messages.id,
        subject: messages.subject,
        body: messages.body,
        readAt: messages.readAt,
        createdAt: messages.createdAt,
        fromName: sender.name,
        fromRole: sender.role,
      })
      .from(messages)
      .innerJoin(sender, eq(sender.id, messages.senderId))
      .where(eq(messages.recipientId, user.id))
      .orderBy(desc(messages.createdAt))
      .limit(30),
    db
      .select({
        id: messages.id,
        subject: messages.subject,
        body: messages.body,
        createdAt: messages.createdAt,
        toName: recipient.name,
        toRole: recipient.role,
      })
      .from(messages)
      .innerJoin(recipient, eq(recipient.id, messages.recipientId))
      .where(eq(messages.senderId, user.id))
      .orderBy(desc(messages.createdAt))
      .limit(20),
    db
      .select({ id: users.id, name: users.name, role: users.role })
      .from(users)
      .where(ne(users.id, user.id))
      .orderBy(users.name)
      .limit(300),
  ]);

  const unread = inbox.filter((m) => !m.readAt).length;

  return (
    <>
      <PageHeader
        title="Messages"
        description={`${unread} unread message${unread === 1 ? "" : "s"} in your inbox.`}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader
              title="Inbox"
              description={`${inbox.length} received`}
              action={
                unread > 0 ? <Badge tone="brand">{unread} unread</Badge> : null
              }
            />
            {inbox.length ? (
              <ul className="divide-y divide-ink-100">
                {inbox.map((m) => (
                  <li
                    key={m.id}
                    className={`flex gap-3.5 px-5 py-4 transition-colors ${
                      m.readAt ? "" : "bg-brand-50/40"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${colorFromString(m.fromName)}`}
                    >
                      {initials(m.fromName)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-ink-950">
                          {m.subject}
                        </p>
                        {!m.readAt ? <Badge tone="brand">New</Badge> : null}
                      </div>
                      <p className="mt-0.5 text-[11px] text-ink-500">
                        From {m.fromName} ({m.fromRole.toLowerCase()}) ·{" "}
                        {relativeTime(m.createdAt)}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-ink-600">
                        {m.body}
                      </p>
                      {!m.readAt ? (
                        <form action={markMessageReadAction} className="mt-2.5">
                          <input type="hidden" name="id" value={m.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-300 px-2.5 py-1 text-[11px] font-medium text-ink-700 hover:bg-ink-50"
                          >
                            <MailOpen className="h-3 w-3" />
                            Mark as read
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<Inbox className="h-5 w-5" />}
                title="Your inbox is empty"
              />
            )}
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Sent" description={`${sent.length} sent`} />
            {sent.length ? (
              <ul className="divide-y divide-ink-100">
                {sent.map((m) => (
                  <li key={m.id} className="flex gap-3.5 px-5 py-3.5">
                    <Send className="mt-0.5 h-4 w-4 shrink-0 text-ink-300" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-ink-900">{m.subject}</p>
                      <p className="mt-0.5 text-[11px] text-ink-500">
                        To {m.toName} · {relativeTime(m.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Nothing sent yet" />
            )}
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader title="New message" description="Reaches any member of the school" />
          <CardBody>
            <MessageComposer recipients={contacts} />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
