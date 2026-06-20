import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const restaurantId = req.nextUrl.searchParams.get("restaurant_id");
  if (!restaurantId)
    return NextResponse.json(
      { error: "Missing restaurant_id" },
      { status: 400 },
    );

  // Last 30 days range
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);

  // Fetch completed sessions in range
  const { data: sessions } = await supabase
    .from("table_sessions")
    .select("session_token, closed_at")
    .eq("restaurant_id", restaurantId)
    .eq("status", "completed")
    .gte("closed_at", start.toISOString())
    .lte("closed_at", end.toISOString());

  const tokens = sessions?.map((s) => s.session_token) ?? [];

  // Fetch orders for those sessions
  let orders: { total_amount: number; created_at: string | null }[] = [];
  if (tokens.length > 0) {
    const { data } = await supabase
      .from("orders")
      .select("total_amount, created_at")
      .eq("restaurant_id", restaurantId)
      .in("session_token", tokens)
      .neq("status", "Cancelled");
    orders = data ?? [];
  }

  // Build day-by-day map
  const dayMap: Record<string, { revenue: number; orders: number }> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().split("T")[0];
    dayMap[key] = { revenue: 0, orders: 0 };
  }

  orders.forEach((o) => {
    const key = (o.created_at ?? "").split("T")[0];
    if (dayMap[key]) {
      dayMap[key].revenue += o.total_amount ?? 0;
      dayMap[key].orders += 1;
    }
  });

  const daily = Object.entries(dayMap).map(([date, vals]) => ({
    date,
    revenue: vals.revenue,
    orders: vals.orders,
  }));

  // Fetch recent feedback
  const { data: feedback } = await supabase
    .from("order_feedback")
    .select("rating, review, customer_name, created_at, staff_id")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .limit(20);

  // Resolve staff names
  const staffIds = [
    ...new Set(
      (feedback ?? [])
        .map((f) => f.staff_id)
        .filter((id): id is string => !!id),
    ),
  ];
  const staffMap: Record<string, string> = {};
  if (staffIds.length > 0) {
    const { data: staffRows } = await supabase
      .from("restaurant_staff")
      .select("id, display_name")
      .in("id", staffIds);
    staffRows?.forEach((s: { id: string; display_name: string | null }) => {
      staffMap[s.id] = s.display_name ?? "";
    });
  }

  const feedbackWithStaff = (feedback ?? []).map((f) => ({
    ...f,
    staff_name: f.staff_id ? (staffMap[f.staff_id] ?? null) : null,
  }));

  return NextResponse.json({ daily, feedback: feedbackWithStaff });
}
