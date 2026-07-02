import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { restaurant_id, table_number } = await request.json();

    if (!restaurant_id || !table_number) {
      return NextResponse.json(
        { error: "restaurant_id and table_number are required" },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data, error } = await supabase
      .from("active_tables")
      .upsert(
        {
          restaurant_id,
          table_number: String(table_number),
          active_token: crypto.randomUUID(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "restaurant_id,table_number",
        },
      )
      .select("active_token")
      .maybeSingle();

    if (error) {
      console.error("rotate-table-token error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { active_token: data?.active_token },
      { status: 200 },
    );
  } catch (error) {
    console.error("rotate-table-token error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
