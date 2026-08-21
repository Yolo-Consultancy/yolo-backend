const crypto = require("crypto");
const ApiError = require("../../utils/ApiError");
const env = require("../../config/env");
const Client = require("../../models/Client");
const { sendMail } = require("../../services/mail.service");
const { hashPassword } = require("./auth.service");

const RESET_TTL_MS = 60 * 60 * 1000;

function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function buildResetUrl(token) {
  const base = env.frontendUrl.replace(/\/$/, "");
  return `${base}/connexion?mode=reset&token=${encodeURIComponent(token)}`;
}

async function requestClientPasswordReset(email) {
  const normalized = email.trim().toLowerCase();
  const client = await Client.findOne({ email: normalized });
  if (!client?.passwordHash) {
    return { sent: false, reason: "no_client_account" };
  }

  const token = crypto.randomBytes(32).toString("hex");
  client.passwordResetTokenHash = hashResetToken(token);
  client.passwordResetExpires = new Date(Date.now() + RESET_TTL_MS);
  await client.save();

  const resetUrl = buildResetUrl(token);
  const firstName = client.firstName?.trim() || "Client";

  const mailResult = await sendMail({
    to: normalized,
    subject: "Réinitialisation de votre mot de passe — YOLO Le Concierge",
    html: `
      <p>Bonjour ${firstName},</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe YOLO Le Concierge.</p>
      <p><a href="${resetUrl}">Cliquez ici pour choisir un nouveau mot de passe</a></p>
      <p>Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
      <p>L'équipe YOLO Le Concierge</p>
    `,
    text: `Bonjour ${firstName},\n\nRéinitialisez votre mot de passe : ${resetUrl}\n\nCe lien expire dans 1 heure.`,
  });

  return {
    sent: mailResult.sent,
    reason: mailResult.reason,
    previewUrl: mailResult.previewUrl,
  };
}

async function resetClientPassword(token, password) {
  if (!token?.trim()) {
    throw new ApiError(400, "VALIDATION_ERROR", "Lien de réinitialisation invalide");
  }
  if (!password || password.length < 6) {
    throw new ApiError(400, "VALIDATION_ERROR", "Mot de passe trop court (min. 6 caractères)");
  }

  const tokenHash = hashResetToken(token.trim());
  const client = await Client.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!client) {
    throw new ApiError(400, "INVALID_TOKEN", "Lien expiré ou invalide. Demandez une nouvelle réinitialisation.");
  }

  client.passwordHash = await hashPassword(password);
  client.passwordResetTokenHash = undefined;
  client.passwordResetExpires = undefined;
  await client.save();

  return { reset: true };
}

module.exports = { requestClientPasswordReset, resetClientPassword };
