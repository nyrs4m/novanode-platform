import Link from "next/link";

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: [
      'These Terms of Service ("Terms") govern your use of NovaNode ("the Platform," "we," "us"), operated by NovaNode Inc., a company being formed under the laws of Ghana. By scanning a QR code, browsing a menu, placing an order, or otherwise using the Platform, you agree to these Terms.',
    ],
  },
  {
    title: "2. What NovaNode Is",
    body: [
      'NovaNode is a technology platform that enables restaurants ("Merchants") to offer digital menus and ordering via QR code to their customers ("Diners"). NovaNode provides the software connecting Diners to Merchants — it is not a restaurant, does not prepare or sell food, and is not a party to any transaction between a Diner and a Merchant.',
    ],
  },
  {
    title: "3. Ordering Through NovaNode",
    body: [
      "When you scan a table's QR code, a temporary ordering session is created for that table. You may browse the menu, add items to a cart, and submit orders to the restaurant's kitchen through the Platform. Order accuracy, food preparation, and service quality are the sole responsibility of the Merchant, not NovaNode.",
    ],
  },
  {
    title: "4. Payment",
    body: [
      "Payment for your order is made directly to the Merchant — either in person at the venue (cash, card, or other in-person method) or, where enabled, through an online payment provider (Paystack) integrated into the Platform. NovaNode is not a party to the payment transaction between you and the Merchant. Once your bill has been presented, any payment, dispute, refund, or payment-related issue is between you and the Merchant directly. NovaNode does not hold, process on its own behalf, or take responsibility for funds exchanged between Diners and Merchants, and is not liable for payment disputes, incorrect charges, refund requests, or payment failures between a Diner and a Merchant.",
    ],
  },
  {
    title: "5. Sessions and Data",
    body: [
      "NovaNode does not require Diners to create a permanent account. Ordering sessions are temporary and tied to a specific table and visit. See our Privacy Policy for details on what information is collected and how it is used.",
    ],
  },
  {
    title: "6. Prohibited Conduct",
    body: [
      "You agree not to misuse the Platform, including attempting to access another table's session, interfere with the ordering system, or use the Platform for any unlawful purpose.",
    ],
  },
  {
    title: "7. Intellectual Property",
    body: [
      "The NovaNode name, logo, and platform software are the property of NovaNode Inc. Menu content, restaurant names, and branding displayed through the Platform belong to the respective Merchant.",
    ],
  },
  {
    title: "8. Limitation of Liability",
    body: [
      "To the fullest extent permitted by law, NovaNode is not liable for any indirect, incidental, or consequential damages arising from your use of the Platform, food quality or safety, service at a Merchant's venue, or payment disputes between Diners and Merchants.",
    ],
  },
  {
    title: "9. Suspension and Termination",
    body: [
      "NovaNode may suspend or restrict access to the Platform for misuse or violation of these Terms.",
    ],
  },
  {
    title: "10. Changes to These Terms",
    body: [
      "We may update these Terms from time to time. Continued use of the Platform after changes constitutes acceptance of the updated Terms.",
    ],
  },
  {
    title: "11. Governing Law",
    body: ["These Terms are governed by the laws of Ghana."],
  },
  {
    title: "12. Contact",
    body: ["Questions about these Terms can be sent to novanodeplatform@gmail.com."],
  },
];

export default function TermsPage() {
  return (
    <main className="legal-page" data-theme="default">
      <header className="legal-header">
        <Link className="legal-brand" href="/">
          <img src="/novalogo.png" alt="NovaNode" className="h-12 w-auto md:h-14" />
          <span>NovaNode Inc</span>
        </Link>
      </header>

      <article className="legal-document">
        <p className="legal-eyebrow">Last updated: July 2026</p>
        <h1>Terms of Service</h1>
        {sections.map((section) => (
          <section className="legal-section" key={section.title}>
            <h2>{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </article>

      <footer className="legal-footer">
        <Link href="/">Back to NovaNode</Link>
        <Link href="/privacy">Privacy Policy</Link>
      </footer>

      <style>{`
        .legal-page {
          min-height: 100vh;
          background: var(--theme-bg);
          color: var(--theme-text);
          font-family: Inter, sans-serif;
          padding: 24px 18px 40px;
        }

        .legal-header {
          width: min(100%, 960px);
          margin: 0 auto;
        }

        .legal-brand {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          color: var(--theme-accent);
          font-size: 20px;
          font-weight: 800;
          text-decoration: none;
        }

        .legal-document {
          width: min(100%, 800px);
          margin: 54px auto 0;
        }

        .legal-eyebrow {
          color: var(--theme-accent);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          margin: 0 0 14px;
        }

        .legal-document h1 {
          color: var(--theme-text);
          font-size: clamp(36px, 10vw, 64px);
          line-height: 1;
          letter-spacing: 0;
          margin: 0 0 36px;
        }

        .legal-section {
          padding: 24px 0;
          border-top: 1px solid color-mix(in srgb, var(--theme-text) 12%, transparent);
        }

        .legal-section h2 {
          color: var(--theme-accent);
          font-size: clamp(20px, 5.5vw, 28px);
          line-height: 1.18;
          letter-spacing: 0;
          margin: 0 0 12px;
        }

        .legal-section p {
          color: var(--theme-text-dim);
          font-size: 16px;
          line-height: 1.75;
          margin: 0;
        }

        .legal-footer {
          width: min(100%, 800px);
          margin: 28px auto 0;
          padding-top: 24px;
          border-top: 1px solid color-mix(in srgb, var(--theme-text) 12%, transparent);
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          justify-content: center;
          font-size: 14px;
        }

        .legal-footer a {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          color: var(--theme-accent);
          font-weight: 800;
          text-decoration: none;
        }

        @media (min-width: 768px) {
          .legal-page {
            padding: 24px 28px 56px;
          }

          .legal-document {
            margin-top: 72px;
          }
        }
      `}</style>
    </main>
  );
}
