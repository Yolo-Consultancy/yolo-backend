const ApiError = require("../../utils/ApiError");
const User = require("../../models/User");
const { toUser } = require("../../utils/serializers");
const { hashPassword } = require("../auth/auth.service");

async function listUsers() {
  const items = await User.find().sort({ createdAt: -1 });
  return items.map(toUser);
}

async function getUser(id) {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, "NOT_FOUND", "Utilisateur introuvable");
  return toUser(user);
}

async function upsertUser(body) {
  if (body.id) {
    const user = await User.findById(body.id);
    if (!user) throw new ApiError(404, "NOT_FOUND", "Utilisateur introuvable");
    user.name = body.name ?? user.name;
    user.email = (body.email ?? user.email).toLowerCase();
    user.role = body.role ?? user.role;
    user.active = body.active ?? user.active;
    if (body.password) user.passwordHash = await hashPassword(body.password);
    await user.save();
    return toUser(user);
  }

  if (!body.password) throw new ApiError(400, "VALIDATION_ERROR", "Mot de passe requis");
  const exists = await User.findOne({ email: body.email.toLowerCase() });
  if (exists) throw new ApiError(409, "CONFLICT", "Email déjà utilisé");

  const user = await User.create({
    name: body.name,
    email: body.email.toLowerCase(),
    role: body.role || "agent",
    active: body.active !== false,
    passwordHash: await hashPassword(body.password),
  });
  return toUser(user);
}

async function deleteUser(id) {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, "NOT_FOUND", "Utilisateur introuvable");
  user.active = false;
  await user.save();
  return { deleted: true };
}

module.exports = { listUsers, getUser, upsertUser, deleteUser };
