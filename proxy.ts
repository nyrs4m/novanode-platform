import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  // Run session update first
  const response = await updateSession(request);

  // Only check suspension for dashboard/kds routes
  const suspendedMatch = request.nextUrl.pathname.match(
  /^\/(?!dashboard|kds|api|novanode|_next)([^/]+)(?!\/suspended)/,
);

  if (suspendedMatch && !request.nextUrl.pathname.includes('/suspended')) {
    const slug = suspendedMatch[1];
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
