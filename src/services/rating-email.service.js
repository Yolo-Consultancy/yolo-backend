const env = require("../config/env");
const { sendMail } = require("./mail.service");

function buildClientRatingEmailHtml({ clientName, driverName, vehicleName, ratingUrl }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><title>Votre avis compte — YOLO</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#fff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#111;border-radius:16px;border:1px solid rgba(255,255,255,0.1);max-width:600px;">
        <tr><td style="padding:32px 36px;border-bottom:1px solid rgba(255,255,255,0.08);">
          <span style="font-size:26px;font-weight:700;color:#fff;">YOLO<span style="color:#7dd3fc;">.</span></span>
          <p style="margin:8px 0 0;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#7dd3fc;">Votre avis nous intéresse</p>
        </td></tr>
        <tr><td style="padding:32px 36px;font-size:14px;line-height:1.7;color:rgba(255,255,255,0.85);">
          <p style="margin:0 0 16px;">Bonjour <strong style="color:#fff;">${clientName || "cher client"}</strong>,</p>
          <p style="margin:0 0 20px;">Votre course avec YOLO Le Concierge vient de se terminer. Nous espérons que tout s'est bien passé.</p>
          <p style="margin:0 0 20px;">Prenez une minute pour nous dire comment vous avez trouvé <strong>notre service</strong> et le <strong>comportement de votre chauffeur${driverName ? ` (${driverName})` : ""}</strong>.</p>
          ${vehicleName ? `<p style="margin:0 0 20px;font-size:13px;color:rgba(255,255,255,0.5);">Véhicule : ${vehicleName}</p>` : ""}
          <p style="margin:0 0 24px;">
            <a href="${ratingUrl}" style="display:inline-block;background:#7dd3fc;color:#000;font-weight:700;font-size:14px;padding:14px 28px;border-radius:8px;text-decoration:none;">
              Noter ma course →
            </a>
          </p>
          <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.4);">Ce lien est personnel et valable 7 jours. Merci pour votre confiance.</p>
        </td></tr>
        <tr><td style="border-top:1px solid rgba(255,255,255,0.06);padding:18px 36px;text-align:center;">
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.25);">YOLO Le Concierge · Kinshasa, RDC</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function sendClientRatingRequest(report) {
  const email = report.clientEmail?.trim();
  if (!email) return { sent: false, reason: "no_client_email" };
  if (!report.ratingToken) return { sent: false, reason: "no_token" };

  const baseUrl = env.adminUrl.replace(/\/$/, "");
  const ratingUrl = `${baseUrl}/evaluer/${report.ratingToken}`;
  const subject = `[YOLO] Comment s'est passée votre course ?`;
  const html = buildClientRatingEmailHtml({
    clientName: report.clientName,
    driverName: report.driverName,
    vehicleName: report.vehicleName,
    ratingUrl,
  });

  return sendMail({ to: email, subject, html });
}

module.exports = { sendClientRatingRequest, buildClientRatingEmailHtml };
