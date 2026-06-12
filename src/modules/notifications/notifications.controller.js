const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/response");
const env = require("../../config/env");
const { sendMail } = require("../../services/mail.service");

const newBooking = asyncHandler(async (req, res) => {
  const { to, subject, html, booking } = req.body;
  const result = await sendMail({
    to: to || env.adminBootstrapEmail,
    subject: subject || `Nouvelle réservation – ${booking?.vehicleName}`,
    html: html || `<p>Nouvelle réservation de ${booking?.clientName}</p>`,
  });
  ok(res, { notified: result.sent, ...result });
});

const missionAssigned = asyncHandler(async (req, res) => {
  const { to, subject, html } = req.body;
  const result = await sendMail({ to, subject, html });
  ok(res, { notified: result.sent, ...result });
});

module.exports = { newBooking, missionAssigned };
