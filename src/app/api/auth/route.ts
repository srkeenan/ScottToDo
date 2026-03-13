import { NextRequest, NextResponse } from "next/server";
import { getCookieName } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const expected = process.env.DASHBOARD_PASSWORD;

  if (!expected || password === expected) {
    const response = NextResponse.json({ ok: true });
    response.cookies.set(getCookieName(), expected || "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
    return response;
  }

  return NextResponse.json({ error: "Invalid password" }, { status: 401 });
}
