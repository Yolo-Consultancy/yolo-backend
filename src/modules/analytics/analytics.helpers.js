function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function resolvePeriod(query = {}) {
  const now = new Date();
  const preset = query.preset || "7d";

  if (query.from && query.to) {
    return {
      preset: "custom",
      from: new Date(query.from),
      to: endOfDay(new Date(query.to)),
    };
  }

  let from;
  let to = now;

  switch (preset) {
    case "today":
      from = startOfDay(now);
      break;
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      from = startOfDay(y);
      to = endOfDay(y);
      break;
    }
    case "7d":
      from = startOfDay(now);
      from.setDate(from.getDate() - 6);
      break;
    case "30d":
      from = startOfDay(now);
      from.setDate(from.getDate() - 29);
      break;
    case "90d":
      from = startOfDay(now);
      from.setDate(from.getDate() - 89);
      break;
    case "180d":
      from = startOfDay(now);
      from.setDate(from.getDate() - 179);
      break;
    case "year":
      from = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      from = startOfDay(now);
      from.setDate(from.getDate() - 6);
  }

  return { preset, from, to };
}

function previousPeriod(from, to) {
  const duration = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - duration);
  return { from: prevFrom, to: prevTo };
}

function classifySource(referrer, utmSource) {
  const utm = (utmSource || "").toLowerCase();
  if (utm) {
    if (utm.includes("google")) return "Google";
    if (utm.includes("facebook") || utm.includes("fb")) return "Facebook";
    if (utm.includes("instagram")) return "Instagram";
    if (utm.includes("whatsapp")) return "WhatsApp";
    if (utm.includes("tiktok")) return "TikTok";
    if (utm.includes("linkedin")) return "LinkedIn";
    return "Référencement";
  }

  if (!referrer || referrer === "direct") return "Direct";

  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host.includes("google.")) return "Google";
    if (host.includes("facebook.") || host.includes("fb.")) return "Facebook";
    if (host.includes("instagram.")) return "Instagram";
    if (host.includes("whatsapp.")) return "WhatsApp";
    if (host.includes("tiktok.")) return "TikTok";
    if (host.includes("linkedin.")) return "LinkedIn";
    if (host.includes("bing.") || host.includes("yahoo.")) return "Référencement";
    return "Autres sites";
  } catch {
    return "Direct";
  }
}

function changePercent(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return "0 min";
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins === 0) return `${secs} s`;
  if (secs === 0) return `${mins} min`;
  return `${mins} min ${secs} s`;
}

function dateMatch(from, to) {
  return { $gte: from, $lte: to };
}

module.exports = {
  startOfDay,
  endOfDay,
  resolvePeriod,
  previousPeriod,
  classifySource,
  changePercent,
  formatDuration,
  dateMatch,
};
