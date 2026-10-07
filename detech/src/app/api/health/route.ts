import { sql } from "drizzle-orm";

import { db } from "@/db";
import { handler, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Liveness + database readiness probe (used by Docker/K8s healthchecks). */
export const GET = handler(async () => {
  const started = Date.now();
  await db.get(sql`select 1`);
  return ok({
    status: "healthy",
    service: "detech",
    version: "1.0.0",
    database: "connected",
    latencyMs: Date.now() - started,
    timestamp: new Date().toISOString(),
  });
});
