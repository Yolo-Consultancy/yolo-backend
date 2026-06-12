const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: { type: String, lowercase: true },
    phone: String,
    countryCode: String,
    passwordHash: String,
    notes: String,
    totalBookings: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Client", clientSchema);
