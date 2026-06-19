"use client";

import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, ChevronRight, Shield } from "lucide-react";

function NovaNodeLoginInner() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();
  const [showUrlError, setShowUrlError] = useState(false);
  async function handleLogin() {
    setLoading(true);
    setError("");
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) {
      setError("Invalid credentials");
      setLoading(false);
      return;
    }
    router.push("/novanode");
  }

  return (
    <div className="auth-page">
      <div
        className="ambient-gold"
        style={{
          width: 400,
          height: 400,
          top: -120,
          left: -120,
          position: "absolute",
        }}
      />
      <div className="auth-card">
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: "var(--gold-faint)",
              border: "1px solid var(--gold-dim)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: "var(--shadow-glow)",
            }}
          >
            <Shield size={28} color="var(--gold-glow)" />
          </div>
          <h1 className="t-heading" style={{ marginBottom: 6 }}>
            NovaNode Inc.
          </h1>
          <p className="t-eyebrow">Super Admin Access</p>
        </div>
        <div className="divider" style={{ marginBottom: 28 }} />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          <div style={{ marginBottom: 14 }}>
            <label className="nn-label">Email</label>
            <input
              type="email"
              className="nn-input"
              placeholder="admin@novanode.com"
              value={email}
              onChange={(e) => {
                // It's generally good practice to use autocomplete="email" or "username" for email fields.
                setEmail(e.target.value);
                setError("");
              }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label className="nn-label">Password</label>
            <input
              type="password" // Corrected: autocomplete to autoComplete
              autoComplete="current-password"
              className="nn-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
          {error && (
            <p className="nn-error" style={{ marginBottom: 14 }}>
              {error}
            </p>
          )}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Verifying...
              </>
            ) : (
              <>
                Access Panel <ChevronRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function NovaNodeLoginPage() {
  return (
    <Suspense>
      <NovaNodeLoginInner />
    </Suspense>
  );
}
