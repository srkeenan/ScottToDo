import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const COOKIE_NAME = "scotttodo_auth";

export async function isAuthenticated(request?: NextRequest): Promise<boolean> {
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) return true;

  if (request) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      return authHeader.slice(7) === password;
    }
    const cookie = request.cookies.get(COOKIE_NAME);
    return cookie?.value === password;
  }

  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  return cookie?.value === password;
}

export function getCookieName() {
  return COOKIE_NAME;
}
