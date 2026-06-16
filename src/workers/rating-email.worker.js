const TripReport = require("../models/TripReport");
const { toTripReport } = require("../utils/serializers");
const { sendClientRatingRequest } = require("../services/rating-email.service");

const POLL_INTERVAL_MS = 60 * 1000;

async function processPendingRatingEmails() {
  const now = new Date();
  const pending = await TripReport.find({
    ratingEmailSent: false,
    ratingEmailSendAt: { $lte: now },
    clientEmail: { $exists: true, $ne: "" },
  }).limit(20);

  for (const doc of pending) {
    const report = toTripReport(doc);
    report.ratingToken = doc.ratingToken;
    report.clientEmail = doc.clientEmail;

    try {
      const result = await sendClientRatingRequest(report);
      if (result.sent) {
        doc.ratingEmailSent = true;
        await doc.save();
        console.log(`[YOLO] E-mail de notation envoyé à ${doc.clientEmail}`);
      } else if (result.reason === "no_client_email") {
        doc.ratingEmailSent = true;
        await doc.save();
      } else {
        console.warn(`[YOLO] E-mail de notation non envoyé: ${result.reason || "unknown"}`);
      }
    } catch (err) {
      console.error("[YOLO] Erreur envoi e-mail notation:", err.message);
    }
  }
}

function startRatingEmailWorker() {
  processPendingRatingEmails();
  setInterval(processPendingRatingEmails, POLL_INTERVAL_MS);
  console.log("[YOLO] Worker e-mails de notation démarré (vérification chaque minute)");
}

module.exports = { startRatingEmailWorker, processPendingRatingEmails };
