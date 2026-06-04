import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import SuperAdminPanel from "./components/SuperAdminPanel";

export default async function NovaNodeAdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/novanode/login");

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  // Check if super admin
  const { data: admin } = await serviceClient
    .from("novanode_admins")
    .select("*")
    .eq("email", user.email!)
    .maybeSingle();

  if (!admin) {
    redirect("/novanode/login?error=unauthorized");
  }

  // Fetch all restaurants
  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("*")
    .order("owing_funds", { ascending: false })
    .order("created_at", { ascending: false });

  // Fetch today's ledger for all restaurants
  const today = new Date().toISOString().split("T")[0];
  const { data: ledgers } = await supabase
    .from("daily_ledger")
    .select("*")
    .eq("ledger_date", today);

  // Platform stats
  const { count: totalOrders } = await serviceClient
    .from("orders")
    .select("*", { count: "exact", head: true });

  const { count: totalSessions } = await serviceClient
    .from("table_sessions")
    .select("*", { count: "exact", head: true });

  return (
    <SuperAdminPanel
      adminEmail={user.email!}
      restaurants={restaurants ?? []}
      ledgers={ledgers ?? []}
      totalOrders={totalOrders ?? 0}
      totalSessions={totalSessions ?? 0}
    />
  );
}
