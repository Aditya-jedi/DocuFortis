
import { useState } from "react";
import { Link } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: email.trim() }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to process your request."
        );
      }

      setSubmitted(true);
    } catch (error) {
      setMessage(
        error.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-container auth-screen">
      <section className="auth-card auth-card--recovery">
        <Link to="/home" className="brand auth-brand">
          <span className="brand-icon">D</span>
          <span className="auth-brand-copy">
            <h1>DocuFortis</h1>
            <small>by Code Syndicate</small>
          </span>
        </Link>

        <p className="tagline">
          Secure document management and sharing
        </p>
        <div className="auth-secondary-nav">
          <a href="/" className="back-to-login auth-secondary-link">
            ← Back to Login
          </a>
        </div>

        {!submitted ? (
          <>
            <h2 className="auth-heading">Forgot your password?</h2>

            <p className="form-description">
              Enter the email address associated with your
              DocuFortis account. We'll send you a password
              recovery link if an account exists.
            </p>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  maxLength={254}
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="submit-button"
                disabled={loading}
              >
                {loading
                  ? "Sending request..."
                  : "Send Reset Link"}
              </button>
            </form>

            {message && (
              <p className="status-message" role="alert">
                {message}
              </p>
            )}
          </>
        ) : (
          <>
            <h2 className="auth-heading">Check your email</h2>

            <p className="form-description">
              If an account exists with the email address
              you entered, you will receive a password
              reset link shortly.
            </p>

            <p className="form-description">
              Please check your inbox and spam folder.
              The reset link expires after 15 minutes.
            </p>

            <button
              type="button"
              className="submit-button auth-secondary-button"
              onClick={() => {
                window.location.href = "/";
              }}
            >
              Back to Login
            </button>
          </>
        )}
      </section>
    </main>
  );
}

export default ForgotPassword;
