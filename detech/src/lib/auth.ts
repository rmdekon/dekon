import "server-only";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { cache } from "react";

import { db } from "@/db";
import { users } from "@/db/schema";
import type { Role } from "@/lib/enums";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signToken,
  verifyToken,
  type SessionUser,
} from "@/lib/jwt";

export { SESSION_COOKIE, signToken, verifyToken };
export type { SessionUser };

/* ───────────────────────────── Passwords ───────────────────────────── */

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/* ─────────────────────────────── Session ─────────────────────────────── */

export async function createSessionCookie(user: SessionUser) {
  const token = await signToken(user);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/**
 * The currently signed-in user, or null.
 * `cache()` de-duplicates the work across a single server render pass.
 */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  return {
    id: payload.id,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    avatarUrl: payload.avatarUrl,
  };
});

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

/** Throws a 401 when there is no session — for API route handlers. */
export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new AuthError("Not authenticated", 401);
  return session;
}

/** Throws 401/403 — for API route handlers. */
export async function requireRole(...allowed: Role[]): Promise<SessionUser> {
  const session = await requireSession();
  if (!allowed.includes(session.role)) {
    throw new AuthError("You do not have access to this resource", 403);
  }
  return session;
}

/* ──────────────────────────── Authentication ──────────────────────────── */

export async function authenticate(
  email: string,
  password: string,
): Promise<SessionUser | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);

  if (!user || !user.isActive) return null;

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;

  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
    avatarUrl: user.avatarUrl,
  };
}
