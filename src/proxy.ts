import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * SECURITY: Edge proxy protects dashboard and API routes.
 * Unauthenticated requests are redirected/rejected before reaching
 * the route handler, providing defense-in-depth.
 *
 * Excluded paths:
 * - /api/auth/* — NextAuth's own endpoints (login, callback, etc.)
 * - /api/webhooks/* — GitHub webhook endpoint (uses HMAC, not session)
 * - /api/jobs/* — Cron endpoint (uses CRON_SECRET, not session)
 * - / — Public landing page
 */
export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    // For API routes, return 401 JSON response
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // For pages, redirect to sign-in
    const signInUrl = new URL("/", request.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/dashboard/:path*",
    "/api/repos/:path*",
    "/api/rules/:path*",
  ],
};
