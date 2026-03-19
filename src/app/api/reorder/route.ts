import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { isAuthenticated } from "@/lib/auth";

const ALLOWED_TABLES = ["todos", "decisions", "contacts", "notes"];

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { table, items } = await request.json();

  if (!ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Items required" }, { status: 400 });
  }

  const supabase = getSupabase();
  const results = await Promise.all(
    items.map(({ id, sort_order }: { id: string; sort_order: number }) =>
      supabase.from(table).update({ sort_order }).eq("id", id)
    )
  );

  const errors = results.filter((r) => r.error);
  if (errors.length > 0) {
    return NextResponse.json(
      { error: errors[0].error!.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
