import { eq } from "drizzle-orm";
import {
  CheckCircle2,
  Database,
  KeyRound,
  Lock,
  Shield,
  User as UserIcon,
} from "lucide-react";

import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  PageHeader,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { db } from "@/db";
import { users } from "@/db/schema";
import { logoutAction } from "@/lib/actions/auth";
import { getSession } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/enums";
import { MODULE_ACCESS, MODULE_WRITE } from "@/lib/rbac";
import { colorFromString, formatDateTime, initials } from "@/lib/utils";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) return null;

  const [account] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.id))
    .limit(1);

  const modules = Object.entries(MODULE_ACCESS)
    .filter(([, roles]) => roles.includes(session.role))
    .map(([key]) => ({
      key,
      write: MODULE_WRITE[key as keyof typeof MODULE_WRITE]?.includes(
        session.role,
      ),
    }));

  return (
    <>
      <PageHeader
        title="Settings"
        description="Your account, permissions and system information."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Profile" description="Details on your DETECH account" />
          <CardBody className="space-y-6">
            <div className="flex items-center gap-4">
              <span
                className={`flex h-16 w-16 items-center justify-center rounded-full text-lg font-semibold text-white ${colorFromString(session.name)}`}
              >
                {initials(session.name)}
              </span>
              <div>
                <p className="text-base font-semibold text-ink-950">
                  {session.name}
                </p>
                <p className="text-sm text-ink-500">{session.email}</p>
                <Badge tone="brand" className="mt-1.5">
                  {ROLE_LABELS[session.role]}
                </Badge>
              </div>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" value={account?.name ?? session.name} />
              <Field label="Email address" value={session.email} />
              <Field label="Phone" value={account?.phone ?? "Not set"} />
              <Field
                label="Account status"
                value={account?.isActive ? "Active" : "Disabled"}
              />
              <Field
                label="Last sign-in"
                value={
                  account?.lastLoginAt
                    ? formatDateTime(account.lastLoginAt)
                    : "First session"
                }
              />
              <Field
                label="Member since"
                value={account ? formatDateTime(account.createdAt) : "—"}
              />
            </dl>

            <div className="flex flex-wrap gap-3 border-t border-ink-100 pt-5">
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-rose-600 px-4 text-xs font-medium text-white transition-colors hover:bg-rose-700"
                >
                  <Lock className="h-3.5 w-3.5" />
                  Sign out of this device
                </button>
              </form>
            </div>
          </CardBody>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Security" />
            <CardBody className="space-y-3.5">
              <SecurityRow
                icon={KeyRound}
                label="Password"
                value="bcrypt hashed (cost 12)"
                ok
              />
              <SecurityRow
                icon={Shield}
                label="Session"
                value="JWT · HS256 · httpOnly cookie"
                ok
              />
              <SecurityRow
                icon={Lock}
                label="Multi-factor auth"
                value={account?.mfaEnabled ? "Enabled" : "Not enabled"}
                ok={!!account?.mfaEnabled}
              />
              <SecurityRow
                icon={Database}
                label="Data at rest"
                value="SQLite (dev) · Postgres-ready"
                ok
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="System" />
            <CardBody>
              <dl className="space-y-2.5 text-xs">
                <Row label="Application" value="DETECH v1.0.0" />
                <Row label="Academic year" value="2025/2026" />
                <Row label="Framework" value="Next.js 15 · React 19" />
                <Row label="ORM" value="Drizzle" />
                <Row label="Environment" value={process.env.NODE_ENV ?? "development"} />
              </dl>
            </CardBody>
          </Card>
        </div>
      </div>

      <Card className="mt-5 overflow-hidden">
        <CardHeader
          title="Your permissions"
          description={`Modules available to the ${ROLE_LABELS[session.role]} role`}
        />
        <Table>
          <thead>
            <tr>
              <Th>Module</Th>
              <Th>Read</Th>
              <Th>Create / edit</Th>
            </tr>
          </thead>
          <tbody>
            {modules.map((m) => (
              <Tr key={m.key}>
                <Td className="font-medium text-ink-900 capitalize">
                  {m.key.replace(/([A-Z])/g, " $1")}
                </Td>
                <Td>
                  <Badge tone="success">Allowed</Badge>
                </Td>
                <Td>
                  {m.write ? (
                    <Badge tone="brand">Allowed</Badge>
                  ) : (
                    <Badge tone="neutral">Read-only</Badge>
                  )}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium text-ink-500">{label}</dt>
      <dd className="mt-1 rounded-lg border border-ink-200 bg-ink-50 px-3 py-2 text-sm text-ink-800">
        {value}
      </dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-medium text-ink-800">{value}</dd>
    </div>
  );
}

function SecurityRow({
  icon: Icon,
  label,
  value,
  ok,
}: {
  icon: typeof Shield;
  label: string;
  value: string;
  ok?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-ink-900">{label}</p>
        <p className="truncate text-[11px] text-ink-500">{value}</p>
      </div>
      {ok ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
      ) : (
        <span className="text-[10px] text-amber-600">optional</span>
      )}
    </div>
  );
}
