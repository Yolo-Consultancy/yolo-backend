const AnalyticsSession = require("../../models/AnalyticsSession");
const AnalyticsEvent = require("../../models/AnalyticsEvent");
const {
  startOfDay,
  resolvePeriod,
  previousPeriod,
  changePercent,
  formatDuration,
  dateMatch,
} = require("./analytics.helpers");

async function uniqueVisitors(from, to) {
  const result = await AnalyticsSession.aggregate([
    { $match: { startedAt: dateMatch(from, to) } },
    { $group: { _id: "$visitorId" } },
    { $count: "total" },
  ]);
  return result[0]?.total || 0;
}

async function sessionStats(from, to) {
  const sessions = await AnalyticsSession.find({ startedAt: dateMatch(from, to) }).lean();
  const total = sessions.length;
  if (total === 0) {
    return { sessions: 0, bounceRate: 0, avgDurationSec: 0, avgDurationLabel: "0 min" };
  }

  const bounces = sessions.filter((s) => s.pageViews <= 1).length;
  const totalDuration = sessions.reduce((sum, s) => {
    const start = new Date(s.startedAt).getTime();
    const end = new Date(s.lastSeenAt).getTime();
    return sum + Math.max(0, (end - start) / 1000);
  }, 0);

  const avgDurationSec = Math.round(totalDuration / total);
  return {
    sessions: total,
    bounceRate: Math.round((bounces / total) * 1000) / 10,
    avgDurationSec,
    avgDurationLabel: formatDuration(avgDurationSec),
  };
}

async function pageViews(from, to) {
  return AnalyticsEvent.countDocuments({
    eventType: "page_view",
    timestamp: dateMatch(from, to),
  });
}

async function periodMetrics(from, to) {
  const [unique, views, sessionData] = await Promise.all([
    uniqueVisitors(from, to),
    pageViews(from, to),
    sessionStats(from, to),
  ]);

  return {
    uniqueVisitors: unique,
    pageViews: views,
    sessions: sessionData.sessions,
    bounceRate: sessionData.bounceRate,
    avgDurationSec: sessionData.avgDurationSec,
    avgDurationLabel: sessionData.avgDurationLabel,
  };
}

async function getOverview(query) {
  const { from, to, preset } = resolvePeriod(query);
  const prev = previousPeriod(from, to);

  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfDay(now);
  weekStart.setDate(weekStart.getDate() - 6);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [visitorsToday, visitorsWeek, visitorsMonth, current, previous] = await Promise.all([
    uniqueVisitors(todayStart, now),
    uniqueVisitors(weekStart, now),
    uniqueVisitors(monthStart, now),
    periodMetrics(from, to),
    periodMetrics(prev.from, prev.to),
  ]);

  return {
    preset,
    from: from.toISOString(),
    to: to.toISOString(),
    visitorsToday,
    visitorsWeek,
    visitorsMonth,
    uniqueVisitors: current.uniqueVisitors,
    pageViews: current.pageViews,
    sessions: current.sessions,
    bounceRate: current.bounceRate,
    avgDurationSec: current.avgDurationSec,
    avgDurationLabel: current.avgDurationLabel,
    comparison: {
      uniqueVisitors: changePercent(current.uniqueVisitors, previous.uniqueVisitors),
      pageViews: changePercent(current.pageViews, previous.pageViews),
      sessions: changePercent(current.sessions, previous.sessions),
      bounceRate: changePercent(current.bounceRate, previous.bounceRate),
    },
  };
}

async function getTraffic(query) {
  const { from, to, preset } = resolvePeriod(query);
  const metric = query.metric || "visitors";
  const rangeMs = to.getTime() - from.getTime();
  const groupByHour = rangeMs <= 48 * 60 * 60 * 1000;
  const dateFormat = groupByHour ? "%Y-%m-%d %H:00" : "%Y-%m-%d";

  if (metric === "pageViews") {
    const series = await AnalyticsEvent.aggregate([
      { $match: { eventType: "page_view", timestamp: dateMatch(from, to) } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$timestamp" } },
          value: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return { preset, from: from.toISOString(), to: to.toISOString(), metric, series: series.map((s) => ({ date: s._id, value: s.value })) };
  }

  if (metric === "sessions") {
    const series = await AnalyticsSession.aggregate([
      { $match: { startedAt: dateMatch(from, to) } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$startedAt" } },
          value: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return { preset, from: from.toISOString(), to: to.toISOString(), metric, series: series.map((s) => ({ date: s._id, value: s.value })) };
  }

  const series = await AnalyticsSession.aggregate([
    { $match: { startedAt: dateMatch(from, to) } },
    {
      $group: {
        _id: {
          bucket: { $dateToString: { format: dateFormat, date: "$startedAt" } },
          visitorId: "$visitorId",
        },
      },
    },
    {
      $group: {
        _id: "$_id.bucket",
        value: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return {
    preset,
    from: from.toISOString(),
    to: to.toISOString(),
    metric: metric === "uniqueVisitors" ? "uniqueVisitors" : "visitors",
    series: series.map((s) => ({ date: s._id, value: s.value })),
  };
}

function pathLabel(path) {
  if (!path || path === "/") return "Accueil";
  if (path.startsWith("/location-vehicules/")) return path.replace("/location-vehicules/", "Véhicule · ");
  if (path === "/location-vehicules") return "Location de véhicules";
  if (path === "/demenagement") return "Déménagement";
  if (path === "/services-sur-mesure") return "Services sur mesure";
  if (path === "/contact") return "Contact";
  if (path === "/connexion") return "Connexion";
  return path;
}

async function getPages(query) {
  const { from, to, preset } = resolvePeriod(query);
  const limit = Math.min(Number(query.limit) || 10, 100);

  const pages = await AnalyticsEvent.aggregate([
    { $match: { eventType: "page_view", timestamp: dateMatch(from, to), path: { $exists: true, $ne: "" } } },
    {
      $group: {
        _id: "$path",
        views: { $sum: 1 },
        visitors: { $addToSet: "$visitorId" },
      },
    },
    {
      $project: {
        path: "$_id",
        views: 1,
        visitors: { $size: "$visitors" },
      },
    },
    { $sort: { views: -1 } },
    { $limit: limit },
  ]);

  return {
    preset,
    from: from.toISOString(),
    to: to.toISOString(),
    pages: pages.map((p) => ({
      path: p.path,
      label: pathLabel(p.path),
      views: p.views,
      visitors: p.visitors,
    })),
  };
}

module.exports = { getOverview, getTraffic, getPages };
