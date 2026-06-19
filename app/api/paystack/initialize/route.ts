import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { restaurant_id, ledger_date, amount_kobo, email, settle_all_unpaid } =
    await req.json();

  const response = await fetch(
    "https://api.paystack.co/transaction/initialize",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amount_kobo,
        currency: "GHS",
        reference: `novanode-${restaurant_id}-${settle_all_unpaid ? "outstanding" : ledger_date}-${Date.now()}`,
        metadata: { restaurant_id, ledger_date },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/paystack/callback`,
      }),
    },
  );

  const data = await response.json();
  if (!data.status)
    return NextResponse.json({ error: data.message }, { status: 400 });

  return NextResponse.json({
    authorization_url: data.data.authorization_url,
    reference: data.data.reference,
  });
}
