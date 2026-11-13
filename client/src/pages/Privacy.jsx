
import PublicPageLayout from "./PublicPageLayout";

function Privacy({ user, onLogout, onSettings }) {
  return (
    <PublicPageLayout
      user={user}
      onLogout={onLogout}
      onSettings={onSettings}
      activePage="privacy"
      eyebrow="Privacy"
      title="Privacy Policy"
      description="This page explains, at a general level, how DocuFortis handles information when you use the platform."
    >
      <section className="public-card">
        <h2>1. Information associated with your account</h2>
        <p>
          DocuFortis may process account information such as your name,
          email address, authentication details, and account settings to
          provide and maintain the service.
        </p>
      </section>

      <section className="public-card">
        <h2>2. Documents and files</h2>
        <p>
          Documents uploaded by users are stored to provide document
          management and sharing functionality. Users should only upload
          files they are authorized to store and manage.
        </p>
        <p>
          Document names, file details, storage usage, and related records
          may be processed to support document management features.
        </p>
      </section>

      <section className="public-card">
        <h2>3. Authentication and security information</h2>
        <p>
          The platform processes information required for account
          authentication and protection. This may include password
          verification data, session information, multi-factor
          authentication settings, and recovery-code records.
        </p>
        <p>
          Passwords should never be shared with anyone. Recovery codes
          should be kept private and stored securely.
        </p>
      </section>

      <section className="public-card">
        <h2>4. Activity and audit records</h2>
        <p>
          DocuFortis may record security-relevant activities such as
          account registration, sign-in attempts, sign-outs, document
          actions, and sharing events. These records help support
          troubleshooting, accountability, and security monitoring.
        </p>
      </section>

      <section className="public-card">
        <h2>5. Document sharing</h2>
        <p>
          When you create a document share, information needed to enforce
          the selected permissions, recipient restrictions, expiration
          settings, and revocation status may be processed.
        </p>
        <p>
          Anyone who receives a valid sharing link may be able to attempt
          access, subject to the restrictions configured for that share.
          Share links should therefore be handled carefully.
        </p>
      </section>

      <section className="public-card">
        <h2>6. Service providers</h2>
        <p>
          DocuFortis uses third-party infrastructure and services to
          support application hosting, database functionality, file
          storage, and security verification. Information may be processed
          by those providers as necessary to operate the platform and
          subject to their applicable terms and privacy practices.
        </p>
      </section>

      <section className="public-card">
        <h2>7. Data security</h2>
        <p>
          The platform incorporates security measures intended to help
          protect accounts, sessions, documents, and sharing operations.
          However, no online service can guarantee absolute security.
          Users should use strong passwords and protect their account
          credentials.
        </p>
      </section>

      <section className="public-card">
        <h2>8. Data retention and deletion</h2>
        <p>
          Information may be retained for as long as needed to operate
          the platform, maintain account functionality, preserve relevant
          security records, or meet applicable obligations. Specific
          retention periods and deletion procedures should be confirmed
          with the project administrator.
        </p>
      </section>

      <section className="public-card">
        <h2>9. Children's privacy</h2>
        <p>
          DocuFortis is not intended to be used by children without
          appropriate permission and supervision where required by
          applicable law.
        </p>
      </section>

      <section className="public-card">
        <h2>10. Policy updates and contact</h2>
        <p>
          This policy may be updated as the platform develops. For
          questions about privacy or information associated with your
          account, email{" "}
          <a href="mailto:codesyndicate.dev@gmail.com">
            codesyndicate.dev@gmail.com
          </a>
          .
        </p>
      </section>
    </PublicPageLayout>
  );
}

export default Privacy;
