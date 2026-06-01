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

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", restaurant_slug)
    .maybeSingle();

  console.log("RESTAURANT:", restaurant);
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

  // ── Stats views ────────────────────────────────────────────────────────
  const [
    dailyR,
    monthlyR,
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
      .from("restaurant_stats" as never)
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .eq("order_month", thisMonth),
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
      .eq("is_starter_order", false)
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

  const dailyStats =
    dailyR.status === "fulfilled"
      ? (dailyR.value.data as RestaurantStats | null)
      : null;
  const monthlyStats =
    monthlyR.status === "fulfilled"
      ? ((monthlyR.value.data as RestaurantStats[] | null) ?? [])
      : [];
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

  return (
    <DashboardHome
      restaurant={restaurant}
      staff={staff}
      dailyStats={dailyStats ?? null}
      monthlyStats={monthlyStats ?? []}
      topItems={topItems ?? []}
      peakHours={peakHours ?? []}
      recentOrders={recentOrders ?? []}
      activeOrdersCount={activeOrdersCount ?? 0}
      activeTablesCount={activeTablesCount ?? 0}
      signalsCount={signalsCount ?? 0}
    />
  );
}
