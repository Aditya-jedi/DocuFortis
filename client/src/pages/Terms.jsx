
import PublicPageLayout from "./PublicPageLayout";

function Terms() {
  return (
    <PublicPageLayout
      activePage=""
      eyebrow="Terms of Service"
      title="Terms and Conditions"
      description="Please read these terms before creating an account or using DocuFortis."
    >
      <section className="public-card">
        <h2>1. Acceptance of terms</h2>
        <p>
          By accessing or using DocuFortis, you agree to follow these
          terms. If you do not agree, you should not use the platform.
        </p>
      </section>

      <section className="public-card">
        <h2>2. Account responsibilities</h2>
        <p>
          You are responsible for providing accurate account information,
          maintaining the confidentiality of your credentials, and
          protecting access to your account.
        </p>
        <p>
          You should notify the project administrator if you believe
          your account has been accessed without your permission.
        </p>
      </section>

      <section className="public-card">
        <h2>3. Acceptable use</h2>
        <p>You agree not to use DocuFortis to:</p>
        <ul>
          <li>Upload or share content that you do not have the right to use.</li>
          <li>Attempt to access another user's account or documents without authorization.</li>
          <li>Interfere with the operation or security of the platform.</li>
          <li>Use the service for unlawful, harmful, or fraudulent activities.</li>
          <li>Attempt to bypass authentication, access restrictions, or sharing controls.</li>
        </ul>
      </section>

      <section className="public-card">
        <h2>4. Documents and ownership</h2>
        <p>
          You remain responsible for the documents and content you upload.
          You should ensure that you have the necessary rights and
          permissions to store and share that content.
        </p>
        <p>
          You are responsible for checking recipients and permissions
          before creating a document-sharing link.
        </p>
      </section>

      <section className="public-card">
        <h2>5. Sharing and access permissions</h2>
        <p>
          Shared documents may be accessed according to the permissions,
          recipient restrictions, and expiration settings selected when
          the share is created. You are responsible for reviewing these
          settings before sharing.
        </p>
        <p>
          Revoking a share prevents future access through that share,
          but it cannot guarantee deletion of copies that a recipient
          may already have downloaded or otherwise obtained.
        </p>
      </section>

      <section className="public-card">
        <h2>6. Storage plans</h2>
        <p>
          Storage availability is determined by the plan assigned to
          your account. The platform currently provides a 60 MB Free
          plan and a 90 MB Premium plan. Plan features and limits may
          change as the project develops.
        </p>
        <p>
          Premium access may require approval through the platform's
          configured process. A displayed plan does not imply that
          payment processing is available.
        </p>
      </section>

      <section className="public-card">
        <h2>7. Availability and changes</h2>
        <p>
          DocuFortis may be updated, modified, temporarily unavailable,
          or discontinued as the platform develops. Features may change
          without prior notice.
        </p>
      </section>

      <section className="public-card">
        <h2>8. Disclaimer</h2>
        <p>
          DocuFortis is provided on an as-available basis. The platform
          is designed to support document management and security, but
          it does not guarantee that data will never be lost, exposed,
          or affected by service interruptions.
        </p>
        <p>
          Users should retain appropriate backups of important documents
          and avoid treating the platform as their only copy of critical
          information.
        </p>
      </section>

      <section className="public-card">
        <h2>9. Suspension or termination</h2>
        <p>
          Access may be restricted or suspended where necessary to
          protect the platform, its users, or its operation, including
          in response to suspected misuse or unauthorized activity.
        </p>
      </section>

      <section className="public-card">
        <h2>10. Changes to these terms</h2>
        <p>
          These terms may be revised as DocuFortis evolves. Continued
          use of the platform after updated terms are published
          constitutes acceptance of the revised terms where permitted
          by applicable law.
        </p>
      </section>
    </PublicPageLayout>
  );
}

export default Terms;
