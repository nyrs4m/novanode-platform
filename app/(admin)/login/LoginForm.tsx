"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ChevronRight, Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? `/dashboard/starbite`;

  const supabase = createClient();

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password");
      return;
    }
    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
      return;
    }

    router.push(next);
  }

  return (
    <div className="auth-page">
      <div
        className="ambient-gold"
        style={{ width: 400, height: 400, top: -120, left: -120 }}
      />
      <div
        className="ambient-emerald"
        style={{ width: 300, height: 300, bottom: -80, right: -80 }}
      />

      <div className="auth-card">
        {/* Logo */}
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
              fontSize: 28,
            }}
          >
            🍽️
          </div>
          <h1 className="t-heading" style={{ marginBottom: 8 }}>
            Staff Login
          </h1>
          <p className="t-body">Sign in to access your restaurant dashboard</p>
        </div>

        <div className="divider" style={{ marginBottom: 32 }} />

        {/* Email */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <label className="nn-label">Email address</label>
            <input
              type="email"
              placeholder="you@restaurant.com"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              autoFocus
              className={`nn-input ${error ? "error" : ""}`}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 12, position: "relative" }}>
            <label className="nn-label">Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className={`nn-input ${error ? "error" : ""}`}
                style={{ paddingRight: 52 }}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--cream-35)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="nn-error" style={{ marginBottom: 16 }}>
              {error}
            </p>
          )}

          <p className="nn-hint" style={{ marginBottom: 28 }}>
            Restaurant staff accounts are created by your NovaNode
            administrator.
          </p>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>
                <Loader2
                  size={18}
                  style={{ animation: "spin 1s linear infinite" }}
                />{" "}
                Signing in...
              </>
            ) : (
              <>
                Sign In <ChevronRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
