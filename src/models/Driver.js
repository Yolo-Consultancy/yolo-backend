const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    photo: String,
    pricePerDay: { type: Number, default: 80 },
    salary: { type: Number, default: 0 },
    hiredAt: String,
    availability: {
      type: String,
      enum: ["disponible", "occupe", "indisponible"],
      default: "disponible",
    },
    active: { type: Boolean, default: true },
    experienceYears: Number,
    languages: String,
    city: String,
    notes: String,
    passwordHash: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Driver", driverSchema);
