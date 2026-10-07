import "server-only";

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AuthError } from "@/lib/auth";

/** Successful JSON envelope. */
export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

/** Error JSON envelope. */
export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ ok: false, error: message, details }, { status });
}

/**
 * Wraps a route handler so auth/validation failures become clean JSON
 * instead of 500s with stack traces.
 */
export function handler<Args extends unknown[]>(
  fn: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof AuthError) {
        return fail(error.message, error.status);
      }
      if (error instanceof ZodError) {
        return fail("Validation failed", 422, error.issues);
      }
      if (error instanceof Error && /UNIQUE constraint/i.test(error.message)) {
        return fail("A record with those unique details already exists", 409);
      }
      console.error("[api]", error);
      return fail("Internal server error", 500);
    }
  };
}

/** Parses `?page=&pageSize=` with sane bounds. */
export function pagination(url: URL, defaultSize = 25) {
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
  const pageSize = Math.min(
    200,
    Math.max(1, Number(url.searchParams.get("pageSize") ?? defaultSize) || defaultSize),
  );
  return { page, pageSize, offset: (page - 1) * pageSize };
}
