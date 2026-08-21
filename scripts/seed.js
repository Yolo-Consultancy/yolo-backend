require("dotenv").config();
const mongoose = require("mongoose");
const env = require("../src/config/env");
const User = require("../src/models/User");
const { hashPassword } = require("../src/modules/auth/auth.service");
const portalAdmins = require("./admins.seed");

const resetPasswordsOnly = process.argv.includes("--reset-passwords");

async function ensurePortalAdmin({ email, name, portalScope, password }) {
  const normalized = email.toLowerCase();
  const passwordHash = await hashPassword(password);
  let user = await User.findOne({ email: normalized });

  if (!user) {
    user = await User.create({
      name,
      email: normalized,
      passwordHash,
      role: "admin",
      portalScope,
      active: true,
    });
    console.log(`Admin ${portalScope} créé : ${normalized} / ${password}`);
    return user;
  }

  user.passwordHash = passwordHash;
  user.refreshTokenHash = undefined;

  if (!resetPasswordsOnly) {
    user.name = name;
    user.role = "admin";
    user.portalScope = portalScope;
    user.active = true;
  }

  await user.save();

  if (resetPasswordsOnly) {
    console.log(`Mot de passe réinitialisé : ${normalized} / ${password}`);
  } else {
    console.log(`Admin ${portalScope} mis à jour : ${normalized} / ${password}`);
  }

  return user;
}

async function seed() {
  await mongoose.connect(env.mongoUri);
  console.log("Connexion MongoDB OK");

  if (resetPasswordsOnly) {
    console.log("Mode réinitialisation des mots de passe admin…");
  } else {
    console.log("Seed admins portails uniquement (sans véhicules ni chauffeurs)…");
  }

  for (const admin of portalAdmins) {
    await ensurePortalAdmin(admin);
  }

  console.log(resetPasswordsOnly ? "Mots de passe admin réinitialisés." : "Seed terminé.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
