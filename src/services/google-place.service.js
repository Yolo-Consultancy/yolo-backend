const env = require("../config/env");

function buildEmbedUrl(placeId, lat, lng) {
  if (env.googleMapsEmbedUrl) return env.googleMapsEmbedUrl;

  if (env.googleMapsApiKey && placeId) {
    return `https://www.google.com/maps/embed/v1/place?key=${env.googleMapsApiKey}&q=place_id:${placeId}`;
  }

  if (env.googleMapsApiKey && lat != null && lng != null) {
    return `https://www.google.com/maps/embed/v1/view?key=${env.googleMapsApiKey}&center=${lat},${lng}&zoom=14`;
  }

  const query = encodeURIComponent(env.googleMapsQuery || "Gombe, Kinshasa, RDC");
  return `https://maps.google.com/maps?q=${query}&z=14&output=embed`;
}

async function fetchGooglePlaceReviews() {
  const apiKey = env.googleMapsApiKey;
  const placeId = env.googlePlaceId;

  if (!apiKey || !placeId) return null;

  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "displayName",
        "formattedAddress",
        "rating",
        "userRatingCount",
        "googleMapsUri",
        "location",
        "reviews",
      ].join(","),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[google-place] Places API error:", res.status, body);
    return null;
  }

  const data = await res.json();
  const reviews = (data.reviews || [])
    .filter((r) => r.text?.text?.trim())
    .map((r, index) => ({
      id: `google-${index}-${r.publishTime || index}`,
      clientName: r.authorAttribution?.displayName || "Client Google",
      comment: r.text.text.trim(),
      score: r.rating || 5,
      submittedAt: r.publishTime || new Date().toISOString(),
      photoUri: r.authorAttribution?.photoUri || "",
      source: "google",
    }));

  const lat = data.location?.latitude;
  const lng = data.location?.longitude;

  return {
    source: "google",
    businessName: data.displayName?.text || env.googleBusinessName,
    address: data.formattedAddress || "",
    averageScore: data.rating || 0,
    totalCount: data.userRatingCount || reviews.length,
    reviews,
    mapsUri: data.googleMapsUri || env.googleMapsReviewsUrl,
    mapsEmbedUrl: buildEmbedUrl(placeId, lat, lng),
  };
}

module.exports = { fetchGooglePlaceReviews, buildEmbedUrl };
