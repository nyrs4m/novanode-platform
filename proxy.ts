import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createClient } from "@supabase/supabase-js";

export async function proxy(request: NextRequest) {
  // Run session update first
  const response = await updateSession(request);

  // Only check suspension for dashboard/kds routes
  const suspendedMatch = request.nextUrl.pathname.match(
    /^\/(?!dashboard|kds|api|novanode|_next|login|_not-found)([^/]+)$/,
  );

  if (suspendedMatch && !request.nextUrl.pathname.includes('/suspended')) {
    const slug = suspendedMatch[1];
    const tableNumber = request.nextUrl.searchParams.get("table");
    const existingToken = request.nextUrl.searchParams.get("t");

    if (tableNumber && !existingToken) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );

        const { data: restaurant } = await supabase
          .from("restaurants")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();

        if (restaurant) {
          const { data: activeTable } = await supabase
            .from("active_tables")
            .select("active_token")
            .eq("restaurant_id", restaurant.id)
            .eq("table_number", tableNumber)
            .maybeSingle();

          if (activeTable?.active_token) {
            const redirectUrl = new URL(request.url);
            redirectUrl.searchParams.set("t", activeTable.active_token);
            return NextResponse.redirect(redirectUrl);
          }
        }
      } catch {
        // If token lookup fails, let the page handle it
      }
    }

    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data: r } = (await supabase
        .from("restaurants")
        .select("suspended_at")
        .eq("slug", slug)
        .not("suspended_at", "is", null)
        .maybeSingle()) as never;
      if (r) {
        return NextResponse.redirect(
          new URL(`/${slug}/suspended`, request.url),
        );
      }
    } catch {
      // If check fails, let the page handle it
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
