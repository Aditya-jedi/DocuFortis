
import { useEffect, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenChecking, setTokenChecking] = useState(true);
const [tokenValid, setTokenValid] = useState(false);

  const token = new URLSearchParams(window.location.search).get("token");
useEffect(() => {
  let cancelled = false;

  async function validateToken() {
    if (!token || token.length !== 64) {
      setMessage("This password reset link is invalid.");
      setTokenChecking(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/auth/validate-reset-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "This password reset link is invalid or has expired."
        );
      }

      if (!cancelled) {
        setTokenValid(true);
      }
    } catch (error) {
      if (!cancelled) {
        setMessage(
          error.message || "Unable to verify the reset link."
        );
      }
    } finally {
      if (!cancelled) {
        setTokenChecking(false);
      }
    }
  }

  validateToken();

  return () => {
    cancelled = true;
  };
}, [token]);
  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);

    if (!token || token.length !== 64) {
      setMessage("This password reset link is invalid.");
      return;
    }

    if (newPassword.length < 8) {
      setMessage("Password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            token,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to reset your password."
        );
      }

      setSuccess(true);
      setMessage(
        "Your password has been reset successfully. Please log in with your new password."
      );
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-container">
      <section className="auth-card">
        <div className="brand">
          <div className="brand-icon">D</div>
          <h1>DocuFortis</h1>
        </div>

        <p className="tagline">
          Secure document management and sharing
        </p>
<a href="/" className="back-to-login">
  ← Back to Login
</a>
        <h2>Reset your password</h2>

        <p className="form-description">
          Enter a new password for your DocuFortis account.
        </p>

        {tokenChecking ? (
  <p className="form-description">
    Verifying your password reset link...
  </p>
) : !tokenValid ? (
  <div>
    <p className="status-message" role="alert">
      {message || "This password reset link is invalid or has expired."}
    </p>

    <button
      type="button"
      className="submit-button"
      onClick={() => {
        window.location.href = "/forgot-password";
      }}
    >
      Request a New Reset Link
    </button>
  </div>
) : (
  <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="newPassword">
                New password
              </label>

              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Enter your new password"
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(event.target.value)
                }
                minLength={8}
                maxLength={128}
                required
                disabled={success}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirm new password
              </label>

              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                minLength={8}
                maxLength={128}
                required
                disabled={success}
              />
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={loading || success}
            >
              {loading
                ? "Resetting password..."
                : success
                  ? "Password Reset"
                  : "Reset Password"}
            </button>
          </form>
        )}

 {message && tokenValid && (
  <p className="status-message" role="status">
    {message}
  </p>
)}

        {success && (
          <p className="form-description">
            You can now return to the login page and sign in.
          </p>
        )}
      </section>
    </main>
  );
}

export default ResetPassword;
