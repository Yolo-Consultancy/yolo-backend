const mongoose = require("mongoose");

const tripReportSchema = new mongoose.Schema(
  {
    mission: { type: mongoose.Schema.Types.ObjectId, ref: "Mission", required: true, unique: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    clientName: String,
    clientEmail: String,
    driverName: String,
    vehicleName: String,
    notes: { type: String, required: true },
    incidents: String,
    odometerEnd: Number,
    fuelLevel: String,
    status: { type: String, enum: ["soumis", "lu"], default: "soumis" },
    ratingToken: { type: String, unique: true, sparse: true },
    ratingEmailSendAt: Date,
    ratingEmailSent: { type: Boolean, default: false },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model("TripReport", tripReportSchema);
