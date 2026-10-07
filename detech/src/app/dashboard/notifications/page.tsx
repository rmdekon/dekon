import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import {
  AlertTriangle,
  Bell,
  BellRing,
  CheckCheck,
  CheckCircle2,
  Info,
  Mail,
  MessageSquare,
  Smartphone,
  XCircle,
} from "lucide-react";

import { Badge, Card, CardHeader, EmptyState, PageHeader } from "@/components/ui";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { markAllNotificationsReadAction } from "@/lib/actions/communication";
import { getSession } from "@/lib/auth";
import { relativeTime } from "@/lib/utils";

export const metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

const TYPE_ICON = {
  INFO: Info,
  SUCCESS: CheckCircle2,
  WARNING: AlertTriangle,
  ERROR: XCircle,
} as const;

const TYPE_TONE = {
  INFO: "bg-sky-50 text-sky-600",
  SUCCESS: "bg-emerald-50 text-emerald-600",
  WARNING: "bg-amber-50 text-amber-600",
  ERROR: "bg-rose-50 text-rose-600",
} as const;

const CHANNEL_ICON = {
  IN_APP: Bell,
  EMAIL: Mail,
  SMS: MessageSquare,
  PUSH: Smartphone,
} as const;

export default async function NotificationsPage() {
  const user = await getSession();
  if (!user) return null;

  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  const unread = rows.filter((n) => !n.readAt);

  return (
    <>
      <PageHeader
        title="Notifications"
        description="In-app, email, SMS and push alerts delivered to your account."
        action={
          unread.length ? (
            <form action={markAllNotificationsReadAction}>
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-ink-300 bg-white px-4 text-xs font-medium text-ink-700 transition-colors hover:bg-ink-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all as read
              </button>
            </form>
          ) : null
        }
      />

      <Card className="overflow-hidden">
        <CardHeader
          title="All notifications"
          description={`${rows.length} total`}
          action={
            unread.length ? (
              <Badge tone="brand">{unread.length} unread</Badge>
            ) : (
              <Badge tone="success">All caught up</Badge>
            )
          }
        />
        {rows.length ? (
          <ul className="divide-y divide-ink-100">
            {rows.map((n) => {
              const Icon = TYPE_ICON[n.type as keyof typeof TYPE_ICON] ?? Info;
              const ChannelIcon =
                CHANNEL_ICON[n.channel as keyof typeof CHANNEL_ICON] ?? Bell;
              const tone =
                TYPE_TONE[n.type as keyof typeof TYPE_TONE] ??
                "bg-ink-100 text-ink-500";

              const content = (
                <div
                  className={`flex gap-3.5 px-5 py-4 transition-colors hover:bg-ink-50/60 ${
                    n.readAt ? "" : "bg-brand-50/40"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-ink-950">{n.title}</p>
                      {!n.readAt ? <Badge tone="brand">New</Badge> : null}
                    </div>
                    {n.body ? (
                      <p className="mt-1 text-xs leading-relaxed text-ink-600">
                        {n.body}
                      </p>
                    ) : null}
                    <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-ink-400">
                      <ChannelIcon className="h-3 w-3" />
                      {n.channel.replace("_", "-").toLowerCase()} ·{" "}
                      {relativeTime(n.createdAt)}
                    </p>
                  </div>
                </div>
              );

              return (
                <li key={n.id}>
                  {n.link ? <Link href={n.link}>{content}</Link> : content}
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon={<BellRing className="h-5 w-5" />}
            title="No notifications"
            description="Alerts about fees, attendance and results will appear here."
          />
        )}
      </Card>
    </>
  );
}
