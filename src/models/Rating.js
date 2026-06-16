const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    tripReport: { type: mongoose.Schema.Types.ObjectId, ref: "TripReport", required: true },
    mission: { type: mongoose.Schema.Types.ObjectId, ref: "Mission" },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
    clientName: String,
    clientEmail: String,
    driverName: String,
    serviceScore: { type: Number, min: 1, max: 5, required: true },
    driverScore: { type: Number, min: 1, max: 5, required: true },
    comment: String,
    token: { type: String, required: true, unique: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Rating", ratingSchema);
