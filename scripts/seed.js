require("dotenv").config();
const mongoose = require("mongoose");
const env = require("../src/config/env");
const User = require("../src/models/User");
const Vehicle = require("../src/models/Vehicle");
const Driver = require("../src/models/Driver");
const Settings = require("../src/models/Settings");
const { hashPassword } = require("../src/modules/auth/auth.service");
const seedVehicles = require("./vehicles.seed");

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

  user.name = name;
  user.role = "admin";
  user.portalScope = portalScope;
  user.active = true;
  user.passwordHash = passwordHash;
  await user.save();
  console.log(`Admin ${portalScope} mis à jour : ${normalized} / ${password}`);
  return user;
}

async function seed() {
  await mongoose.connect(env.mongoUri);
  console.log("Connexion MongoDB OK");

  const adminPassword = env.adminBootstrapPassword;
  const adminEmail = env.adminBootstrapEmail.toLowerCase();

  await ensurePortalAdmin({
    email: adminEmail,
    name: "Admin Location YOLO",
    portalScope: "vehicules",
    password: adminPassword,
  });

  await ensurePortalAdmin({
    email: process.env.ADMIN_DEMENAGEMENT_EMAIL || "admin.demenagement@yolo.cd",
    name: "Admin Déménagement YOLO",
    portalScope: "demenagement",
    password: process.env.ADMIN_DEMENAGEMENT_PASSWORD || adminPassword,
  });

  await ensurePortalAdmin({
    email: process.env.ADMIN_SURMESURE_EMAIL || "admin.surmesure@yolo.cd",
    name: "Admin Sur Mesure YOLO",
    portalScope: "sur_mesure",
    password: process.env.ADMIN_SURMESURE_PASSWORD || adminPassword,
  });

  for (const v of seedVehicles) {
    await Vehicle.findOneAndUpdate({ slug: v.slug }, v, { upsert: true, new: true });
  }
  console.log(`${seedVehicles.length} véhicules synchronisés`);

  const driverPasswordHash = await hashPassword(env.adminBootstrapPassword);
  const drivers = [
    { firstName: "Joseph", lastName: "Mbaya", email: "joseph.mbaya@yolo.cd", phone: "+243 81 555 1122", hiredAt: "2024-03-15", salary: 850, pricePerDay: 80, active: true, notes: "Chauffeur VIP", passwordHash: driverPasswordHash },
    { firstName: "Pascal", lastName: "Kalonji", email: "pascal.kalonji@yolo.cd", phone: "+243 99 222 3344", hiredAt: "2025-01-10", salary: 720, pricePerDay: 80, active: true, notes: "SUV et longues distances", passwordHash: driverPasswordHash },
    { firstName: "André", lastName: "Bwanga", email: "andre.bwanga@yolo.cd", phone: "+243 82 777 8899", hiredAt: "2023-06-01", salary: 950, pricePerDay: 80, active: true, notes: "Chauffeur protocole", passwordHash: driverPasswordHash },
  ];
  if ((await Driver.countDocuments()) === 0) {
    await Driver.insertMany(drivers);
    console.log(`${drivers.length} chauffeurs créés (mot de passe : ${env.adminBootstrapPassword})`);
  } else {
    const updated = await Driver.updateMany(
      { passwordHash: { $exists: false } },
      { $set: { passwordHash: driverPasswordHash } },
    );
    if (updated.modifiedCount > 0) {
      console.log(`${updated.modifiedCount} chauffeur(s) — mot de passe initial défini (${env.adminBootstrapPassword})`);
    }
  }

  if (!(await Settings.findOne())) {
    await Settings.create({
      companyName: "YOLO Le Concierge",
      whatsappNumber: "243828863897",
      contactEmail: "contact@yololeconcierge.com",
      address: "Kinshasa, République Démocratique du Congo",
      heroTitle: "Une seule plateforme, tous vos services.",
      heroSubtitle: "Conciergerie premium 24/7 — Mobilité, Logistique, Sur Mesure.",
      depositCurrency: "FCFA",
    });
    console.log("Settings initialisés");
  }

  console.log("Seed terminé.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
