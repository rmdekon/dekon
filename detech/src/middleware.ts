import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifyToken } from "@/lib/jwt";
import { canAccess, moduleForPath } from "@/lib/rbac";

/**
 * Edge route guard.
 *
 *  - `/dashboard/**` requires a valid session cookie
 *  - each dashboard module is additionally checked against the RBAC matrix
 *  - signed-in users visiting `/login` are bounced to their dashboard
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifyToken(token) : null;

  if (pathname === "/login" || pathname === "/register") {
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    const moduleKey = moduleForPath(pathname);
    if (moduleKey && !canAccess(session.role, moduleKey)) {
      return NextResponse.redirect(new URL("/dashboard?denied=1", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
