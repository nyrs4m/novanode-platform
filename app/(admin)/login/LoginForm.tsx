"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ChevronRight, Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpFocused, setOtpFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [error, setError] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? `/dashboard/starbite`;

  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    if (resendIn <= 0) return;

    const timer = window.setTimeout(() => {
      setResendIn((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendIn]);

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

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
    });

    await supabase.auth.signOut({ scope: "local" });

    if (otpError) {
      setError("We could not send a verification code. Please try again.");
      setLoading(false);
      return;
    }

    setStep("otp");
    setOtpCode("");
    setResendIn(30);
    setLoading(false);
  }

  async function handleOtpVerify() {
    if (otpCode.length !== 6) {
      setError("Enter the 6-digit code sent to your email.");
      return;
    }

    setLoading(true);
    setError("");

    const { error: otpError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otpCode,
      type: "email",
    });

    if (otpError) {
      const message = otpError.message.toLowerCase();
      setError(
        message.includes("expired")
          ? "This code has expired. Please request a new one."
          : "That code is incorrect. Please check it and try again.",
      );
      setLoading(false);
      return;
    }

    router.push(next);
  }

  async function handleResendCode() {
    if (resendIn > 0 || resendLoading) return;

    setResendLoading(true);
    setError("");

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
    });

    if (otpError) {
      setError("We could not resend the code. Please try again.");
      setResendLoading(false);
      return;
    }

    setOtpCode("");
    setResendIn(30);
    setResendLoading(false);
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
            {step === "credentials" ? "Staff Login" : "Verify Email"}
          </h1>
          <p className="t-body">
            {step === "credentials"
              ? "Sign in to access your restaurant dashboard"
              : "Enter the 6-digit code sent to your email"}
          </p>
        </div>

        <div className="divider" style={{ marginBottom: 32 }} />

        {step === "credentials" ? (
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
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    minWidth: 44,
                    minHeight: 44,
                    background: "none",
                    border: "none",
                    color: "var(--cream-35)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
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
                  Sending code...
                </>
              ) : (
                <>
                  Continue <ChevronRight size={18} />
                </>
              )}
            </button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleOtpVerify();
            }}
          >
            <div style={{ marginBottom: 18 }}>
              <label className="nn-label" style={{ textAlign: "center" }}>
                Verification code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoComplete="one-time-code"
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setError("");
                }}
                onFocus={() => setOtpFocused(true)}
                onBlur={() => setOtpFocused(false)}
                autoFocus
                className={`nn-input ${error ? "error" : ""}`}
                style={{
                  minHeight: 64,
                  background: "var(--theme-surface)",
                  borderColor:
                    otpFocused || otpCode.length > 0
                      ? "var(--theme-accent)"
                      : "var(--gold-dim)",
                  textAlign: "center",
                  fontSize: 28,
                  fontWeight: 800,
                  letterSpacing: "0.18em",
                  fontVariantNumeric: "tabular-nums",
                }}
              />
            </div>

            {error && (
              <p className="nn-error" style={{ marginBottom: 16 }}>
                {error}
              </p>
            )}

            <p className="nn-hint" style={{ marginBottom: 22 }}>
              We sent a 6-digit login code to {email.trim()}.
            </p>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2
                    size={18}
                    style={{ animation: "spin 1s linear infinite" }}
                  />{" "}
                  Verifying...
                </>
              ) : (
                <>
                  Verify & Continue <ChevronRight size={18} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResendCode}
              disabled={resendIn > 0 || resendLoading}
              style={{
                width: "100%",
                minHeight: 44,
                marginTop: 14,
                background: "transparent",
                border: "none",
                color: "var(--theme-accent)",
                cursor: resendIn > 0 || resendLoading ? "not-allowed" : "pointer",
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                fontWeight: 700,
                opacity: resendIn > 0 || resendLoading ? 0.6 : 1,
              }}
            >
              {resendLoading
                ? "Sending..."
                : resendIn > 0
                  ? `Resend code in ${resendIn}s`
                  : "Resend code"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("credentials");
                setOtpCode("");
                setError("");
                setResendIn(0);
              }}
              style={{
                width: "100%",
                minHeight: 44,
                marginTop: 6,
                background: "transparent",
                border: "none",
                color: "var(--cream-55)",
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
