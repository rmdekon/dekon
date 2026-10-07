/**
 * Edge-safe JWT helpers.
 *
 * This module must stay free of Node-only imports (`bcryptjs`, the database,
 * `server-only`) because `src/middleware.ts` runs on the Edge runtime.
 */
import { jwtVerify, SignJWT } from "jose";

import type { Role } from "@/lib/enums";

export const SESSION_COOKIE = "detech_session";

export const SESSION_MAX_AGE = Number(
  process.env.SESSION_MAX_AGE ?? 60 * 60 * 24 * 7,
);

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string | null;
};

export type SessionPayload = SessionUser & { exp?: number; iat?: number };

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "AUTH_SECRET is missing or too short. Set a long random value in .env",
      );
    }
    // Dev fallback so `npm run dev` works before `.env` is filled in.
    return new TextEncoder().encode("detech-insecure-development-secret-key");
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setIssuer("detech")
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifyToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: "detech",
    });
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      role: payload.role as Role,
      avatarUrl: (payload.avatarUrl as string | null) ?? null,
      exp: payload.exp,
      iat: payload.iat,
    };
  } catch {
    return null;
  }
}
