import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async () => {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // 1. Mark yesterday's unpaid invoices as Failed, roll into owing_funds
  const { data: unpaid } = await supabase
    .from("daily_invoices")
    .select("id, restaurant_id, total_fees")
    .eq("invoice_date", yesterday)
    .eq("status", "Pending");

  for (const inv of unpaid ?? []) {
    await supabase
      .from("daily_invoices")
      .update({ status: "Failed" })
      .eq("id", inv.id);

    await supabase.rpc("increment_owing_funds", {
      p_restaurant_id: inv.restaurant_id,
      p_amount: inv.total_fees,
    });
  }

  // 2. Aggregate today's platform fees per restaurant
  const { data: fees } = await supabase
    .from("orders")
    .select("restaurant_id, platform_fee")
    .eq("status", "Served")
    .gte("created_at", `${today}T00:00:00Z`)
    .lt("created_at", `${today}T23:59:59Z`);

  const totals: Record<string, number> = {};
  for (const row of fees ?? []) {
    if (!row.restaurant_id) continue;
    totals[row.restaurant_id] = (totals[row.restaurant_id] ?? 0) + Number(row.platform_fee);
  }

  // 3. Upsert daily invoices
  for (const [restaurant_id, total_fees] of Object.entries(totals)) {
    await supabase.from("daily_invoices").upsert({
      restaurant_id,
      invoice_date: today,
      total_fees: Math.round(total_fees * 100) / 100,
      status: "Pending",
    }, { onConflict: "restaurant_id,invoice_date" });
  }

  return new Response(JSON.stringify({ ok: true, processed: Object.keys(totals).length }));
});