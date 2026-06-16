const crypto = require("crypto");
const env = require("../config/env");
const { sendMail } = require("./mail.service");
const { resolveAdminEmail } = require("./booking-email.service");

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleString("fr-FR");
}

function buildAdminTripReportHtml(report, adminUrl) {
  const id = String(report.id || "").toUpperCase();
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><title>Rapport de fin de course — YOLO</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#fff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#111;border-radius:16px;border:1px solid rgba(255,255,255,0.1);max-width:600px;">
        <tr><td style="padding:32px 36px;border-bottom:1px solid rgba(255,255,255,0.08);">
          <span style="font-size:26px;font-weight:700;color:#fff;">YOLO<span style="color:#7dd3fc;">.</span></span>
          <p style="margin:8px 0 0;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#7dd3fc;">Rapport de fin de course</p>
        </td></tr>
        <tr><td style="padding:32px 36px;font-size:14px;line-height:1.7;color:rgba(255,255,255,0.85);">
          <p style="margin:0 0 20px;">Le chauffeur <strong style="color:#fff;">${report.driverName || "—"}</strong> a clôturé une course.</p>
          <p style="margin:0 0 8px;"><strong>Référence :</strong> #${id}</p>
          <p style="margin:0 0 8px;"><strong>Date :</strong> ${formatDate(report.submittedAt)}</p>
          <p style="margin:0 0 8px;"><strong>Client :</strong> ${report.clientName || "—"}</p>
          <p style="margin:0 0 8px;"><strong>Véhicule :</strong> ${report.vehicleName || "—"}</p>
          ${report.odometerEnd ? `<p style="margin:0 0 8px;"><strong>Kilométrage fin :</strong> ${report.odometerEnd} km</p>` : ""}
          ${report.fuelLevel ? `<p style="margin:0 0 8px;"><strong>Carburant :</strong> ${report.fuelLevel}</p>` : ""}
          <p style="margin:16px 0 8px;"><strong>Compte-rendu :</strong></p>
          <p style="margin:0 0 16px;padding:12px 16px;background:rgba(255,255,255,0.05);border-radius:8px;white-space:pre-wrap;">${report.notes || "—"}</p>
          ${report.incidents ? `<p style="margin:0 0 8px;"><strong>Incidents :</strong> ${report.incidents}</p>` : ""}
          <p style="margin:24px 0 0;">
            <a href="${adminUrl}/admin/rapports" style="display:inline-block;background:#7dd3fc;color:#000;font-weight:700;font-size:13px;padding:12px 24px;border-radius:8px;text-decoration:none;">
              Voir les rapports →
            </a>
          </p>
        </td></tr>
        <tr><td style="border-top:1px solid rgba(255,255,255,0.06);padding:18px 36px;text-align:center;">
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.25);">YOLO Le Concierge · Kinshasa, RDC</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function notifyAdminTripReport(report) {
  const to = await resolveAdminEmail();
  const subject = `[YOLO] Fin de course — ${report.driverName || "chauffeur"} · ${report.clientName || "client"}`;
  const html = buildAdminTripReportHtml(report, env.adminUrl.replace(/\/$/, ""));
  return sendMail({ to, subject, html });
}

function generateRatingToken() {
  return crypto.randomBytes(32).toString("hex");
}

module.exports = { notifyAdminTripReport, generateRatingToken };
