require("dotenv").config();
const mongoose = require("mongoose");
const env = require("../src/config/env");
const Settings = require("../src/models/Settings");

const NEW_NUMBER = "243830538687";

async function run() {
  await mongoose.connect(env.mongoUri);
  const doc = await Settings.findOne();
  if (!doc) {
    await Settings.create({ whatsappNumber: NEW_NUMBER });
    console.log(`Settings créés avec WhatsApp ${NEW_NUMBER}`);
  } else {
    const before = doc.whatsappNumber;
    doc.whatsappNumber = NEW_NUMBER;
    await doc.save();
    console.log(`WhatsApp mis à jour : ${before || "(vide)"} → ${NEW_NUMBER}`);
  }
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
