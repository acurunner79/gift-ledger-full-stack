import { useState } from "react";
import type { SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiRequest } from "../lib/api";

type ResetPasswordResponse = {
  message: string;
};

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!resetToken) {
      setError("Password reset token is missing.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await apiRequest<ResetPasswordResponse>(
        "/api/auth/reset-password",
        {
          method: "POST",
          body: JSON.stringify({
            token: resetToken,
            password
          })
        }
      );

      setMessage(data.message);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reset password"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-card">
      <p className="eyebrow">Gift Ledger</p>
      <h1>Create a new password.</h1>
      <p className="hero-text">
        Enter a new password for your Gift Ledger account.
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          New password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            maxLength={120}
            required
          />
        </label>

        <label>
          Confirm new password
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={8}
            maxLength={120}
            required
          />
        </label>

        {message && <p className="form-success">{message}</p>}
        {error && <p className="form-error">{error}</p>}

        <button type="submit" disabled={isSubmitting || !resetToken}>
          {isSubmitting ? "Resetting..." : "Reset Password"}
        </button>
      </form>

      <p className="auth-switch">
        Password reset complete? <Link to="/login">Back to login</Link>
      </p>
    </section>
  );
}