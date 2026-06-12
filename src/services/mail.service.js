const nodemailer = require("nodemailer");
const env = require("../config/env");

let transport = null;
let devTransportPromise = null;

function hasSmtpConfig() {
  return !!(env.mailHost && env.mailUser && env.mailPass);
}

function getTransport() {
  if (transport !== null) return transport;
  if (!hasSmtpConfig()) {
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

async function getDevTransport() {
  if (!devTransportPromise) {
    devTransportPromise = (async () => {
      const testAccount = await nodemailer.createTestAccount();
      console.log("[YOLO mail dev] Boîte de test Ethereal :", testAccount.user);
      return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
    })();
  }
  return devTransportPromise;
}

async function sendMail({ to, subject, html, text }) {
  if (!to?.trim()) {
    return { sent: false, reason: "no_recipient" };
  }

  const fromAddress = env.mailFromName
    ? `"${env.mailFromName}" <${env.mailFrom}>`
    : env.mailFrom;

  const payload = {
    from: fromAddress,
    to: to.trim(),
    subject: subject || "YOLO Le Concierge",
    html: html || "",
    text: text || undefined,
  };

  let tx = getTransport();

  if (!tx && env.nodeEnv === "development") {
    tx = await getDevTransport();
  }

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
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log("[YOLO mail envoyé]", {
      to: payload.to,
      subject: payload.subject,
      messageId: info.messageId,
      ...(previewUrl ? { previewUrl } : {}),
    });
    return { sent: true, messageId: info.messageId, previewUrl: previewUrl || undefined };
  } catch (err) {
    console.error("[YOLO mail erreur]", err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendMail, hasSmtpConfig };
