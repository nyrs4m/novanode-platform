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

  const { restaurant_id, ledger_date } = event.data.metadata ?? {};
  if (!restaurant_id || !ledger_date) return NextResponse.json({ ok: true });

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase
    .from("daily_ledger")
    .update({
      is_paid: true,
      paystack_reference: event.data.reference,
      paid_at: new Date().toISOString(),
    })
    .eq("restaurant_id", restaurant_id)
    .eq("ledger_date", ledger_date);

  return NextResponse.json({ ok: true });
}