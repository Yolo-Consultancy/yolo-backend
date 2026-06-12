const nodemailer = require("nodemailer");
const env = require("../config/env");

let transport = null;

function getTransport() {
  if (transport !== null) return transport;
  if (!env.mailHost || !env.mailUser || !env.mailPass) {
    transport = false;
    return transport;
  }
  transport = nodemailer.createTransport({
    host: env.mailHost,
    port: env.mailPort,
    secure: env.mailSecure,
    auth: { user: env.mailUser, pass: env.mailPass },
  });
  return transport;
}

async function sendMail({ to, subject, html, text }) {
  if (!to?.trim()) {
    return { sent: false, reason: "no_recipient" };
  }

  const tx = getTransport();
  const payload = {
    from: env.mailFrom,
    to: to.trim(),
    subject: subject || "YOLO Le Concierge",
    html: html || "",
    text: text || undefined,
  };

  if (!tx) {
    console.log("[YOLO mail — SMTP non configuré]", {
      to: payload.to,
      subject: payload.subject,
      preview: payload.html?.slice(0, 160),
    });
    return { sent: false, reason: "smtp_not_configured", logged: true };
  }

  try {
    const info = await tx.sendMail(payload);
    console.log("[YOLO mail envoyé]", { to: payload.to, subject: payload.subject, messageId: info.messageId });
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error("[YOLO mail erreur]", err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendMail };
