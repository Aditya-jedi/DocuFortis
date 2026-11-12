
import PublicPageLayout from "./PublicPageLayout";

const securityMeasures = [
  {
    title: "Password Protection",
    description:
      "User passwords are hashed using Argon2 rather than being stored as plain text.",
  },
  {
    title: "Multi-Factor Authentication",
    description:
      "Authenticator-based MFA and recovery codes provide an additional layer of account protection.",
  },
  {
    title: "Secure Session Management",
    description:
      "Authenticated sessions use server-managed cookies with HTTP-only settings to reduce exposure to client-side scripts.",
  },
  {
    title: "Bot and Abuse Protection",
    description:
      "Cloudflare Turnstile and request rate limiting help protect authentication endpoints against automated abuse.",
  },
  {
    title: "Controlled Document Access",
    description:
      "Sharing links support view or download permissions, optional recipient restrictions, expiry periods and revocation.",
  },
  {
    title: "Document Integrity Records",
    description:
      "SHA-256 hashes are generated for uploaded documents and stored as document integrity references.",
  },
  {
    title: "Activity Audit Logs",
    description:
      "Important security and document-related events are recorded to support accountability and activity monitoring.",
  },
  {
    title: "Server-Side Security",
    description:
      "Input validation, CORS configuration and HTTP security headers help protect the application's backend.",
  },
];

export default function Security({ user, onLogout, onSettings }) {
  return (
    <PublicPageLayout
      user={user}
      onLogout={onLogout}
      onSettings={onSettings}
      activePage="security"
      eyebrow="SECURITY AT DOCUFORTIS"
      title="Security is built into the experience."
      description="DocuFortis combines account protection, controlled document access and activity monitoring to help safeguard your documents."
    >
      <section className="security-measures-grid">
        {securityMeasures.map((measure, index) => (
          <article className="security-measure-card" key={measure.title}>
            <div className="security-control-label">
              <span className="security-control-dot" />
              SECURITY CONTROL {String(index + 1).padStart(2, "0")}
            </div>

            <h2>{measure.title}</h2>

            <p>{measure.description}</p>

            <div className="security-card-decoration" aria-hidden="true" />
          </article>
        ))}
      </section>

      <div className="security-approach">
        <span className="security-approach-accent" />
        <div>
          <p>
            <strong>Our approach:</strong> Security is not a single feature.
            DocuFortis uses multiple safeguards across account access, document
            storage, sharing and application activity.
          </p>
        </div>
      </div>

      <style>{`
        .security-measures-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 20px;
        }

        .security-measure-card {
          position: relative;
          overflow: hidden;
          min-height: 215px;
          padding: 26px 23px;
          border: 1px solid rgba(22, 124, 114, 0.15);
          border-radius: 19px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.9),
            rgba(234, 244, 241, 0.62)
          );
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 9px 28px rgba(23, 74, 69, 0.055);
          transition:
            transform 0.28s ease,
            border-color 0.28s ease,
            box-shadow 0.28s ease,
            background 0.28s ease;
        }

        .security-measure-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 48px;
          height: 3px;
          border-radius: 0 0 5px 0;
          background: linear-gradient(90deg, #167C72, #D6A84F);
          transition: width 0.28s ease;
        }

        .security-measure-card:hover {
          transform: translateY(-5px);
          border-color: rgba(214, 168, 79, 0.62);
          background: rgba(255, 255, 255, 0.96);
          box-shadow:
            0 16px 36px rgba(23, 74, 69, 0.10),
            0 0 20px rgba(214, 168, 79, 0.08);
        }

        .security-measure-card:hover::before {
          width: 85px;
        }

        .security-control-label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 19px;
          color: #A47B2D;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.85px;
        }

        .security-control-dot {
          width: 7px;
          height: 7px;
          flex: 0 0 7px;
          border-radius: 50%;
          background: #D6A84F;
          box-shadow: 0 0 9px rgba(214, 168, 79, 0.4);
        }

        .security-measure-card h2 {
          position: relative;
          z-index: 1;
          margin: 0 0 11px;
          color: #174A45;
          font-size: 17px;
          font-weight: 750;
          line-height: 1.45;
        }

        .security-measure-card p {
          position: relative;
          z-index: 1;
          margin: 0;
          color: #687B77;
          font-size: 13.5px;
          line-height: 1.8;
        }

        .security-card-decoration {
          position: absolute;
          right: -38px;
          bottom: -48px;
          width: 115px;
          height: 115px;
          border: 1px solid rgba(214, 168, 79, 0.15);
          border-radius: 50%;
          pointer-events: none;
          transition: transform 0.3s ease;
        }

        .security-measure-card:hover .security-card-decoration {
          transform: scale(1.35);
        }

        .security-approach {
          position: relative;
          display: flex;
          gap: 17px;
          align-items: stretch;
          margin-top: 30px;
          padding: 25px 27px;
          overflow: hidden;
          border: 1px solid rgba(214, 168, 79, 0.42);
          border-radius: 19px;
          background: linear-gradient(
            115deg,
            rgba(234, 244, 241, 0.94),
            rgba(255, 255, 255, 0.88),
            rgba(245, 233, 201, 0.42)
          );
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          color: #405A55;
          box-shadow: 0 9px 26px rgba(23, 74, 69, 0.055);
        }

        .security-approach-accent {
          flex: 0 0 4px;
          align-self: stretch;
          min-height: 40px;
          border-radius: 5px;
          background: linear-gradient(180deg, #167C72, #D6A84F);
        }

        .security-approach p {
          margin: 0;
          font-size: 14px;
          line-height: 1.8;
        }

        .security-approach strong {
          color: #174A45;
        }

        @media (max-width: 1050px) {
          .security-measures-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .security-measures-grid {
            grid-template-columns: 1fr;
            gap: 15px;
          }

          .security-measure-card {
            min-height: auto;
            padding: 23px 21px;
          }

          .security-approach {
            padding: 20px;
            gap: 13px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .security-measure-card,
          .security-measure-card::before,
          .security-card-decoration {
            transition: none;
          }

          .security-measure-card:hover {
            transform: none;
          }
        }
      `}</style>
    </PublicPageLayout>
  );
}
