const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const ApiError = require("../../utils/ApiError");
const env = require("../../config/env");
const Driver = require("../../models/Driver");
const { hashPassword } = require("./auth.service");

function signDriverToken(driver) {
  return jwt.sign(
    { sub: String(driver._id), type: "driver" },
    env.jwtAccessSecret,
    { expiresIn: "7d" },
  );
}

function toDriverAccount(doc) {
  return {
    id: String(doc._id),
    firstName: doc.firstName,
    lastName: doc.lastName,
    email: doc.email || "",
    phone: doc.phone || "",
    photo: doc.photo || "",
    availability: doc.availability || "disponible",
    active: doc.active !== false,
  };
}

async function loginDriver(email, password) {
  const driver = await Driver.findOne({ email: email.trim().toLowerCase(), active: true });
  if (!driver?.passwordHash) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Aucun compte chauffeur trouvé avec cet e-mail");
  }

  const valid = await bcrypt.compare(password, driver.passwordHash);
  if (!valid) throw new ApiError(401, "INVALID_CREDENTIALS", "Mot de passe incorrect");

  const account = toDriverAccount(driver);
  return { accessToken: signDriverToken(driver), account };
}

async function getDriverMe(driverId) {
  const driver = await Driver.findById(driverId).select("-passwordHash");
  if (!driver || !driver.active) throw new ApiError(404, "NOT_FOUND", "Chauffeur introuvable");
  return toDriverAccount(driver);
}

async function setDriverPassword(driverId, password) {
  if (!password || password.length < 6) {
    throw new ApiError(400, "VALIDATION_ERROR", "Mot de passe trop court (min. 6 caractères)");
  }
  const driver = await Driver.findById(driverId);
  if (!driver) throw new ApiError(404, "NOT_FOUND", "Chauffeur introuvable");
  driver.passwordHash = await hashPassword(password);
  await driver.save();
  return { ok: true };
}

module.exports = { loginDriver, getDriverMe, toDriverAccount, setDriverPassword };
