const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/response");
const { notifyAdminNewBooking } = require("../../services/booking-email.service");
const { sendMail } = require("../../services/mail.service");

const newBooking = asyncHandler(async (req, res) => {
  const { to, subject, html, booking } = req.body;
  const result = booking
    ? await notifyAdminNewBooking(booking)
    : await sendMail({
        to,
        subject: subject || "Nouvelle réservation YOLO",
        html: html || "<p>Nouvelle réservation</p>",
      });
  ok(res, { notified: result.sent, ...result });
});

const missionAssigned = asyncHandler(async (req, res) => {
  const { to, subject, html } = req.body;
  const result = await sendMail({ to, subject, html });
  ok(res, { notified: result.sent, ...result });
});

module.exports = { newBooking, missionAssigned };
