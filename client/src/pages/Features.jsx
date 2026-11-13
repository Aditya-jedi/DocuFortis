
import PublicPageLayout from "./PublicPageLayout";

const features = [
  {
    number: "01",
    title: "Secure Document Storage",
    description:
      "Upload and manage your important documents in one place. DocuFortis supports PDF, JPEG, PNG, WebP and TXT files, with controlled storage limits.",
  },
  {
    number: "02",
    title: "Controlled Document Sharing",
    description:
      "Share documents through unique links. Choose view only or view and download permissions.",
  },
  {
    number: "03",
    title: "Expiry and Revocation",
    description:
      "Set an expiry period for shared links and revoke access when you no longer want a document to remain accessible.",
  },
  {
    number: "04",
    title: "Multi-Factor Authentication",
    description:
      "Add another layer of account protection using authenticator-based MFA and recovery codes.",
  },
  {
    number: "05",
    title: "Document Integrity",
    description:
      "The platform stores a SHA-256 hash derived from each uploaded file's contents as an integrity reference.",
  },
  {
    number: "06",
    title: "Activity Auditing",
    description:
      "Important account and document activities are recorded in audit logs to support monitoring and accountability.",
  },
  {
    number: "07",
    title: "Storage Management",
    description:
      "Track your storage usage and manage documents within your account's storage quota.",
  },
  {
    number: "08",
    title: "Account Security Controls",
    description:
      "Security measures include password hashing, CAPTCHA verification, request rate limiting, input validation and security headers.",
  },
];

export default function Features({ user, onLogout, onSettings }) {
  return (
    <PublicPageLayout
      user={user}
      onLogout={onLogout}
      onSettings={onSettings}
      activePage="features"
      eyebrow="WHAT DOCUFORTIS OFFERS"
      title="Everything you need to manage documents securely."
      description="Explore the tools that help you store, manage and share documents with greater control."
    >
      <style>{`
        .features-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 20px;
          width: 100%;
        }

        .feature-card {
          position: relative;
          overflow: hidden;
          padding: 28px 24px;
          min-height: 225px;
          border: 1px solid rgba(22, 124, 114, 0.16);
          border-radius: 19px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.88),
            rgba(234, 244, 241, 0.52)
          );
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 8px 26px rgba(23, 74, 69, 0.055);
          transition:
            transform 0.28s ease,
            box-shadow 0.28s ease,
            border-color 0.28s ease,
            background 0.28s ease;
        }

        .feature-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 42px;
          height: 3px;
          border-radius: 0 0 5px 0;
          background: linear-gradient(90deg, #167c72, #d6a84f);
          transition: width 0.28s ease;
        }

        .feature-card:hover {
          transform: translateY(-3px);
          border-color: rgba(214, 168, 79, 0.58);
          background: rgba(255, 255, 255, 0.94);
          box-shadow: 0 14px 34px rgba(23, 74, 69, 0.085);
        }

        .feature-card:hover::before {
          width: 85px;
        }

        .feature-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 39px;
          height: 34px;
          margin-bottom: 21px;
          border: 1px solid rgba(214, 168, 79, 0.42);
          border-radius: 10px;
          background: linear-gradient(
            135deg,
            rgba(245, 233, 201, 0.8),
            rgba(234, 244, 241, 0.9)
          );
          color: #a77b2d;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }

        .feature-title {
          margin: 0 0 11px;
          color: #174a45;
          font-family: "Manrope", sans-serif;
          font-size: 18px;
          font-weight: 750;
          line-height: 1.35;
        }

        .feature-description {
          margin: 0;
          color: #687b77;
          font-size: 14px;
          line-height: 1.8;
        }

        @media (max-width: 1050px) {
          .features-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .features-grid {
            grid-template-columns: 1fr;
            gap: 15px;
          }

          .feature-card {
            min-height: auto;
            padding: 23px 21px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .feature-card,
          .feature-card::before {
            transition: none;
          }

          .feature-card:hover {
            transform: none;
          }
        }
      `}</style>

      <section className="features-grid">
        {features.map((feature) => (
          <article className="feature-card" key={feature.number}>
            <div className="feature-number">{feature.number}</div>

            <h2 className="feature-title">{feature.title}</h2>

            <p className="feature-description">{feature.description}</p>
          </article>
        ))}
      </section>
    </PublicPageLayout>
  );
}
