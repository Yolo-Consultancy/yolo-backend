const jwt = require("jsonwebtoken");
const ApiError = require("../../utils/ApiError");
const env = require("../../config/env");
const Client = require("../../models/Client");
const { hashPassword } = require("./auth.service");

function signClientToken(client) {
  return jwt.sign(
    { sub: String(client._id), type: "client" },
    env.jwtAccessSecret,
    { expiresIn: "7d" },
  );
}

function toClientAccount(doc) {
  return {
    id: String(doc._id),
    firstName: doc.firstName,
    lastName: doc.lastName,
    email: doc.email,
    phone: doc.phone || "",
    countryCode: doc.countryCode || "+243",
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
  };
}

async function registerClient(data) {
  const email = data.email.trim().toLowerCase();
  if (!email || !data.firstName?.trim() || !data.lastName?.trim()) {
    throw new ApiError(400, "VALIDATION_ERROR", "Champs obligatoires manquants");
  }
  if (!data.password || data.password.length < 6) {
    throw new ApiError(400, "VALIDATION_ERROR", "Mot de passe trop court (min. 6 caractères)");
  }

  const exists = await Client.findOne({ email });
  if (exists) throw new ApiError(409, "CONFLICT", "Un compte existe déjà avec cet e-mail");

  const client = await Client.create({
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    email,
    phone: data.phone?.trim() || "",
    countryCode: data.countryCode || "+243",
    passwordHash: await hashPassword(data.password),
  });

  const account = toClientAccount(client);
  return { accessToken: signClientToken(client), account };
}

async function loginClient(email, password) {
  const client = await Client.findOne({ email: email.trim().toLowerCase() });
  if (!client?.passwordHash) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Aucun compte trouvé avec cet e-mail");
  }

  const bcrypt = require("bcrypt");
  const valid = await bcrypt.compare(password, client.passwordHash);
  if (!valid) throw new ApiError(401, "INVALID_CREDENTIALS", "Mot de passe incorrect");

  const account = toClientAccount(client);
  return { accessToken: signClientToken(client), account };
}

async function getClientMe(clientId) {
  const client = await Client.findById(clientId).select("-passwordHash");
  if (!client) throw new ApiError(404, "NOT_FOUND", "Client introuvable");
  return toClientAccount(client);
}

module.exports = { registerClient, loginClient, getClientMe, toClientAccount };
