const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const pinoHttp = require("pino-http");
const env = require("./config/env");
const { notFound, errorHandler } = require("./middlewares/error.middleware");

const authRoutes = require("./modules/auth/auth.routes");
const vehiclesRoutes = require("./modules/vehicles/vehicles.routes");
const driversRoutes = require("./modules/drivers/drivers.routes");
const bookingsRoutes = require("./modules/bookings/bookings.routes");
const clientsRoutes = require("./modules/clients/clients.routes");
const usersRoutes = require("./modules/users/users.routes");
const missionsRoutes = require("./modules/missions/missions.routes");
const moversRoutes = require("./modules/movers/movers.routes");
const movingMissionsRoutes = require("./modules/moving-missions/moving-missions.routes");
const settingsRoutes = require("./modules/settings/settings.routes");
const contactRoutes = require("./modules/contact/contact.routes");
const statsRoutes = require("./modules/stats/stats.routes");
const notificationsRoutes = require("./modules/notifications/notifications.routes");
const paymentsRoutes = require("./modules/payments/payments.routes");
const supportRoutes = require("./modules/support/support.routes");
const tripReportsRoutes = require("./modules/trip-reports/trip-reports.routes");
const ratingsRoutes = require("./modules/ratings/ratings.routes");

const app = express();

app.use(pinoHttp());
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (env.corsOrigins.includes(origin)) return callback(null, true);
      if (env.nodeEnv === "development" && /^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "15mb" }));
app.use(cookieParser());
// Express 5 : req.query est en lecture seule — on ne sanitize que body/params
app.use((req, _res, next) => {
  if (req.body) req.body = mongoSanitize.sanitize(req.body);
  if (req.params) req.params = mongoSanitize.sanitize(req.params);
  next();
});

app.get("/", (_req, res) => {
  res.json({ success: true, data: { message: "YOLO Backend API", version: "v1" } });
});

app.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

const v1 = express.Router();
v1.use("/auth", authRoutes);
v1.use("/vehicles", vehiclesRoutes);
v1.use("/drivers", driversRoutes);
v1.use("/bookings", bookingsRoutes);
v1.use("/clients", clientsRoutes);
v1.use("/users", usersRoutes);
v1.use("/missions", missionsRoutes);
v1.use("/movers", moversRoutes);
v1.use("/moving-missions", movingMissionsRoutes);
v1.use("/trip-reports", tripReportsRoutes);
v1.use("/ratings", ratingsRoutes);
v1.use("/settings", settingsRoutes);
v1.use("/contact", contactRoutes);
v1.use("/stats", statsRoutes);

app.use("/api/v1", v1);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/v1/support", supportRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
