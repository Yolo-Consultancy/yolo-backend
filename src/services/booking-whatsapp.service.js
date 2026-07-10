const env = require("../config/env");
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

function phoneDigits(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function buildAdminWhatsAppMessage(booking) {
  const clientDigits = phoneDigits(booking.clientPhone);
  const clientWaLink = clientDigits ? `https://wa.me/${clientDigits}` : "";

  const lines = [
    "🔔 *Nouvelle réservation YOLO*",
    "",
    `🚗 *Véhicule :* ${booking.vehicleName || "—"}`,
    `👤 *Client :* ${booking.clientName || "—"}`,
    `📞 *Tél. client :* ${booking.clientPhone || "—"}`,
  ];

  if (booking.clientEmail) {
    lines.push(`📧 *E-mail :* ${booking.clientEmail}`);
  }

  lines.push(
    `📅 *Dates :* ${formatDate(booking.startDate)} → ${formatDate(booking.endDate)} (${booking.days || "—"} j)`,
    `📍 *Prise en charge :* ${booking.pickupLocation || "—"}`,
    `💰 *Total :* $${formatPrice(booking.totalPrice)}`,
    `📋 *Statut :* ${booking.status || "en_attente"}`,
  );

  if (clientWaLink) {
    lines.push("", `💬 *Contacter le client :* ${clientWaLink}`);
  }

  return lines.join("\n");
}

async function sendViaCallMeBot(adminPhone, text, apiKey) {
  const digits = phoneDigits(adminPhone);
  if (!digits || !apiKey) {
    return { sent: false, reason: "callmebot_not_configured" };
  }

  const phoneParam = encodeURIComponent(`+${digits}`);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phoneParam}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(url);
    const body = await res.text();
    if (!res.ok) {
      return { sent: false, reason: `callmebot_http_${res.status}`, detail: body.slice(0, 200) };
    }
    if (/error/i.test(body)) {
      return { sent: false, reason: "callmebot_error", detail: body.slice(0, 200) };
    }
    return { sent: true, provider: "callmebot" };
  } catch (err) {
    return { sent: false, reason: "callmebot_fetch_failed", detail: err.message };
  }
}

async function sendViaWhatsAppCloud(adminPhone, text) {
  const token = env.whatsappAccessToken;
  const phoneNumberId = env.whatsappPhoneNumberId;
  if (!token || !phoneNumberId) {
    return { sent: false, reason: "whatsapp_cloud_not_configured" };
  }

  const digits = phoneDigits(adminPhone);
  if (!digits) return { sent: false, reason: "no_admin_phone" };

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: digits,
        type: "text",
        text: { body: text },
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return { sent: false, reason: `whatsapp_cloud_http_${res.status}`, detail: detail.slice(0, 200) };
    }

    return { sent: true, provider: "whatsapp_cloud" };
  } catch (err) {
    return { sent: false, reason: "whatsapp_cloud_fetch_failed", detail: err.message };
  }
}

async function notifyAdminNewBookingWhatsApp(booking) {
  let adminPhone = "";
  try {
    const settings = await getSettings();
    adminPhone = settings.whatsappNumber?.trim() || "";
  } catch {
    /* ignore */
  }

  if (!adminPhone) {
    return { sent: false, reason: "no_whatsapp_number" };
  }

  const message = buildAdminWhatsAppMessage(booking);

  const cloudResult = await sendViaWhatsAppCloud(adminPhone, message);
  if (cloudResult.sent) return cloudResult;

  const callMeBotResult = await sendViaCallMeBot(adminPhone, message, env.callMeBotWhatsappApiKey);
  if (callMeBotResult.sent) return callMeBotResult;

  return {
    sent: false,
    reason: callMeBotResult.reason || cloudResult.reason || "whatsapp_not_configured",
  };
}

module.exports = {
  notifyAdminNewBookingWhatsApp,
  buildAdminWhatsAppMessage,
};
