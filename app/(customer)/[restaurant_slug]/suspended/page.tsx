"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface PageProps {
  params: Promise<{ restaurant_slug: string }>;
}

export default function SuspendedPage({ params }: PageProps) {
  const { restaurant_slug } = React.use(params);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("restaurants")
        .select("is_active, name")
        .eq("slug", restaurant_slug)
        .maybeSingle();
      if (data?.is_active) {
        router.push(`/${restaurant_slug}`);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [restaurant_slug, router, supabase]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#022c22",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <p style={{ fontSize: 48, marginBottom: 16 }}>🔒</p>
        <h1
          style={{
            color: "#FDFBF7",
            fontWeight: 900,
            fontSize: 24,
            marginBottom: 8,
          }}
        >
          Temporarily Unavailable
        </h1>
        <p
          style={{
            color: "rgba(253,251,247,0.5)",
            fontSize: 13,
            lineHeight: 1.6,
            marginBottom: 8,
          }}
        >
          This restaurant is temporarily unavailable.
        </p>
        <p
          style={{
            color: "rgba(217,119,6,0.7)",
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          Please check back later or contact the restaurant directly.
        </p>
      </div>
    </div>
  );
}
