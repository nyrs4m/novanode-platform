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

  // Verify with Paystack
  const verify = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    },
  );
  const data = await verify.json();

  if (data.status && data.data.status === "success") {
    const { restaurant_id, ledger_date } = data.data.metadata;

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: ledgerData } = await supabase
      .from("daily_ledger")
      .select("total_owed, paid_amount, platform_fees_paid")
      .eq("restaurant_id", restaurant_id)
      .eq("ledger_date", ledger_date)
      .maybeSingle();
    const ledgerRow = ledgerData as LedgerPaymentRow | null;
    const amountPaid = Number(ledgerRow?.total_owed ?? 0);
    const paidAmount = Number(ledgerRow?.paid_amount ?? 0) + amountPaid;
    const platformFeesPaid =
      Number(ledgerRow?.platform_fees_paid ?? 0) + amountPaid;

    await supabase
      .from("daily_ledger")
      .update({
        is_paid: true,
        paystack_reference: reference,
        paid_at: new Date().toISOString(),
        paid_amount: paidAmount,
        total_owed: 0,
        platform_fees_paid: platformFeesPaid,
      } as never)
      .eq("restaurant_id", restaurant_id)
      .eq("ledger_date", ledger_date);

    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("slug")
      .eq("id", restaurant_id)
      .maybeSingle();

    return NextResponse.redirect(
      new URL(`/kds/${restaurant?.slug ?? ""}?payment=success`, req.url),
    );
  }

  return NextResponse.redirect(new URL("/?payment=failed", req.url));
}
