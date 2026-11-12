import "./Premium.css";

export default function PremiumPlans({
  onProceed,
  loading = false,
  onBack,
}) {
  return (
    <main className="premium-page">
      <div className="premium-container">
        <button className="premium-back" onClick={onBack}>
          ← Back to Dashboard
        </button>

        <header className="premium-heading">
          <span className="premium-eyebrow">DOCUFORTIS PREMIUM</span>
          <h1>More space. More control.</h1>
          <p>
            Upgrade your document vault with additional storage and keep
            managing your files securely.
          </p>
        </header>

        <div className="premium-benefits">
          <div>
            <strong>90 MB</strong>
            <span>Premium storage</span>
          </div>
          <div>
            <strong>+30 MB</strong>
            <span>Additional storage</span>
          </div>
          <div>
            <strong>60 MB</strong>
            <span>Current free storage</span>
          </div>
        </div>

        <section className="premium-plans">
          <article className="premium-plan-card">
            <span className="premium-plan-label">MONTHLY OFFER</span>
            <h2>Monthly</h2>
            <div className="premium-price">
              ₹99 <span>/ month</span>
            </div>
            <p>Promotional monthly pricing option.</p>
            <button
              onClick={() => onProceed("MONTHLY")}
              disabled={loading}
            >
              {loading ? "Please wait..." : "Continue with Monthly"}
            </button>
          </article>

          <article className="premium-plan-card premium-plan-featured">
            <span className="premium-plan-label">BEST VALUE</span>
            <h2>Yearly</h2>
            <div className="premium-price">
              ₹999 <span>/ year</span>
            </div>
            <p>
              Save ₹189 compared with twelve monthly payments.
            </p>
            <button
              onClick={() => onProceed("YEARLY")}
              disabled={loading}
            >
              {loading ? "Please wait..." : "Continue with Yearly"}
            </button>
          </article>
        </section>

        <p className="premium-disclaimer">
          Demo payment experience only. These are promotional pricing
          options, not recurring subscriptions. No automatic renewal or
          real charges. Premium access requires administrator approval.
        </p>
      </div>
    </main>
  );
}