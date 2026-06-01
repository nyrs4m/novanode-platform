import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import KDSBoard from "./components/KDSBoard";

interface PageProps {
  params: Promise<{ restaurant_slug: string }>;
}

export default async function KDSPage({ params }: PageProps) {
  const { restaurant_slug } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/kds/${restaurant_slug}`);

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", restaurant_slug)
    .maybeSingle();

  if (!restaurant) return notFound();

  const { data: staff } = await supabase
    .from("restaurant_staff")
    .select("*")
    .eq("user_id", user.id)
    .eq("restaurant_id", restaurant.id)
    .limit(1)
    .maybeSingle();

  if (!staff) return notFound();

  // Fetch today's active orders
  const today = new Date().toISOString().split("T")[0];
  const todayStart = `${today}T00:00:00.000Z`;
  const tomorrowStartDate = new Date(todayStart);
  tomorrowStartDate.setUTCDate(tomorrowStartDate.getUTCDate() + 1);
  const tomorrowStart = tomorrowStartDate.toISOString();

  const [
    { data: orders },
    { data: sessions },
    { data: signals },
    { data: menuItems },
    { data: todayOrders },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .neq("status", "Completed")
      .neq("status", "Cancelled")
      .gte("created_at", todayStart)
      .order("created_at", { ascending: true }),
    supabase
      .from("table_sessions")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("waiter_signals")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .eq("is_resolved", false)
      .order("created_at", { ascending: true }),
    supabase
      .from("menu_items")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .order("name_en"),
    supabase
      .from("orders")
      .select("total_amount, status")
      .eq("restaurant_id", restaurant.id)
      .eq("is_starter_order", false)
      .gte("created_at", todayStart)
      .lt("created_at", tomorrowStart),
  ]);

  const todayRevenue =
    todayOrders
      ?.filter((o) => o.status === "Served")
      .reduce((s, o) => s + Number(o.total_amount), 0) ?? 0;
  const todayCount = todayOrders?.length ?? 0;

  return (
    <KDSBoard
      restaurant={restaurant}
      initialOrders={orders ?? []}
      initialSessions={sessions ?? []}
      initialSignals={signals ?? []}
      menuItems={menuItems ?? []}
      todayRevenue={todayRevenue}
      todayCount={todayCount}
    />
  );
}
