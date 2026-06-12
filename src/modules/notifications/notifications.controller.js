const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/response");
const env = require("../../config/env");

/** En dev, log l'e-mail. Brancher Nodemailer/Resend en prod via MAIL_* env vars. */
async function sendMail({ to, subject, html }) {
  console.log("[YOLO mail]", { to, subject, preview: html?.slice(0, 120) });
  return { sent: true, provider: "console" };
}

const newBooking = asyncHandler(async (req, res) => {
  const { to, subject, html, booking } = req.body;
  await sendMail({
    to: to || env.adminBootstrapEmail,
    subject: subject || `Nouvelle réservation – ${booking?.vehicleName}`,
    html: html || `<p>Nouvelle réservation de ${booking?.clientName}</p>`,
  });
  ok(res, { notified: true });
});

const missionAssigned = asyncHandler(async (req, res) => {
  const { to, subject, html } = req.body;
  await sendMail({ to, subject, html });
  ok(res, { notified: true });
});

module.exports = { newBooking, missionAssigned };
