import { handler, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { MODULE_ACCESS } from "@/lib/rbac";

export const dynamic = "force-dynamic";

/** GET /api/auth/me — current user plus the modules their role can open. */
export const GET = handler(async () => {
  const user = await requireSession();
  const modules = Object.entries(MODULE_ACCESS)
    .filter(([, roles]) => roles.includes(user.role))
    .map(([key]) => key);

  return ok({ user, modules });
});
