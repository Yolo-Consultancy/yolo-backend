require("dotenv").config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 4000,
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/yolo",
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "change-me",
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES || "15m",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "change-me-too",
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES || "7d",
  adminBootstrapEmail: process.env.ADMIN_BOOTSTRAP_EMAIL || "admin@yolo.cd",
  adminBootstrapPassword: process.env.ADMIN_BOOTSTRAP_PASSWORD || "yolo2026",
  chauffeurPricePerDay: Number(process.env.CHAUFFEUR_PRICE_PER_DAY) || 80,
  mailFrom: process.env.MAIL_FROM || "noreply@yolo.cd",
  adminUrl: process.env.ADMIN_URL || "http://localhost:5173",
};

module.exports = env;
