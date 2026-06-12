const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    companyName: String,
    whatsappNumber: String,
    contactEmail: String,
    address: String,
    heroTitle: String,
    heroSubtitle: String,
    depositCurrency: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Settings", settingsSchema);
