const env = require("../config/env");
const { sendMail } = require("./mail.service");
const { getSettings } = require("../modules/settings/settings.service");

function formatPrice(n) {
  return Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0 });
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    const [y, m, day] = String(iso).split("-");
    return day && m && y ? `${day}/${m}/${y}` : String(iso);
  }
  return d.toLocaleDateString("fr-FR");
}

function buildAdminBookingEmailHtml(booking, adminUrl) {
  const id = String(booking.id || "").toUpperCase();
  const createdAt = booking.createdAt
    ? new Date(booking.createdAt).toLocaleString("fr-FR")
    : new Date().toLocaleString("fr-FR");

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><title>Nouvelle réservation YOLO</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#fff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#111;border-radius:16px;border:1px solid rgba(255,255,255,0.1);max-width:600px;">
        <tr><td style="padding:32px 36px;border-bottom:1px solid rgba(255,255,255,0.08);">
          <span style="font-size:26px;font-weight:700;color:#fff;">YOLO<span style="color:#7dd3fc;">.</span></span>
          <p style="margin:8px 0 0;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#7dd3fc;">Nouvelle réservation</p>
        </td></tr>
        <tr><td style="padding:32px 36px;font-size:14px;line-height:1.7;color:rgba(255,255,255,0.85);">
          <p style="margin:0 0 20px;">Une nouvelle réservation vient d'être soumise sur <strong style="color:#fff;">YOLO Le Concierge</strong>.</p>
          <p style="margin:0 0 8px;"><strong>Référence :</strong> #${id}</p>
          <p style="margin:0 0 8px;"><strong>Reçue le :</strong> ${createdAt}</p>
          <p style="margin:0 0 8px;"><strong>Véhicule :</strong> ${booking.vehicleName || "—"}</p>
          <p style="margin:0 0 8px;"><strong>Client :</strong> ${booking.clientName || "—"}</p>
          <p style="margin:0 0 8px;"><strong>Téléphone :</strong> ${booking.clientPhone || "—"}</p>
          ${booking.clientEmail ? `<p style="margin:0 0 8px;"><strong>E-mail :</strong> ${booking.clientEmail}</p>` : ""}
          <p style="margin:0 0 8px;"><strong>Dates :</strong> ${formatDate(booking.startDate)} → ${formatDate(booking.endDate)} (${booking.days || "—"} j)</p>
          <p style="margin:0 0 8px;"><strong>Lieu :</strong> ${booking.pickupLocation || "—"}</p>
          <p style="margin:0 0 8px;"><strong>Chauffeur :</strong> ${booking.withChauffeur ? (booking.driverName || "À affecter") : "Non"}</p>
          <p style="margin:0 0 8px;"><strong>Montant :</strong> <span style="color:#7dd3fc;font-size:18px;font-weight:700;">$${formatPrice(booking.totalPrice)}</span></p>
          <p style="margin:0 0 8px;"><strong>Statut :</strong> ${booking.status || "en_attente"}</p>
          <p style="margin:24px 0 0;">
            <a href="${adminUrl}/admin/reservations" style="display:inline-block;background:#7dd3fc;color:#000;font-weight:700;font-size:13px;padding:12px 24px;border-radius:8px;text-decoration:none;">
              Voir dans l'admin →
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

async function resolveAdminEmail() {
  if (env.adminNotificationEmail) return env.adminNotificationEmail;
  try {
    const settings = await getSettings();
    if (settings.contactEmail?.trim()) return settings.contactEmail.trim();
  } catch {
    /* ignore */
  }
  return env.adminBootstrapEmail;
}

async function notifyAdminNewBooking(booking) {
  const to = await resolveAdminEmail();
  const subject = `[YOLO] Nouvelle réservation — ${booking.vehicleName || "véhicule"} · ${booking.clientName || "client"}`;
  const html = buildAdminBookingEmailHtml(booking, env.adminUrl.replace(/\/$/, ""));

  return sendMail({ to, subject, html });
}

const statusLabels = {
  en_attente: "En attente",
  confirmee: "Confirmée",
  payee: "Payée",
  terminee: "Terminée",
  annulee: "Annulée",
};

const statusMessages = {
  en_attente: "Votre demande de réservation a bien été reçue et est en cours de traitement par notre équipe.",
  confirmee: "Bonne nouvelle ! Votre réservation a été confirmée par YOLO Le Concierge.",
  payee: "Votre paiement a été enregistré. Votre réservation est maintenant payée et finalisée côté facturation.",
  terminee: "Votre prestation est terminée. Merci d'avoir choisi YOLO Le Concierge.",
  annulee: "Votre réservation a été annulée. Pour toute question, contactez notre support.",
};

function buildClientStatusEmailHtml(booking, previousStatus, newStatus, clientUrl) {
  const id = String(booking.id || "").toUpperCase();
  const label = statusLabels[newStatus] || newStatus;
  const message = statusMessages[newStatus] || "Le statut de votre réservation a été mis à jour.";
  const prevLabel = statusLabels[previousStatus] || previousStatus;

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><title>Mise à jour réservation YOLO</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#fff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#111;border-radius:16px;border:1px solid rgba(255,255,255,0.1);max-width:600px;">
        <tr><td style="padding:32px 36px;border-bottom:1px solid rgba(255,255,255,0.08);">
          <span style="font-size:26px;font-weight:700;color:#fff;">YOLO<span style="color:#7dd3fc;">.</span></span>
          <p style="margin:8px 0 0;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#7dd3fc;">Mise à jour de réservation</p>
        </td></tr>
        <tr><td style="padding:32px 36px;font-size:14px;line-height:1.7;color:rgba(255,255,255,0.85);">
          <p style="margin:0 0 16px;">Bonjour <strong style="color:#fff;">${booking.clientName || "cher client"}</strong>,</p>
          <p style="margin:0 0 20px;">${message}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;border:1px solid rgba(255,255,255,0.08);margin-bottom:20px;">
            <tr><td style="padding:18px;">
              <p style="margin:0 0 8px;"><strong>Référence :</strong> #${id}</p>
              <p style="margin:0 0 8px;"><strong>Véhicule :</strong> ${booking.vehicleName || "—"}</p>
              <p style="margin:0 0 8px;"><strong>Dates :</strong> ${formatDate(booking.startDate)} → ${formatDate(booking.endDate)}</p>
              <p style="margin:0 0 8px;"><strong>Ancien statut :</strong> ${prevLabel}</p>
              <p style="margin:0 0 8px;"><strong>Nouveau statut :</strong> <span style="color:#7dd3fc;font-weight:700;">${label}</span></p>
              <p style="margin:0;"><strong>Montant :</strong> $${formatPrice(booking.totalPrice)}</p>
            </td></tr>
          </table>
          <p style="margin:0 0 20px;">
            <a href="${clientUrl}/client/reservations" style="display:inline-block;background:#7dd3fc;color:#000;font-weight:700;font-size:13px;padding:12px 24px;border-radius:8px;text-decoration:none;">
              Voir mes réservations →
            </a>
          </p>
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.5);">Une question ? Répondez à cet e-mail ou contactez notre conciergerie.</p>
        </td></tr>
        <tr><td style="border-top:1px solid rgba(255,255,255,0.06);padding:18px 36px;text-align:center;">
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.25);">YOLO Le Concierge · Kinshasa, RDC</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function notifyClientBookingStatusChange(booking, previousStatus, newStatus) {
  const email = booking.clientEmail?.trim();
  if (!email) {
    return { sent: false, reason: "no_client_email" };
  }
  if (previousStatus === newStatus) {
    return { sent: false, reason: "status_unchanged" };
  }

  const label = statusLabels[newStatus] || newStatus;
  const subject = `[YOLO] Réservation ${label} — ${booking.vehicleName || "votre véhicule"}`;
  const clientUrl = env.adminUrl.replace(/\/$/, "");
  const html = buildClientStatusEmailHtml(booking, previousStatus, newStatus, clientUrl);

  return sendMail({ to: email, subject, html });
}

module.exports = {
  notifyAdminNewBooking,
  notifyClientBookingStatusChange,
  buildAdminBookingEmailHtml,
  buildClientStatusEmailHtml,
  statusLabels,
  resolveAdminEmail,
};
