import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import DashboardHome from "./components/DashboardHome";
import type {
  RestaurantStats,
  MenuItemStats,
  PeakHourStats,
} from "@/types/database.types";
import type { Tables } from "@/types/database.types";

type Order = Tables<"orders">;
type RevenueOrder = Pick<Order, "total_amount">;

interface PageProps {
  params: Promise<{ restaurant_slug: string }>;
}

export default async function DashboardPage({ params }: PageProps) {
  const { restaurant_slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/dashboard/${restaurant_slug}`);

  // Block superadmin accounts from restaurant routes
  const { data: isAdmin } = await supabase
    .from("novanode_admins")
    .select("email")
    .eq("email", user.email!)
    .maybeSingle();
  if (isAdmin) redirect("/novanode");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", restaurant_slug)
    .maybeSingle();

  if (!restaurant) {
    return notFound();
  }

  const { data: staffRows } = await supabase
    .from("restaurant_staff")
    .select("*")
    .eq("user_id", user.id)
    .eq("restaurant_id", restaurant.id)
    .limit(1);

  const staff = staffRows?.[0] ?? null;

  if (!staff) {
    return notFound();
  }

  const today = new Date().toISOString().split("T")[0];
  const thisMonth = today.slice(0, 7);
  const todayStart = `${today}T00:00:00.000Z`;
  const tomorrowStartDate = new Date(todayStart);
  tomorrowStartDate.setUTCDate(tomorrowStartDate.getUTCDate() + 1);
  const tomorrowStart = tomorrowStartDate.toISOString();

  // Fetch completed session tokens for this month
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const { data: monthSessions } = await supabase
    .from('table_sessions')
    .select('session_token')
    .eq('restaurant_id', restaurant.id)
    .eq('status', 'completed')
    .gte('closed_at', monthStart.toISOString())

  const monthTokens = monthSessions?.map(s => s.session_token) ?? []

  let monthRevenue = 0
  let monthCount = 0

  if (monthTokens.length > 0) {
    const { data: monthOrders } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('restaurant_id', restaurant.id)
      .in('session_token', monthTokens)
      .neq('status', 'Cancelled')

    monthRevenue = monthOrders?.reduce((sum, o) => sum + (o.total_amount ?? 0), 0) ?? 0
    monthCount = monthSessions?.length ?? 0
  }

  // Fetch completed sessions first (in parallel with stats)
  const completedSessionsResult = await supabase
    .from("table_sessions")
    .select("session_token")
    .eq("restaurant_id", restaurant.id)
    .eq("status", "completed")
    .gte("closed_at", todayStart)
    .lt("closed_at", tomorrowStart);

  const completedSessions = completedSessionsResult.data ?? [];
  const completedSessionTokens = completedSessions.map((s) => s.session_token);

  // ── Stats views ────────────────────────────────────────────────────────
  const [
    dailyR,
    topR,
    peakR,
    recentR,
    activeOrdersR,
    activeTablesR,
    signalsR,
  ] = await Promise.allSettled([
    supabase
      .from("restaurant_stats" as never)
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .eq("order_date", today)
      .maybeSingle(),
    supabase
      .from("menu_item_stats" as never)
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .eq("order_month", thisMonth)
      .order("total_quantity", { ascending: false })
      .limit(5),
    supabase
      .from("peak_hours_stats" as never)
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .order("order_count", { ascending: false })
      .limit(6),
    supabase
      .from("orders")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("restaurant_id", restaurant.id)
      .in("status", ["Pending", "Preparing"]),
    supabase
      .from("table_sessions")
      .select("*", { count: "exact", head: true })
      .eq("restaurant_id", restaurant.id)
      .eq("is_active", true),
    supabase
      .from("waiter_signals")
      .select("*", { count: "exact", head: true })
      .eq("restaurant_id", restaurant.id)
      .eq("is_resolved", false),
  ]);

  // Fetch revenue orders separately after getting completed sessions
  let todayRevenueOrders: RevenueOrder[] = [];
  if (completedSessionTokens.length > 0) {
    const { data } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("restaurant_id", restaurant.id)
      .in("session_token", completedSessionTokens)
      .neq("status", "Cancelled");
    todayRevenueOrders = data ?? [];
  }

  const dailyStats =
    dailyR.status === "fulfilled"
      ? (dailyR.value.data as RestaurantStats | null)
      : null;
  const topItems =
    topR.status === "fulfilled"
      ? ((topR.value.data as MenuItemStats[] | null) ?? [])
      : [];
  const peakHours =
    peakR.status === "fulfilled"
      ? ((peakR.value.data as PeakHourStats[] | null) ?? [])
      : [];
  const recentOrders =
    recentR.status === "fulfilled"
      ? ((recentR.value.data as Order[] | null) ?? [])
      : [];
  const activeOrdersCount =
    activeOrdersR.status === "fulfilled" ? (activeOrdersR.value.count ?? 0) : 0;
  const activeTablesCount =
    activeTablesR.status === "fulfilled" ? (activeTablesR.value.count ?? 0) : 0;
  const signalsCount =
    signalsR.status === "fulfilled" ? (signalsR.value.count ?? 0) : 0;
  const todayRevenueTotal = todayRevenueOrders.reduce(
    (s, o) => s + Number(o.total_amount),
    0,
  );

  return (
    <DashboardHome
      restaurant={restaurant}
      staff={staff}
      dailyStats={dailyStats ?? null}
      todayRevenueOverride={todayRevenueTotal}
      monthRevenue={monthRevenue}
      monthCount={monthCount}
      topItems={topItems ?? []}
      peakHours={peakHours ?? []}
      recentOrders={recentOrders ?? []}
      activeOrdersCount={activeOrdersCount ?? 0}
      activeTablesCount={activeTablesCount ?? 0}
      signalsCount={signalsCount ?? 0}
    />
  );
}
