const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    vehicleSlug: String,
    vehicleName: String,
    client: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
    clientName: String,
    clientPhone: String,
    clientEmail: String,
    startDate: Date,
    endDate: Date,
    days: Number,
    pickupLocation: String,
    dropoffLocation: String,
    withChauffeur: { type: Boolean, default: false },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
    driverName: String,
    vehiclePriceSnapshot: Number,
    driverPriceSnapshot: Number,
    totalPrice: Number,
    status: {
      type: String,
      enum: ["en_attente", "confirmee", "payee", "terminee", "annulee"],
      default: "en_attente",
    },
    paymentStatus: {
      type: String,
      enum: ["non_paye", "acompte", "paye"],
      default: "non_paye",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Booking", bookingSchema);
