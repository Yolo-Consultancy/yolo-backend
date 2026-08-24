const mongoose = require("mongoose");

const analyticsSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    visitorId: { type: String, required: true, index: true },
    isNewVisitor: { type: Boolean, default: true },
    deviceType: { type: String, enum: ["mobile", "tablet", "desktop", "unknown"], default: "unknown" },
    browser: String,
    os: String,
    country: String,
    city: String,
    entryPath: String,
    lastPath: String,
    exitPath: String,
    referrer: String,
    source: { type: String, default: "direct" },
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    pageViews: { type: Number, default: 0 },
    events: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now, index: true },
    lastSeenAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

analyticsSessionSchema.index({ startedAt: -1 });
analyticsSessionSchema.index({ lastSeenAt: -1 });
analyticsSessionSchema.index({ visitorId: 1, startedAt: -1 });

module.exports = mongoose.model("AnalyticsSession", analyticsSessionSchema);
