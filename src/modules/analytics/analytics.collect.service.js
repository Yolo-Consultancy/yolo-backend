const AnalyticsSession = require("../../models/AnalyticsSession");
const AnalyticsEvent = require("../../models/AnalyticsEvent");
const { classifySource } = require("./analytics.helpers");

const ALLOWED_EVENTS = new Set([
  "page_view",
  "heartbeat",
  "vehicle_view",
  "booking_start",
  "contact_click",
  "custom",
]);

function sanitizeString(value, max = 500) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

async function collect(body, req) {
  const sessionId = sanitizeString(body.sessionId, 64);
  const visitorId = sanitizeString(body.visitorId, 64);
  const eventType = sanitizeString(body.eventType, 32);

  if (!sessionId || !visitorId || !ALLOWED_EVENTS.has(eventType)) {
    return { ok: false, reason: "invalid_payload" };
  }

  const path = sanitizeString(body.path, 300);
  const referrer = sanitizeString(body.referrer, 500);
  const utmSource = sanitizeString(body.utmSource, 120);
  const utmMedium = sanitizeString(body.utmMedium, 120);
  const utmCampaign = sanitizeString(body.utmCampaign, 120);
  const source = classifySource(referrer, utmSource);
  const country = sanitizeString(req.headers["cf-ipcountry"] || body.country, 8).toUpperCase() || undefined;

  const now = new Date();
  let session = await AnalyticsSession.findOne({ sessionId });

  if (!session) {
    session = await AnalyticsSession.create({
      sessionId,
      visitorId,
      isNewVisitor: Boolean(body.isNewVisitor),
      deviceType: ["mobile", "tablet", "desktop"].includes(body.deviceType) ? body.deviceType : "unknown",
      browser: sanitizeString(body.browser, 80),
      os: sanitizeString(body.os, 80),
      country,
      city: sanitizeString(body.city, 80) || undefined,
      entryPath: path || "/",
      lastPath: path || "/",
      referrer: referrer || "direct",
      source,
      utmSource: utmSource || undefined,
      utmMedium: utmMedium || undefined,
      utmCampaign: utmCampaign || undefined,
      pageViews: eventType === "page_view" ? 1 : 0,
      events: 1,
      startedAt: now,
      lastSeenAt: now,
    });
  } else {
    session.lastSeenAt = now;
    session.events += 1;
    if (path) session.lastPath = path;
    if (eventType === "page_view") session.pageViews += 1;
    if (country && !session.country) session.country = country;
    await session.save();
  }

  await AnalyticsEvent.create({
    sessionId,
    visitorId,
    eventType,
    path: path || session.lastPath,
    title: sanitizeString(body.title, 200) || undefined,
    vehicleId: sanitizeString(body.vehicleId, 80) || undefined,
    vehicleSlug: sanitizeString(body.vehicleSlug, 120) || undefined,
    metadata: typeof body.metadata === "object" && body.metadata ? body.metadata : undefined,
    timestamp: now,
  });

  if (eventType === "page_view" && path) {
    await AnalyticsSession.updateOne({ sessionId }, { $set: { exitPath: path } });
  }

  return { ok: true };
}

module.exports = { collect };
