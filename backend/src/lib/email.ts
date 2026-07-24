import nodemailer from "nodemailer";

type PasswordResetEmailInput = {
  to: string;
  resetUrl: string;
};

function getRequiredEmailConfig() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const emailFrom = process.env.EMAIL_FROM;

  if (!smtpHost || !smtpUser || !smtpPass || !emailFrom) {
    return null;
  }

  return {
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPass,
    emailFrom
  };
}

export async function sendPasswordResetEmail({
  to,
  resetUrl
}: PasswordResetEmailInput) {
  const emailConfig = getRequiredEmailConfig();

  if (!emailConfig) {
    console.info(`Password reset email not configured. Reset link: ${resetUrl}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: emailConfig.smtpHost,
    port: emailConfig.smtpPort,
    secure: emailConfig.smtpPort === 465,
    auth: {
      user: emailConfig.smtpUser,
      pass: emailConfig.smtpPass
    }
  });

  await transporter.sendMail({
    from: emailConfig.emailFrom,
    to,
    subject: "Reset your Gift Ledger password",
    text: [
      "We received a request to reset your Gift Ledger password.",
      "",
      "Use the link below to create a new password:",
      resetUrl,
      "",
      "This link expires in 1 hour.",
      "",
      "If you did not request this reset, you can ignore this email."
    ].join("\n"),
    html: `
      <p>We received a request to reset your Gift Ledger password.</p>
      <p>Use the link below to create a new password:</p>
      <p><a href="${resetUrl}">Reset your password</a></p>
      <p>This link expires in 1 hour.</p>
      <p>If you did not request this reset, you can ignore this email.</p>
    `
  });
}