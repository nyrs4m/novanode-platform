import Link from "next/link";

const sections = [
  {
    title: "1. Introduction",
    body: [
      'This Privacy Policy explains what information NovaNode ("we," "us") collects when you use our QR-based ordering platform, and how it is used.',
    ],
  },
  {
    title: "2. Information We Collect",
    groups: [
      {
        label: "From Diners (customers):",
        items: [
          "Name entered when starting an ordering session (used only to identify your order to kitchen staff)",
          "Order details (items, quantities, any notes or modifiers you select)",
          "Table number and session information, temporarily, for the duration of your visit",
          "We do not require account creation, email, or phone number to place an order in person",
        ],
      },
      {
        label: "From Merchant staff (restaurant admins/kitchen staff):",
        items: [
          "Email address, used for login authentication (one-time code login)",
          "Name and role, as set up by the restaurant",
        ],
      },
      {
        label: "Automatically collected:",
        items: [
          "Basic technical information (device/browser type) needed to operate the Platform reliably",
        ],
      },
    ],
  },
  {
    title: "3. How We Use Information",
    items: [
      "To connect your order to the correct table and kitchen",
      "To allow restaurant staff to prepare and serve your order correctly",
      "To calculate and display order totals",
      "To operate staff login and restaurant management features",
    ],
  },
  {
    title: "4. Payment Information",
    body: [
      "If you pay online through the Platform, payment processing is handled by Paystack, a third-party payment processor. NovaNode does not store your card details — these are handled directly by Paystack under its own privacy and security practices.",
    ],
  },
  {
    title: "5. Data Sharing",
    body: ["We do not sell personal information. Information is shared only with:"],
    items: [
      "The restaurant (Merchant) you are ordering from, to fulfill your order",
      "Paystack, if you pay online",
      "Our infrastructure providers (database hosting, cloud services) as needed to operate the Platform",
    ],
  },
  {
    title: "6. Data Retention",
    body: [
      "Ordering session data is retained for as long as necessary to support order history, receipts, and restaurant record-keeping. Session identifiers are automatically invalidated once a table is closed.",
    ],
  },
  {
    title: "7. Your Rights",
    body: [
      "You may request information about data associated with your order by contacting novanodeplatform@gmail.com.",
    ],
  },
  {
    title: "8. Children's Privacy",
    body: [
      "The Platform is not directed at children, and we do not knowingly collect personal information from children.",
    ],
  },
  {
    title: "9. Changes to This Policy",
    body: [
      "We may update this Privacy Policy from time to time. Continued use of the Platform after changes constitutes acceptance of the updated Policy.",
    ],
  },
  {
    title: "10. Contact",
    body: [
      "Questions about this Privacy Policy can be sent to novanodeplatform@gmail.com.",
    ],
  },
];

export default function PrivacyPage() {
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
        <h1>Privacy Policy</h1>
        {sections.map((section) => (
          <section className="legal-section" key={section.title}>
            <h2>{section.title}</h2>
            {section.body?.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.groups?.map((group) => (
              <div className="legal-list-group" key={group.label}>
                <h3>{group.label}</h3>
                <ul>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
            {section.items && (
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </article>

      <footer className="legal-footer">
        <Link href="/">Back to NovaNode</Link>
        <Link href="/terms">Terms of Service</Link>
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

        .legal-section h3 {
          color: var(--theme-text);
          font-size: 16px;
          line-height: 1.4;
          margin: 20px 0 8px;
        }

        .legal-section p,
        .legal-section li {
          color: var(--theme-text-dim);
          font-size: 16px;
          line-height: 1.75;
        }

        .legal-section p {
          margin: 0;
        }

        .legal-section ul {
          margin: 12px 0 0;
          padding-left: 20px;
        }

        .legal-section li + li {
          margin-top: 8px;
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
