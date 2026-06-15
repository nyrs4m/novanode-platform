import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

type LedgerPaymentRow = {
  total_owed?: number | null;
  paid_amount?: number | null;
  platform_fees_paid?: number | null;
};

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference");
  if (!reference) return NextResponse.redirect(new URL("/", req.url));

  const verify = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    },
  );
  const data = await verify.json();

  if (data.status && data.data.status === "success") {
    const { restaurant_id, ledger_date, settle_all_unpaid, unpaid_dates } = data.data.metadata;
    console.log('Callback metadata received:', JSON.stringify(data.data.metadata))

    if (!restaurant_id || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Paystack Callback Error: Missing restaurant_id or SUPABASE_SERVICE_ROLE_KEY", {
        restaurant_id,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      });
      return NextResponse.redirect(
        new URL("/?payment=failed", process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Fetch ALL unpaid ledger dates for this restaurant
const { data: unpaidRows } = await supabase
  .from('daily_ledger')
  .select('ledger_date, total_owed, paid_amount, platform_fees_paid')
  .eq('restaurant_id', restaurant_id)
  .eq('is_paid', false)
  .gt('total_owed', 0)

const datesToSettle = unpaidRows ?? []

for (const row of datesToSettle) {
  const amountPaid = Number(row.total_owed ?? 0)
  const paidAmount = Number(row.paid_amount ?? 0) + amountPaid
  const platformFeesPaid = Number(row.platform_fees_paid ?? 0) + amountPaid

  await supabase
    .from('daily_ledger')
    .update({
      is_paid: true,
      paystack_reference: reference,
      paid_at: new Date().toISOString(),
      paid_amount: paidAmount,
      total_owed: 0,
      platform_fees_paid: platformFeesPaid,
    } as never)
    .eq('restaurant_id', restaurant_id)
    .eq('ledger_date', row.ledger_date)
}

    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("slug")
      .eq("id", restaurant_id)
      .limit(1)
      .single();

    if (restaurantError) {
      console.error("Paystack Callback: Restaurant lookup failed:", restaurantError);
      return NextResponse.redirect(
        new URL("/?payment=success", process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    if (!restaurant?.slug) {
      return NextResponse.redirect(
        new URL("/?payment=success", process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    return NextResponse.redirect(
      new URL(`/kds/${restaurant.slug}?payment=success`, process.env.NEXT_PUBLIC_APP_URL!)
    );
  }

  return NextResponse.redirect(
    new URL("/?payment=failed", process.env.NEXT_PUBLIC_APP_URL!)
  );
}