import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic gate: visitors without a session cookie are sent to login before /account or /admin renders.
 * Real authorisation still happens on the server (requireUser / requireStaff) for every page and action.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has("dn_session")) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
