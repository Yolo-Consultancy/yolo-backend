const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    civility: String,
    firstName: String,
    lastName: String,
    email: { type: String, lowercase: true },
    phone: String,
    countryCode: String,
    passwordHash: String,
    passwordResetTokenHash: String,
    passwordResetExpires: Date,
    portalScope: {
      type: String,
      enum: ["vehicules", "demenagement", "sur_mesure", "all"],
      default: "all",
    },
    notes: String,
    totalBookings: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Client", clientSchema);
