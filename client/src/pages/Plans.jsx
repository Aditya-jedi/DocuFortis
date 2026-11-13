
import PublicPageLayout from "./PublicPageLayout";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    storage: "60 MB",
    subtitle: "For getting started with secure document management.",
    features: [
      "60 MB storage quota",
      "Document upload and management",
      "Controlled document sharing",
      "Sharing expiry and revocation",
      "Account security features",
    ],
    action: "Get Started",
    href: "/register",
    featured: false,
  },
  {
    name: "Premium",
    storage: "90 MB",
    subtitle: "For users who need additional document storage.",
    features: [
      "90 MB storage quota",
      "Everything included in Free",
      "Additional 30 MB storage",
      "Premium access after admin approval",
    ],
    action: "Explore Premium",
    href: "/login",
    featured: true,
  },
];

export default function Plans({ user, onLogout, onSettings }) {
  return (
    <PublicPageLayout
      user={user}
      onLogout={onLogout}
      onSettings={onSettings}
      activePage="plans"
      eyebrow="SIMPLE STORAGE PLANS"
      title="Choose the storage that works for you."
      description="Start with the Free plan or request a Premium upgrade when you need additional storage."
    >
      <section className="public-plans-grid">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`public-plan-card ${
              plan.featured ? "public-plan-featured" : ""
            }`}
          >
            {plan.featured && (
              <div className="public-plan-badge">
                <span>✦</span> PREMIUM PLAN
              </div>
            )}

            <h2>{plan.name}</h2>

            <div className="public-plan-storage">{plan.storage}</div>

            <p className="public-plan-subtitle">{plan.subtitle}</p>

            <div className="public-plan-divider" />

            <ul className="public-plan-features">
              {plan.features.map((feature) => (
                <li key={feature}>
                  <span className="public-plan-check">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              to={user && plan.featured ? "/premium" : plan.href}
              className={`public-plan-button ${
                plan.featured ? "premium-button" : "free-button"
              }`}
            >
              {plan.action}
              <span aria-hidden="true">→</span>
            </Link>
          </article>
        ))}
      </section>

      <div className="public-premium-information">
        <div className="public-premium-info-heading">
          <span className="public-premium-info-icon">✦</span>
          <strong>Premium upgrade information</strong>
        </div>

        <p>
          Premium activation requires a successful demonstration payment
          followed by administrator approval. No real charges are processed.
          Each individual file upload is limited to 10 MB.
        </p>
      </div>

      <style>{`
        .public-plans-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 25px;
          max-width: 880px;
          margin: 0 auto;
          align-items: stretch;
        }

        .public-plan-card {
          position: relative;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          padding: 30px;
          border: 1px solid rgba(22, 124, 114, 0.16);
          border-radius: 19px;
          background: linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.9),
            rgba(234, 244, 241, 0.54)
          );
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 8px 26px rgba(23, 74, 69, 0.055);
          transition:
            transform 0.28s ease,
            border-color 0.28s ease,
            box-shadow 0.28s ease,
            background 0.28s ease;
        }

        .public-plan-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 65px;
          height: 3px;
          border-radius: 0 0 5px 0;
          background: linear-gradient(90deg, #167C72, #D6A84F);
          transition: width 0.3s ease;
        }

        .public-plan-card:hover {
          transform: translateY(-3px);
          border-color: rgba(214, 168, 79, 0.58);
          box-shadow: 0 14px 34px rgba(23, 74, 69, 0.085);
        }

        .public-plan-card:hover::before {
          width: 110px;
        }

        .public-plan-featured {
          border: 1.5px solid rgba(214, 168, 79, 0.78);
          background: linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.96),
            rgba(245, 233, 201, 0.42),
            rgba(234, 244, 241, 0.75)
          );
          box-shadow:
            0 12px 35px rgba(23, 74, 69, 0.075),
            0 0 24px rgba(214, 168, 79, 0.11);
        }

        .public-plan-featured::before {
          width: 100%;
          height: 4px;
          background: linear-gradient(
            90deg,
            #167C72,
            #D6A84F,
            #F0D99F
          );
        }

        .public-plan-featured:hover {
          border-color: #D6A84F;
          box-shadow:
            0 19px 43px rgba(23, 74, 69, 0.12),
            0 0 28px rgba(214, 168, 79, 0.16);
        }

        .public-plan-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          align-self: flex-start;
          margin-bottom: 17px;
          padding: 8px 14px;
          border: 1px solid rgba(214, 168, 79, 0.55);
          border-radius: 30px;
          background: linear-gradient(
            110deg,
            rgba(245, 233, 201, 0.85),
            rgba(255, 255, 255, 0.8)
          );
          color: #8A6827;
          font-size: 11px;
          font-weight: 850;
          letter-spacing: 1px;
          box-shadow: 0 3px 10px rgba(214, 168, 79, 0.10);
        }

        .public-plan-badge span {
          color: #B58A35;
          font-size: 16px;
        }

        .public-plan-card h2 {
          margin: 0 0 9px;
          color: #174A45;
          font-family: "Manrope", sans-serif;
          font-size: 23px;
          font-weight: 750;
          line-height: 1.35;
        }

        .public-plan-storage {
          margin-bottom: 10px;
          color: #167C72;
          font-size: 40px;
          font-weight: 850;
          letter-spacing: -1.5px;
        }

        .public-plan-featured .public-plan-storage {
          color: #A47B2D;
          text-shadow: 0 2px 15px rgba(214, 168, 79, 0.14);
        }

        .public-plan-subtitle {
          min-height: 52px;
          margin: 0;
          color: #687B77;
          font-size: 14px;
          line-height: 1.8;
        }

        .public-plan-divider {
          height: 1px;
          margin: 22px 0;
          background: linear-gradient(
            90deg,
            rgba(22, 124, 114, 0.28),
            rgba(214, 168, 79, 0.5),
            transparent
          );
        }

        .public-plan-features {
          display: grid;
          gap: 14px;
          padding: 0;
          margin: 0 0 30px;
          list-style: none;
          color: #526762;
          font-size: 14px;
          line-height: 1.7;
        }

        .public-plan-features li {
          display: flex;
          align-items: flex-start;
          gap: 11px;
        }

        .public-plan-check {
          display: inline-flex;
          flex: 0 0 20px;
          width: 20px;
          height: 20px;
          align-items: center;
          justify-content: center;
          margin-top: 1px;
          border: 1px solid rgba(22, 124, 114, 0.12);
          border-radius: 50%;
          background: #EAF4F1;
          color: #167C72;
          font-size: 12px;
          font-weight: 850;
        }

        .public-plan-featured .public-plan-check {
          border-color: rgba(214, 168, 79, 0.25);
          background: #F5E9C9;
          color: #8A6827;
        }

        .public-plan-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: auto;
          min-height: 48px;
          padding: 12px 18px;
          border: 1px solid transparent;
          border-radius: 12px;
          text-align: center;
          text-decoration: none;
          font-size: 14px;
          font-weight: 800;
          transition:
            transform 0.22s ease,
            box-shadow 0.22s ease,
            background 0.22s ease;
        }

        .public-plan-button:hover {
          transform: translateY(-2px);
        }

        .public-plan-button:focus-visible {
          outline: 3px solid rgba(214, 168, 79, 0.55);
          outline-offset: 3px;
        }

        .free-button {
          background: linear-gradient(110deg, #167C72, #115F57);
          color: #ffffff;
          box-shadow: 0 6px 16px rgba(22, 124, 114, 0.2);
        }

        .free-button:hover {
          box-shadow: 0 9px 22px rgba(22, 124, 114, 0.29);
        }

        .premium-button {
          border-color: rgba(214, 168, 79, 0.7);
          background: linear-gradient(110deg, #174A45, #167C72);
          color: #ffffff;
          box-shadow:
            0 6px 17px rgba(23, 74, 69, 0.2),
            0 0 12px rgba(214, 168, 79, 0.08);
        }

        .premium-button:hover {
          box-shadow:
            0 9px 23px rgba(23, 74, 69, 0.25),
            0 0 19px rgba(214, 168, 79, 0.2);
        }

        .public-plan-button span {
          color: #F5E9C9;
          font-size: 18px;
          transition: transform 0.2s ease;
        }

        .public-plan-button:hover span {
          transform: translateX(3px);
        }

        .public-premium-information {
          max-width: 880px;
          margin: 28px auto 0;
          padding: 23px 25px;
          border: 1px solid rgba(214, 168, 79, 0.43);
          border-radius: 19px;
          background: linear-gradient(
            110deg,
            rgba(234, 244, 241, 0.9),
            rgba(255, 255, 255, 0.88),
            rgba(245, 233, 201, 0.42)
          );
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          box-shadow: 0 8px 26px rgba(23, 74, 69, 0.055);
        }

        .public-premium-info-heading {
          display: flex;
          align-items: center;
          gap: 11px;
          color: #174A45;
          font-size: 14px;
        }

        .public-premium-info-icon {
          display: inline-flex;
          flex: 0 0 30px;
          width: 30px;
          height: 30px;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(214, 168, 79, 0.35);
          border-radius: 10px;
          background: #F5E9C9;
          color: #A47B2D;
          font-size: 16px;
        }

        .public-premium-information p {
          margin: 11px 0 0;
          color: #687B77;
          font-size: 14px;
          line-height: 1.8;
        }

        @media (max-width: 650px) {
          .public-plans-grid {
            grid-template-columns: 1fr;
            gap: 18px;
          }

          .public-plan-card {
            padding: 23px;
          }

          .public-plan-storage {
            font-size: 36px;
          }

          .public-plan-subtitle {
            min-height: auto;
          }

          .public-premium-information {
            padding: 19px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .public-plan-card,
          .public-plan-card::before,
          .public-plan-button,
          .public-plan-button span {
            transition: none;
          }

          .public-plan-card:hover,
          .public-plan-button:hover {
            transform: none;
          }
        }
      `}</style>
    </PublicPageLayout>
  );
}
