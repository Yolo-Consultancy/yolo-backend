/** ObjectId MongoDB 24 caractères hex — évite les faux positifs de ObjectId.isValid(). */
function isMongoId(value) {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
}

function toMongoId(value) {
  return isMongoId(value) ? value : undefined;
}

module.exports = { isMongoId, toMongoId };
