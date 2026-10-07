import { Megaphone, Pin } from "lucide-react";

import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
} from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getAnnouncementsFor } from "@/lib/queries";
import { canWrite } from "@/lib/rbac";
import { formatDateTime, relativeTime } from "@/lib/utils";

import { AnnouncementComposer } from "./compose";

export const metadata = { title: "Announcements" };
export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const user = await getSession();
  const notices = await getAnnouncementsFor(user?.role ?? "STUDENT", 50);
  const mayPost = canWrite(user?.role, "announcements");

  const pinned = notices.filter((n) => n.isPinned);
  const rest = notices.filter((n) => !n.isPinned);

  return (
    <>
      <PageHeader
        title="Announcements"
        description="School-wide notices, filtered to the audiences you belong to."
      />

      {mayPost ? (
        <Card className="mb-6">
          <CardHeader
            title="Publish an announcement"
            description="It appears immediately for the selected audience."
          />
          <CardBody>
            <AnnouncementComposer />
          </CardBody>
        </Card>
      ) : null}

      {pinned.length ? (
        <div className="mb-6 space-y-4">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-ink-500 uppercase">
            <Pin className="h-3.5 w-3.5" /> Pinned
          </h2>
          {pinned.map((n) => (
            <Card key={n.id} className="border-brand-200 bg-brand-50/40">
              <CardBody>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-ink-950">{n.title}</h3>
                  <Badge tone="brand">Pinned</Badge>
                  <Badge tone="neutral">{n.audience}</Badge>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-700">{n.body}</p>
                <p className="mt-3 text-[11px] text-ink-400">
                  {n.authorName ?? "System"} · {formatDateTime(n.publishedAt)}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : null}

      {rest.length ? (
        <div className="space-y-4">
          {rest.map((n) => (
            <Card key={n.id}>
              <CardBody className="flex gap-4">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Megaphone className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-ink-950">{n.title}</h3>
                    <Badge tone="neutral">{n.audience}</Badge>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-700">
                    {n.body}
                  </p>
                  <p className="mt-3 text-[11px] text-ink-400">
                    {n.authorName ?? "System"} · {relativeTime(n.publishedAt)}
                  </p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : pinned.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Megaphone className="h-5 w-5" />}
            title="No announcements"
            description="Notices published for your role will appear here."
          />
        </Card>
      ) : null}
    </>
  );
}
