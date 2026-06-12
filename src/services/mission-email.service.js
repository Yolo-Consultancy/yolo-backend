const { sendMail } = require("./mail.service");

const missionTypeLabels = {
  livraison: "Livraison",
  chauffeur: "Service chauffeur",
  recuperation: "Récupération",
};

function formatDate(iso) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildDriverMissionEmailHtml({ mission, driver, booking }) {
  const missionId = String(mission.id || mission._id || "").toUpperCase();
  const startDate = booking.startDate
    ? new Date(booking.startDate).toLocaleDateString("fr-FR")
    : "—";
  const endDate = booking.endDate
    ? new Date(booking.endDate).toLocaleDateString("fr-FR")
    : "—";

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><title>Nouvelle mission YOLO</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#fff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#111;border-radius:16px;border:1px solid rgba(255,255,255,0.1);max-width:600px;">
        <tr><td style="padding:32px 36px;border-bottom:1px solid rgba(255,255,255,0.08);">
          <span style="font-size:26px;font-weight:700;color:#fff;">YOLO<span style="color:#7dd3fc;">.</span></span>
          <p style="margin:8px 0 0;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.4);">Nouvelle mission terrain</p>
        </td></tr>
        <tr><td style="padding:32px 36px;">
          <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.75);">
            Bonjour <strong style="color:#fff;">${driver.firstName} ${driver.lastName}</strong>,<br/><br/>
            Une mission vient de vous être affectée par l'équipe YOLO.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;border:1px solid rgba(255,255,255,0.08);">
            <tr><td style="padding:14px 18px;background:rgba(125,211,252,0.08);font-size:12px;font-weight:600;text-transform:uppercase;color:#7dd3fc;">Détails</td></tr>
            <tr><td style="padding:18px;font-size:14px;color:rgba(255,255,255,0.85);line-height:1.7;">
              <p style="margin:0 0 6px;"><strong>Référence :</strong> #${missionId}</p>
              <p style="margin:0 0 6px;"><strong>Type :</strong> ${missionTypeLabels[mission.type] || mission.type}</p>
              <p style="margin:0 0 6px;"><strong>Planifiée :</strong> ${formatDate(mission.scheduledAt)}</p>
              <p style="margin:0 0 6px;"><strong>Véhicule :</strong> ${booking.vehicleName || "—"}</p>
              <p style="margin:0 0 6px;"><strong>Client :</strong> ${booking.clientName || "—"}</p>
              <p style="margin:0 0 6px;"><strong>Lieu :</strong> ${booking.pickupLocation || "—"}</p>
              <p style="margin:0 0 6px;"><strong>Dates :</strong> ${startDate} → ${endDate}</p>
              ${mission.notes ? `<p style="margin:12px 0 0;padding-top:12px;border-top:1px solid rgba(255,255,255,0.08);"><strong>Notes :</strong> ${mission.notes}</p>` : ""}
            </td></tr>
          </table>
          <p style="margin:20px 0 0;font-size:13px;color:rgba(255,255,255,0.5);">Merci de confirmer votre disponibilité auprès de l'équipe YOLO.</p>
        </td></tr>
        <tr><td style="border-top:1px solid rgba(255,255,255,0.06);padding:18px 36px;text-align:center;">
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.25);">YOLO Le Concierge · Kinshasa, RDC</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function notifyDriverMissionAssigned({ mission, driver, booking }) {
  if (!driver?.email?.trim()) {
    return { sent: false, reason: "no_driver_email" };
  }

  const subject = `[YOLO] Nouvelle mission — ${missionTypeLabels[mission.type] || mission.type} · ${booking.vehicleName || "véhicule"}`;
  const html = buildDriverMissionEmailHtml({ mission, driver, booking });

  return sendMail({ to: driver.email, subject, html });
}

module.exports = { notifyDriverMissionAssigned, buildDriverMissionEmailHtml };
