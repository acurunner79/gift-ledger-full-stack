import { useState } from "react";
import type { SyntheticEvent } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api";

type ForgotPasswordResponse = {
  message: string;
};

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const data = await apiRequest<ForgotPasswordResponse>(
        "/api/auth/forgot-password",
        {
          method: "POST",
          body: JSON.stringify({
            email
          })
        }
      );

      setMessage(data.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to request password reset"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-card">
      <p className="eyebrow">Gift Ledger</p>
      <h1>Reset your password.</h1>
      <p className="hero-text">
        Enter your account email and we&apos;ll send password reset instructions
        if the account exists.
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        {message && <p className="form-success">{message}</p>}
        {error && <p className="form-error">{error}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <p className="auth-switch">
        Remember your password? <Link to="/login">Back to login</Link>
      </p>
    </section>
  );
}