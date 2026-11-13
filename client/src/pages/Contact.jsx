
import PublicPageLayout from "./PublicPageLayout";

function Contact({ user, onLogout, onSettings }) {
  return (
    <PublicPageLayout
      user={user}
      onLogout={onLogout}
      onSettings={onSettings}
      activePage="contact"
      eyebrow="Get in Touch"
      title="Contact DocuFortis"
      description="Have a question, found an issue, or want to share feedback? We welcome your thoughts about the platform."
    >
      <section className="public-card project-lead-card">
        <div className="project-lead-header">
          <span className="project-lead-label">PROJECT LEAD</span>
          <h2>Aditya Pratap Singh</h2>
          <p className="project-lead-role">
            Leader of Code Syndicate
          </p>
        </div>

        <p>
          DocuFortis is developed as a cloud security project under
          Code Syndicate. I led the development of the platform, focusing
          on secure document storage, controlled sharing, and account
          protection.
        </p>

        <div className="project-lead-links">
          <a
            href="https://github.com/Aditya-jedi"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>GitHub</span>
            <span className="project-lead-link-value">
              github.com/Aditya-jedi ↗
            </span>
          </a>

          <a
            href="https://www.linkedin.com/in/aditya-pratap-singh-b4b850327"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>LinkedIn</span>
            <span className="project-lead-link-value">
              linkedin.com/in/aditya-pratap-singh-b4b850327 ↗
            </span>
          </a>

          <a href="mailto:aditya2602006@gmail.com">
            <span>Email</span>
            <span className="project-lead-link-value">
              aditya2602006@gmail.com
            </span>
          </a>
        </div>
      </section>

      <section className="public-card">
        <h2>Questions and feedback</h2>
        <p>
          For questions about using DocuFortis, account access, document
          sharing, or platform functionality, contact the project
          administrator through the contact channel provided to you.
        </p>
      </section>

      <section className="public-card">
        <h2>Report a technical issue</h2>
        <p>
          When reporting an issue, describe what you were trying to do,
          what happened, and the page where the issue occurred. Please do
          not include your password, authentication codes, recovery codes,
          or private documents in a support request.
        </p>
      </section>

      <section className="public-card">
        <h2>Security-related concerns</h2>
        <p>
          If you notice a potential security issue, report it responsibly
          to the project administrator. Avoid sharing sensitive details
          publicly or attempting to access another user's account or files.
        </p>
      </section>

      <style>{`
        .project-lead-card {
          overflow: hidden;
          border-color: rgba(214, 168, 79, .42);
          background:
            radial-gradient(
              ellipse at 95% 5%,
              rgba(214, 168, 79, .13),
              transparent 42%
            ),
            rgba(255, 255, 255, .84);
        }

        .project-lead-header {
          padding-bottom: 19px;
          margin-bottom: 20px;
          border-bottom: 1px solid rgba(22, 124, 114, .14);
        }

        .project-lead-label {
          display: inline-block;
          padding: 6px 11px;
          margin-bottom: 13px;
          border: 1px solid rgba(214, 168, 79, .55);
          border-radius: 20px;
          background: rgba(245, 233, 201, .48);
          color: #A47B2D;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 1.2px;
        }

        .project-lead-header h2 {
          margin: 0 0 5px;
          font-family: "Manrope", sans-serif;
          font-size: 26px;
          line-height: 1.3;
        }

        .project-lead-role {
          margin: 0;
          color: #A47B2D !important;
          font-size: 14px !important;
          font-weight: 700;
        }

        .project-lead-links {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 13px;
          margin-top: 25px;
        }

        .project-lead-links a {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
          padding: 16px;
          border: 1px solid rgba(22, 124, 114, .16);
          border-radius: 12px;
          background: rgba(234, 244, 241, .68);
          color: #174A45;
          font-size: 13px;
          font-weight: 800;
          text-decoration: none;
          transition:
            transform .22s ease,
            border-color .22s ease,
            box-shadow .22s ease;
        }

        .project-lead-links a:hover {
          transform: translateY(-2px);
          border-color: rgba(214, 168, 79, .58);
          box-shadow: 0 8px 20px rgba(23, 74, 69, .085);
        }

        .project-lead-link-value {
          color: #687B77;
          font-size: 12px;
          font-weight: 550;
          overflow-wrap: anywhere;
        }

        @media (max-width: 900px) {
          .project-lead-links {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 650px) {
          .project-lead-links {
            grid-template-columns: 1fr;
          }

          .project-lead-header h2 {
            font-size: 23px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .project-lead-links a:hover {
            transform: none;
          }
        }
      `}</style>
    </PublicPageLayout>
  );
}

export default Contact;
