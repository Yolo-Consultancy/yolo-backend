require("dotenv").config();

const mailUser = (process.env.MAIL_USER || "").trim();
const mailPass = (process.env.MAIL_PASS || "").trim();
const mailHost = (process.env.MAIL_HOST || "").trim() || (mailUser ? "smtp.gmail.com" : "");

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 4000,
  corsOrigins: (process.env.CORS_ORIGIN || "http://localhost:4173,http://localhost:5173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/yolo",
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "change-me",
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES || "15m",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "change-me-too",
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES || "7d",
  adminBootstrapEmail: process.env.ADMIN_BOOTSTRAP_EMAIL || "admin@yolo.cd",
  adminBootstrapPassword: process.env.ADMIN_BOOTSTRAP_PASSWORD || "yolo2026",
  adminNotificationEmail: (process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_BOOTSTRAP_EMAIL || "").trim(),
  chauffeurPricePerDay: Number(process.env.CHAUFFEUR_PRICE_PER_DAY) || 80,
  mailFromName: (process.env.MAIL_FROM_NAME || "YOLO Le Concierge").trim(),
  mailFrom: (process.env.MAIL_FROM || "contact@yololeconcierge.com").trim(),
  mailHost,
  mailPort: Number(process.env.MAIL_PORT) || 587,
  mailSecure: process.env.MAIL_SECURE === "true",
  mailUser,
  mailPass,
  adminUrl: process.env.ADMIN_URL || "http://localhost:4173",
};

module.exports = env;
