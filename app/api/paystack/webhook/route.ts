import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(body)
    .digest("hex");

  if (hash !== req.headers.get("x-paystack-signature")) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);
  if (event.event !== "charge.success") return NextResponse.json({ ok: true });

  const { restaurant_id } = event.data.metadata ?? {};
  if (!restaurant_id) return NextResponse.json({ ok: true });

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Fetch all unpaid ledger rows for this restaurant
  const { data: unpaidRows } = await supabase
    .from("daily_ledger")
    .select("ledger_date, total_owed, paid_amount, platform_fees_paid")
    .eq("restaurant_id", restaurant_id)
    .eq("is_paid", false)
    .gt("total_owed", 0);

  for (const row of unpaidRows ?? []) {
    const amountPaid = Number(row.total_owed ?? 0);
    await supabase
      .from("daily_ledger")
      .update({
        is_paid: true,
        paystack_reference: event.data.reference,
        paid_at: new Date().toISOString(),
        paid_amount: Number(row.paid_amount ?? 0) + amountPaid,
        total_owed: 0,
        platform_fees_paid: Number(row.platform_fees_paid ?? 0) + amountPaid,
      } as never)
      .eq("restaurant_id", restaurant_id)
      .eq("ledger_date", row.ledger_date);
  }

  return NextResponse.json({ ok: true });
}
