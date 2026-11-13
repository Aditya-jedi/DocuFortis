
import PublicPageLayout from "./PublicPageLayout";

const questions = [
  {
    question: "What is DocuFortis?",
    answer:
      "DocuFortis is a security-focused document management and sharing platform. It allows users to upload, manage, preview, download, and share supported documents.",
  },
  {
    question: "How do I create an account?",
    answer:
      "Open the registration page, provide the requested details, complete the Cloudflare Turnstile security check, and follow the on-screen instructions to create your account.",
  },
  {
    question: "What file types can I upload?",
    answer:
      "The platform supports PDF, JPEG, PNG, WebP, and TXT files. The maximum individual file size is 10 MB.",
  },
  {
    question: "How much storage is available?",
    answer:
      "The Free plan provides 60 MB of storage. The Premium plan provides 90 MB. Your available storage is shown in your account dashboard.",
  },
  {
    question: "Can I share a document with a specific person?",
    answer:
      "Yes. Sharing options allow you to set access permissions and, where configured, restrict access to a specified recipient email address.",
  },
  {
    question: "Can I control what a recipient does with a shared document?",
    answer:
      "When creating a share, you can choose view only or view and download. You can also configure an expiration period.",
  },
  {
    question: "Can I revoke a shared link?",
    answer:
      "Yes. A share can be revoked from the relevant sharing controls. Once revoked, the link should no longer provide access to the document.",
  },
  {
    question: "What is multi-factor authentication?",
    answer:
      "Multi-factor authentication adds another verification step when signing in. DocuFortis supports authenticator-based verification and recovery codes.",
  },
  {
    question: "What should I do if I lose access to my authenticator?",
    answer:
      "Use a recovery code if you previously saved one. Keep recovery codes private and store them somewhere secure. If you cannot access your account, contact the project administrator.",
  },
  {
    question: "Can I delete uploaded documents?",
    answer:
      "Yes. Documents can be deleted through the document management interface. Review the selected document before confirming deletion.",
  },
  {
    question: "How do I reset my password?",
    answer:
      "Select “Forgot Password?” on the Login page, enter your account email, and follow the instructions provided.",
  },
  {
    question: "How do I request a Premium upgrade?",
    answer:
      "Sign in and start an upgrade from your dashboard. Choose an available option, complete the demonstration payment using fictional test details, then wait for administrator approval. No real charges are processed.",
  },
];

function FAQ({ user, onLogout, onSettings }) {
  return (
    <PublicPageLayout
      user={user}
      onLogout={onLogout}
      onSettings={onSettings}
      activePage="faq"
      eyebrow="Help Center"
      title="Frequently Asked Questions"
      description="Find answers to common questions about accounts, document management, sharing, storage, and security."
    >
      {questions.map((item, index) => (
        <details className="public-card" key={item.question}>
          <summary
            style={{
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: 700,
              lineHeight: 1.6,
            }}
          >
            {index + 1}. {item.question}
          </summary>
          <p style={{ marginTop: 14 }}>{item.answer}</p>
        </details>
      ))}
    </PublicPageLayout>
  );
}

export default FAQ;
