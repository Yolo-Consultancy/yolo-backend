const mongoose = require("mongoose");

const contactMessageSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    phone: String,
    subject: String,
    message: String,
    serviceType: {
      type: String,
      enum: ["vehicules", "demenagement", "sur_mesure", "general"],
      default: "general",
    },
    status: {
      type: String,
      enum: ["nouveau", "en_cours", "traite", "annule"],
      default: "nouveau",
    },
    handled: { type: Boolean, default: false },
    quoteData: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ContactMessage", contactMessageSchema);
