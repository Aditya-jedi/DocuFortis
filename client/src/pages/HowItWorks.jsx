
import PublicPageLayout from "./PublicPageLayout";

const steps = [
  {
    number: "01",
    title: "Create Your Account",
    description:
      "Register for a DocuFortis account and complete the account verification process. You can also configure multi-factor authentication for additional protection.",
  },
  {
    number: "02",
    title: "Upload Your Documents",
    description:
      "Upload supported files such as PDFs, images and text documents. Your documents are stored in your account and count towards your storage quota.",
  },
  {
    number: "03",
    title: "Manage Your Files",
    description:
      "View, download and delete your uploaded documents from your document dashboard. Keep track of your available storage.",
  },
  {
    number: "04",
    title: "Share with Control",
    description:
      "Generate a sharing link and choose the permission type, expiry period and, where required, the recipient's email address.",
  },
  {
    number: "05",
    title: "Monitor and Manage Access",
    description:
      "Review document-related activity and revoke a sharing link when access is no longer required. Expired links can no longer be used.",
  },
];

export default function HowItWorks() {
  return (
    <PublicPageLayout
      activePage="how-it-works"
      eyebrow="HOW IT WORKS"
      title="Simple document management. Controlled sharing."
      description="DocuFortis makes it straightforward to store documents and share them with the people who need access."
    >
      <section className="how-steps">
        {steps.map((step) => (
          <article className="how-step-card" key={step.number}>
            <div className="how-step-number">{step.number}</div>

            <div className="how-step-content">
              <h2>{step.title}</h2>
              <p>{step.description}</p>
            </div>

            <div className="how-step-accent" aria-hidden="true" />
          </article>
        ))}
      </section>

      <style>{`
        .how-steps {
          display: grid;
          gap: 20px;
          max-width: 880px;
          margin: 0 auto;
        }

        .how-step-card {
          position: relative;
          display: flex;
          gap: 23px;
          align-items: flex-start;
          overflow: hidden;
          padding: 27px 28px;
          border: 1px solid rgba(22, 124, 114, 0.15);
          border-radius: 20px;
          background: linear-gradient(
            125deg,
            rgba(255, 255, 255, 0.88),
            rgba(234, 244, 241, 0.58)
          );
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 9px 28px rgba(23, 74, 69, 0.06);
          transition:
            transform 0.28s ease,
            border-color 0.28s ease,
            box-shadow 0.28s ease,
            background 0.28s ease;
        }

        .how-step-card:hover {
          transform: translateY(-5px);
          border-color: rgba(214, 168, 79, 0.65);
          background: rgba(255, 255, 255, 0.96);
          box-shadow:
            0 16px 36px rgba(23, 74, 69, 0.10),
            0 0 20px rgba(214, 168, 79, 0.09);
        }

        .how-step-number {
          position: relative;
          z-index: 1;
          flex: 0 0 50px;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 15px;
          background: linear-gradient(145deg, #EAF4F1, #F5E9C9);
          border: 1px solid rgba(214, 168, 79, 0.48);
          color: #174A45;
          font-weight: 800;
          font-size: 14px;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 12px rgba(214, 168, 79, 0.10);
        }

        .how-step-content {
          position: relative;
          z-index: 1;
          min-width: 0;
          padding-top: 2px;
        }

        .how-step-content h2 {
          margin: 0 0 10px;
          color: #174A45;
          font-size: 19px;
          font-weight: 750;
          line-height: 1.4;
        }

        .how-step-content p {
          margin: 0;
          color: #687B77;
          font-size: 14px;
          line-height: 1.8;
        }

        .how-step-accent {
          position: absolute;
          right: -35px;
          bottom: -48px;
          width: 125px;
          height: 125px;
          border: 1px solid rgba(214, 168, 79, 0.16);
          border-radius: 50%;
          pointer-events: none;
          transition: transform 0.3s ease;
        }

        .how-step-card:hover .how-step-accent {
          transform: scale(1.35);
        }

        @media (max-width: 600px) {
          .how-steps {
            gap: 15px;
          }

          .how-step-card {
            gap: 15px;
            padding: 20px;
            border-radius: 16px;
          }

          .how-step-number {
            flex-basis: 43px;
            width: 43px;
            height: 43px;
            border-radius: 12px;
            font-size: 13px;
          }

          .how-step-content h2 {
            font-size: 17px;
          }

          .how-step-content p {
            font-size: 13px;
            line-height: 1.7;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .how-step-card,
          .how-step-accent {
            transition: none;
          }

          .how-step-card:hover {
            transform: none;
          }
        }
      `}</style>
    </PublicPageLayout>
  );
}
