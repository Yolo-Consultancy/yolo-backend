require("dotenv").config();
const mongoose = require("mongoose");
const env = require("../src/config/env");
const User = require("../src/models/User");
const Vehicle = require("../src/models/Vehicle");
const Driver = require("../src/models/Driver");
const Settings = require("../src/models/Settings");
const { hashPassword } = require("../src/modules/auth/auth.service");
const seedVehicles = require("./vehicles.seed");

async function seed() {
  await mongoose.connect(env.mongoUri);
  console.log("Connexion MongoDB OK");

  const adminEmail = env.adminBootstrapEmail.toLowerCase();
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: "Admin YOLO",
      email: adminEmail,
      passwordHash: await hashPassword(env.adminBootstrapPassword),
      role: "admin",
      active: true,
    });
    console.log(`Admin créé : ${adminEmail}`);
  } else {
    console.log(`Admin existant : ${adminEmail}`);
  }

  for (const v of seedVehicles) {
    await Vehicle.findOneAndUpdate({ slug: v.slug }, v, { upsert: true, new: true });
  }
  console.log(`${seedVehicles.length} véhicules synchronisés`);

  const drivers = [
    { firstName: "Joseph", lastName: "Mbaya", email: "joseph.mbaya@yolo.cd", phone: "+243 81 555 1122", hiredAt: "2024-03-15", salary: 850, pricePerDay: 80, active: true, notes: "Chauffeur VIP" },
    { firstName: "Pascal", lastName: "Kalonji", email: "pascal.kalonji@yolo.cd", phone: "+243 99 222 3344", hiredAt: "2025-01-10", salary: 720, pricePerDay: 80, active: true, notes: "SUV et longues distances" },
    { firstName: "André", lastName: "Bwanga", email: "andre.bwanga@yolo.cd", phone: "+243 82 777 8899", hiredAt: "2023-06-01", salary: 950, pricePerDay: 80, active: true, notes: "Chauffeur protocole" },
  ];
  if ((await Driver.countDocuments()) === 0) {
    await Driver.insertMany(drivers);
    console.log(`${drivers.length} chauffeurs créés`);
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
