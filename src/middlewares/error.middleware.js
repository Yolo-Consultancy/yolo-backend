const ApiError = require("../utils/ApiError");

function notFound(req, res, next) {
  next(new ApiError(404, "NOT_FOUND", `Route ${req.method} ${req.originalUrl} introuvable`));
}

function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || "INTERNAL_ERROR";
  const message = err.message || "Erreur interne du serveur";

  if (statusCode >= 500) {
    req.log?.error({ err }, message);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details: err.details,
    },
  });
}

module.exports = { notFound, errorHandler };
