const mongoose = require("mongoose");

const analyticsEventSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    visitorId: { type: String, required: true, index: true },
    eventType: {
      type: String,
      enum: ["page_view", "heartbeat", "vehicle_view", "booking_start", "contact_click", "custom"],
      required: true,
      index: true,
    },
    path: { type: String, index: true },
    title: String,
    vehicleId: String,
    vehicleSlug: String,
    metadata: mongoose.Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

analyticsEventSchema.index({ eventType: 1, timestamp: -1 });
analyticsEventSchema.index({ path: 1, timestamp: -1 });
analyticsEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 400 });

module.exports = mongoose.model("AnalyticsEvent", analyticsEventSchema);
