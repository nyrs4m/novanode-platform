import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Verify superadmin
    const { data: admin } = await serviceClient
      .from("novanode_admins")
      .select("id")
      .eq("email", user.email!)
      .maybeSingle();
    if (!admin)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { restaurant_id, updates } = await req.json();
    if (!restaurant_id || !updates) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { error } = await serviceClient
      .from("restaurants")
      .update(updates)
      .eq("id", restaurant_id);

    if (error) {
      console.error("update-restaurant error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("update-restaurant request failed:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
