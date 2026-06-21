const ApiError = require("../../utils/ApiError");
const TripReport = require("../../models/TripReport");
const Rating = require("../../models/Rating");
const { fetchGooglePlaceReviews } = require("../../services/google-place.service");
const env = require("../../config/env");

function clampScore(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 1 || v > 5) return null;
  return Math.round(v);
}

async function getRatingForm(token) {
  if (!token || token.length < 16) {
    throw new ApiError(400, "INVALID_TOKEN", "Lien invalide");
  }

  const report = await TripReport.findOne({ ratingToken: token });
  if (!report) throw new ApiError(404, "NOT_FOUND", "Lien expiré ou invalide");

  const existing = await Rating.findOne({ token });
  if (existing) {
    return {
      alreadySubmitted: true,
      clientName: report.clientName,
      driverName: report.driverName,
      vehicleName: report.vehicleName,
    };
  }

  const expiresAt = new Date(report.submittedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  if (Date.now() > expiresAt.getTime()) {
    throw new ApiError(410, "EXPIRED", "Ce lien a expiré");
  }

  return {
    alreadySubmitted: false,
    clientName: report.clientName,
    driverName: report.driverName,
    vehicleName: report.vehicleName,
  };
}

async function submitRating(token, body) {
  if (!token || token.length < 16) {
    throw new ApiError(400, "INVALID_TOKEN", "Lien invalide");
  }

  const serviceScore = clampScore(body.serviceScore);
  const driverScore = clampScore(body.driverScore);
  if (!serviceScore || !driverScore) {
    throw new ApiError(400, "VALIDATION_ERROR", "Les notes doivent être entre 1 et 5");
  }

  const report = await TripReport.findOne({ ratingToken: token });
  if (!report) throw new ApiError(404, "NOT_FOUND", "Lien expiré ou invalide");

  const existing = await Rating.findOne({ token });
  if (existing) throw new ApiError(409, "CONFLICT", "Vous avez déjà noté cette course");

  const expiresAt = new Date(report.submittedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  if (Date.now() > expiresAt.getTime()) {
    throw new ApiError(410, "EXPIRED", "Ce lien a expiré");
  }

  const rating = await Rating.create({
    tripReport: report._id,
    mission: report.mission,
    booking: report.booking,
    driver: report.driver,
    clientName: report.clientName,
    clientEmail: report.clientEmail,
    driverName: report.driverName,
    serviceScore,
    driverScore,
    comment: body.comment?.trim() || "",
    token,
  });

  return {
    id: String(rating._id),
    serviceScore,
    driverScore,
    submittedAt: rating.submittedAt.toISOString(),
  };
}

async function listRatings() {
  const items = await Rating.find().sort({ submittedAt: -1 }).limit(200);
  return items.map((r) => ({
    id: String(r._id),
    clientName: r.clientName || "",
    driverName: r.driverName || "",
    serviceScore: r.serviceScore,
    driverScore: r.driverScore,
    comment: r.comment || "",
    submittedAt: r.submittedAt ? r.submittedAt.toISOString() : "",
  }));
}

function buildPublicReviewText(r) {
  const comment = r.comment?.trim();
  if (comment) return comment;

  const avg = (r.serviceScore + r.driverScore) / 2;
  if (avg >= 4.5) {
    return "Expérience premium irréprochable. Je recommande vivement YOLO Le Concierge.";
  }
  if (avg >= 4) {
    return "Très belle expérience de location. Service professionnel et véhicule impeccable.";
  }
  if (avg >= 3) {
    return "Bonne expérience de location avec YOLO Le Concierge.";
  }
  return "Merci d'avoir partagé votre retour après votre location.";
}

function mapInternalReview(r) {
  const avgScore = Math.round(((r.serviceScore + r.driverScore) / 2) * 10) / 10;
  return {
    id: String(r._id),
    clientName: r.clientName || "Client YOLO",
    comment: buildPublicReviewText(r),
    score: avgScore,
    submittedAt: r.submittedAt ? r.submittedAt.toISOString() : new Date().toISOString(),
    photoUri: "",
    source: "internal",
  };
}

async function listInternalPublicReviews() {
  const items = await Rating.find().sort({ submittedAt: -1 }).limit(200);

  const scores = items.flatMap((r) => [r.serviceScore, r.driverScore]);
  const averageScore = scores.length
    ? Math.round((scores.reduce((sum, n) => sum + n, 0) / scores.length) * 10) / 10
    : 0;

  return {
    averageScore,
    totalCount: items.length,
    reviews: items.map(mapInternalReview),
  };
}

function mergeReviews(internalReviews, googleReviews) {
  const seen = new Set(internalReviews.map((r) => r.id));
  const merged = [...internalReviews];
  for (const review of googleReviews) {
    if (!seen.has(review.id)) merged.push(review);
  }
  return merged.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

const MIN_PUBLIC_REVIEW_SCORE = 3;

function filterPublicReviews(reviews) {
  return reviews.filter((r) => Number(r.score) >= MIN_PUBLIC_REVIEW_SCORE);
}

async function listPublicRatings() {
  const internal = await listInternalPublicReviews();

  const google = await fetchGooglePlaceReviews().catch((err) => {
    console.error("[ratings] Google fetch failed:", err.message);
    return null;
  });

  const reviews = filterPublicReviews(mergeReviews(internal.reviews, google?.reviews || []));

  const averageScore =
    reviews.length > 0
      ? Math.round(
          (reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length) * 10,
        ) / 10
      : google?.averageScore || internal.averageScore || 0;

  const totalCount = reviews.length;

  return {
    source: google?.reviews?.length ? (internal.reviews.length ? "mixed" : "google") : "internal",
    businessName: google?.businessName || env.googleBusinessName,
    averageScore,
    totalCount,
    reviews,
    mapsUri: google?.mapsUri || env.googleMapsReviewsUrl || "https://www.google.com/maps",
  };
}

module.exports = { getRatingForm, submitRating, listRatings, listPublicRatings };
