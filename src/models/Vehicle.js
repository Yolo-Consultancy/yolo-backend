const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    slug: { type: String, unique: true, required: true },
    name: String,
    brand: String,
    year: Number,
    category: String,
    location: String,
    pricePerDay: Number,
    image: String,
    gallery: [String],
    specs: {
      hp: Number,
      seats: Number,
      transmission: String,
      fuel: String,
    },
    description: String,
    conditions: {
      deposit: String,
      minAge: String,
      licenseYears: String,
      dailyKm: String,
    },
    keyStats: {
      power: String,
      zeroTo100: String,
      topSpeed: String,
      fuel: String,
    },
    performance: {
      hp: String,
      torque: String,
      zeroTo100: String,
      topSpeed: String,
    },
    drivetrain: {
      fuel: String,
      transmission: String,
      gearbox: String,
    },
    equipment: {
      seats: String,
      wheels: String,
      brakes: String,
      suspension: String,
      exterior: String,
      interior: String,
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
