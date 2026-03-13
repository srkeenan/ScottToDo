import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page and auth API
  if (pathname === "/login" || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // API routes: check Bearer token or cookie
  if (pathname.startsWith("/api/")) {
    const authHeader = request.headers.get("authorization");
    const cookie = request.cookies.get("scotttodo_auth");
    const password = process.env.DASHBOARD_PASSWORD;

    if (!password) return NextResponse.next();

    if (authHeader?.startsWith("Bearer ") && authHeader.slice(7) === password) {
      return NextResponse.next();
    }
    if (cookie?.value === password) {
      return NextResponse.next();
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Page routes: check cookie, redirect to login
  const cookie = request.cookies.get("scotttodo_auth");
  const password = process.env.DASHBOARD_PASSWORD;

  if (!password) return NextResponse.next();

  if (cookie?.value !== password) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
