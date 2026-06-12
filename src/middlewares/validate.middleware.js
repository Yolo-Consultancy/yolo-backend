const ApiError = require("../utils/ApiError");

function validate(schema, source = "body") {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(
        new ApiError(400, "VALIDATION_ERROR", "Données invalides", result.error.issues),
      );
    }
    req[source] = result.data;
    next();
  };
}

module.exports = { validate };
