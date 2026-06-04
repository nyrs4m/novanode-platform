export default function SuspendedPage() {
  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Inter, sans-serif", padding: 24,
    }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <p style={{ fontSize: 48, marginBottom: 16 }}>🔒</p>
        <h1 style={{ color: "var(--cream)", fontWeight: 900, fontSize: 24, marginBottom: 12 }}>
          Account Suspended
        </h1>
        <p style={{ color: "var(--cream-35)", fontSize: 14, lineHeight: 1.6 }}>
          This restaurant&apos;s NovaNode account has been suspended.
          Please contact support to resolve any outstanding balance.
        </p>
      </div>
    </div>
  )
}