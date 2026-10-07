import type { NextRequest } from "next/server";

import { fail, handler, ok } from "@/lib/api";
import { authenticate, createSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Sets an httpOnly session cookie and returns the user.
 */
export const POST = handler(async (request: NextRequest) => {
  const body = await request.json().catch(() => ({}));
  const { email, password } = loginSchema.parse(body);

  const user = await authenticate(email, password);
  if (!user) return fail("Incorrect email or password", 401);

  await createSessionCookie(user);
  return ok({ user });
});
