import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

/**
 * Database connection.
 *
 * Local dev  -> `DATABASE_URL="file:./dev.db"` (a plain SQLite file, zero setup)
 * Production -> any libSQL/Turso URL, or swap this file for
 *               `drizzle-orm/node-postgres` to run on PostgreSQL.
 *
 * The client is cached on `globalThis` so Next.js hot-reload in development
 * does not open a new connection on every edit.
 */
const url = process.env.DATABASE_URL ?? "file:./dev.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

const globalForDb = globalThis as unknown as {
  __detechClient?: Client;
};

const client = globalForDb.__detechClient ?? createClient({ url, authToken });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__detechClient = client;
}

export const db = drizzle(client, { schema });
export { schema, client };
export type DB = typeof db;
