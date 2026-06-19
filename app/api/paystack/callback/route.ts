import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

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

  if (!data.status || data.data.status !== "success") {
    return NextResponse.redirect(
      new URL("/?payment=failed", process.env.NEXT_PUBLIC_APP_URL!),
    );
  }

  const { restaurant_id, ledger_date } = data.data.metadata;
  console.log(
    "Callback metadata received:",
    JSON.stringify(data.data.metadata),
  );

  if (!restaurant_id || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      "Paystack Callback Error: Missing restaurant_id or SUPABASE_SERVICE_ROLE_KEY",
    );
    return NextResponse.redirect(
      new URL("/?payment=failed", process.env.NEXT_PUBLIC_APP_URL!),
    );
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const today = new Date().toISOString().split("T")[0];
  const isOutstandingSettlement = reference.includes("-outstanding-");

  let datesToSettle: {
    ledger_date: string;
    total_owed: number | null;
    paid_amount: number | null;
    platform_fees_paid: number | null;
  }[] = [];

  if (isOutstandingSettlement) {
    // Settle ONLY previous unpaid days — never touch today's ledger
    const { data: unpaidRows } = await supabase
      .from("daily_ledger")
      .select("ledger_date, total_owed, paid_amount, platform_fees_paid")
      .eq("restaurant_id", restaurant_id)
      .eq("is_paid", false)
      .gt("total_owed", 0)
      .lt("ledger_date", today);
    datesToSettle = unpaidRows ?? [];
  } else {
    // Settle only today's ledger row — never touch previous days
    const { data: singleRow } = await supabase
      .from("daily_ledger")
      .select("ledger_date, total_owed, paid_amount, platform_fees_paid")
      .eq("restaurant_id", restaurant_id)
      .eq("ledger_date", today)
      .maybeSingle();
    if (singleRow) datesToSettle = [singleRow];
  }

  for (const row of datesToSettle) {
    const amountPaid = Number(row.total_owed ?? 0);
    await supabase
      .from("daily_ledger")
      .update({
        is_paid: true,
        paystack_reference: reference,
        paid_at: new Date().toISOString(),
        paid_amount: Number(row.paid_amount ?? 0) + amountPaid,
        total_owed: 0,
        platform_fees_paid: Number(row.platform_fees_paid ?? 0) + amountPaid,
      } as never)
      .eq("restaurant_id", restaurant_id)
      .eq("ledger_date", row.ledger_date);
  }

  // Check if any unpaid ledger rows remain after settlement
  const { data: remainingUnpaid } = await supabase
    .from("daily_ledger")
    .select("id")
    .eq("restaurant_id", restaurant_id)
    .eq("is_paid", false)
    .gt("total_owed", 0)
    .limit(1);

  const fullySettled = !remainingUnpaid || remainingUnpaid.length === 0;

  if (fullySettled) {
    await supabase
      .from("restaurants")
      .update({
        is_active: true,
        payment_overdue: false,
        suspended_at: null,
        suspension_reason: null,
      } as never)
      .eq("id", restaurant_id);
  }

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("slug")
    .eq("id", restaurant_id)
    .limit(1)
    .single();

  if (!restaurant?.slug) {
    return NextResponse.redirect(
      new URL("/?payment=success", process.env.NEXT_PUBLIC_APP_URL!),
    );
  }

  return NextResponse.redirect(
    new URL(
      `/kds/${restaurant.slug}?payment=success`,
      process.env.NEXT_PUBLIC_APP_URL!,
    ),
  );
}
