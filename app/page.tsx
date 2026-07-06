import {
  BarChart3,
  ChefHat,
  MessageSquareHeart,
  Palette,
  QrCode,
  ShoppingBag,
  Table2,
  TimerReset,
} from "lucide-react";

const steps = [
  {
    icon: QrCode,
    title: "Customer scans QR code at table",
    text: "Each table opens the right menu instantly, with no app download.",
  },
  {
    icon: ShoppingBag,
    title: "Browses menu, places order directly from phone",
    text: "Guests choose dishes, customize orders, and send them in seconds.",
  },
  {
    icon: ChefHat,
    title: "Kitchen receives order live, no paper, no shouting",
    text: "The kitchen display updates in real time, keeping service calm.",
  },
];

const features = [
  { icon: ChefHat, title: "Live Kitchen Display System" },
  { icon: TimerReset, title: "Real-time order tracking" },
  { icon: BarChart3, title: "Daily revenue analytics" },
  { icon: Table2, title: "Multi-table management" },
  { icon: MessageSquareHeart, title: "Customer feedback system" },
  { icon: Palette, title: "6 beautiful themes" },
];

export default function Home() {
  return (
    <main className="landing-page" data-theme="default">
      <section className="landing-hero" aria-labelledby="hero-title">
        <div className="ambient-gold motion-orb-1 landing-orb landing-orb-one" />
        <div className="ambient-emerald motion-orb-2 landing-orb landing-orb-two" />
        <div className="motion-scan landing-scan" />

        <div className="landing-hero-content">
          <p className="landing-wordmark">NovaNode</p>
          <h1 id="hero-title" className="landing-title">
            Feast the Gen-Z way
          </h1>
          <p className="landing-subtitle">
            The QR-based digital menu and ordering platform built for modern
            restaurants
          </p>
          <div className="landing-actions" aria-label="Primary actions">
            <a
              className="landing-cta landing-cta-primary"
              href="https://wa.me/0246902056"
            >
              Get your restaurant on NovaNode
            </a>
            <a className="landing-cta landing-cta-secondary" href="#demo">
              See it in action
            </a>
          </div>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="how-title">
        <div className="landing-section-inner">
          <p className="landing-eyebrow">How it works</p>
          <h2 id="how-title" className="landing-section-title">
            From table scan to kitchen screen
          </h2>
          <div className="steps-grid">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <article className="landing-panel step-panel" key={step.title}>
                  <div className="step-number">{index + 1}</div>
                  <Icon className="landing-icon" size={28} strokeWidth={2.2} />
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="features-title">
        <div className="landing-section-inner">
          <p className="landing-eyebrow">Built for restaurants</p>
          <h2 id="features-title" className="landing-section-title">
            Everything your team needs to move faster
          </h2>
          <div className="features-grid">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article className="landing-panel feature-panel" key={feature.title}>
                  <Icon className="landing-icon" size={24} strokeWidth={2.2} />
                  <h3>{feature.title}</h3>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="pricing-title">
        <div className="landing-section-inner pricing-inner">
          <p className="landing-eyebrow">Pricing</p>
          <article className="landing-panel pricing-card">
            <h2 id="pricing-title">Free to get started</h2>
            <p className="pricing-rate">
              1% per completed session, capped at GHS 5.00
            </p>
            <p>
              No monthly fees. No setup costs. You only pay when customers
              order.
            </p>
          </article>
        </div>
      </section>

      <section id="demo" className="landing-demo" aria-labelledby="demo-title">
        <div className="landing-section-inner demo-inner">
          <p className="landing-eyebrow">Demo</p>
          <h2 id="demo-title" className="landing-section-title">
            See what guests see
          </h2>
          <a className="landing-cta landing-cta-primary" href="/starbite?table=1">
            Try it as a customer
          </a>
        </div>
      </section>

      <footer className="landing-footer">
        <span>NovaNode &copy; 2026</span>
        <a href="https://wa.me/0246902056">WhatsApp contact</a>
      </footer>

      <style>{`
        .landing-page {
          min-height: 100vh;
          background: var(--theme-bg);
          color: var(--theme-text);
          font-family: Inter, sans-serif;
          overflow-x: hidden;
          scroll-behavior: smooth;
        }

        .landing-hero {
          position: relative;
          min-height: 100svh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 96px 18px 72px;
          isolation: isolate;
          overflow: hidden;
        }

        .landing-orb {
          position: absolute;
          pointer-events: none;
          z-index: -2;
        }

        .landing-orb-one {
          width: min(88vw, 560px);
          height: min(88vw, 560px);
          top: -18%;
          left: -34%;
        }

        .landing-orb-two {
          width: min(74vw, 460px);
          height: min(74vw, 460px);
          right: -28%;
          bottom: -18%;
        }

        .landing-scan {
          position: absolute;
          inset: 0;
          z-index: -1;
          opacity: 0.18;
        }

        .landing-hero-content,
        .landing-section-inner {
          width: min(100%, 1120px);
          margin: 0 auto;
        }

        .landing-hero-content {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .landing-wordmark {
          color: var(--theme-accent);
          font-size: clamp(40px, 13vw, 96px);
          font-weight: 950;
          letter-spacing: 0;
          line-height: 0.95;
          margin: 0 0 18px;
          text-shadow: 0 0 38px var(--theme-accent-glow);
        }

        .landing-title {
          margin: 0;
          font-size: clamp(34px, 10vw, 76px);
          line-height: 0.98;
          letter-spacing: 0;
          color: var(--theme-text);
          max-width: 900px;
        }

        .landing-subtitle {
          margin: 20px 0 0;
          max-width: 680px;
          color: var(--theme-text-dim);
          font-size: clamp(16px, 4.4vw, 22px);
          line-height: 1.55;
        }

        .landing-actions {
          display: flex;
          flex-direction: column;
          width: min(100%, 420px);
          gap: 12px;
          margin-top: 34px;
        }

        .landing-cta {
          min-height: 52px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          padding: 14px 18px;
          font-size: 14px;
          font-weight: 850;
          text-decoration: none;
          transition: transform 0.18s ease, border-color 0.18s ease;
        }

        .landing-cta:active {
          transform: translateY(1px);
        }

        .landing-cta-primary {
          color: var(--theme-bg);
          background: var(--theme-accent);
          border: 1px solid var(--theme-accent);
          box-shadow: 0 18px 48px var(--theme-accent-glow);
        }

        .landing-cta-secondary {
          color: var(--theme-text);
          background: color-mix(in srgb, var(--theme-surface) 78%, transparent);
          border: 1px solid color-mix(in srgb, var(--theme-text) 18%, transparent);
        }

        .landing-section,
        .landing-demo {
          padding: 72px 18px;
        }

        .landing-eyebrow {
          color: var(--theme-accent);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          margin: 0 0 12px;
          text-align: center;
        }

        .landing-section-title {
          color: var(--theme-text);
          text-align: center;
          font-size: clamp(28px, 7vw, 52px);
          line-height: 1.05;
          letter-spacing: 0;
          margin: 0 auto 28px;
          max-width: 760px;
        }

        .steps-grid,
        .features-grid {
          display: grid;
          gap: 12px;
        }

        .features-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .landing-panel {
          background: var(--theme-surface);
          border: 1px solid color-mix(in srgb, var(--theme-text) 14%, transparent);
          border-radius: 8px;
          box-shadow: var(--shadow-card);
        }

        .step-panel {
          position: relative;
          padding: 20px;
          min-height: 210px;
        }

        .step-number {
          position: absolute;
          top: 14px;
          right: 16px;
          color: var(--theme-accent);
          font-variant-numeric: tabular-nums;
          font-weight: 950;
          font-size: 28px;
          opacity: 0.45;
        }

        .landing-icon {
          color: var(--theme-accent);
          margin-bottom: 18px;
        }

        .landing-panel h3,
        .pricing-card h2 {
          color: var(--theme-text);
          font-size: 18px;
          line-height: 1.25;
          margin: 0;
        }

        .landing-panel p,
        .pricing-card p {
          color: var(--theme-text-dim);
          line-height: 1.55;
          margin: 10px 0 0;
          font-size: 14px;
        }

        .feature-panel {
          min-height: 150px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .pricing-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .pricing-card {
          width: min(100%, 560px);
          text-align: center;
          padding: 26px 20px;
        }

        .pricing-card h2 {
          font-size: clamp(26px, 7vw, 44px);
        }

        .pricing-card .pricing-rate {
          color: var(--theme-accent);
          font-size: clamp(18px, 5vw, 28px);
          font-weight: 900;
          font-variant-numeric: tabular-nums;
        }

        .landing-demo {
          text-align: center;
          background: color-mix(in srgb, var(--theme-surface) 28%, transparent);
        }

        .demo-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .landing-footer {
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: center;
          justify-content: center;
          padding: 28px 18px 36px;
          color: var(--theme-text-dim);
          border-top: 1px solid color-mix(in srgb, var(--theme-text) 12%, transparent);
          font-size: 14px;
        }

        .landing-footer a {
          color: var(--theme-accent);
          text-decoration: none;
          font-weight: 800;
        }

        @media (min-width: 768px) {
          .landing-actions {
            flex-direction: row;
            width: auto;
          }

          .landing-cta {
            min-width: 220px;
          }

          .steps-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .features-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 14px;
          }

          .landing-section,
          .landing-demo {
            padding: 96px 28px;
          }

          .landing-footer {
            flex-direction: row;
            justify-content: space-between;
            padding-inline: max(28px, calc((100vw - 1120px) / 2));
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .landing-page {
            scroll-behavior: auto;
          }

          .landing-cta {
            transition: none;
          }
        }
      `}</style>
    </main>
  );
}
