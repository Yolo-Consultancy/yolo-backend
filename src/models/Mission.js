const mongoose = require("mongoose");

const missionSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    assigneeName: String,
    type: { type: String, enum: ["livraison", "chauffeur", "recuperation"] },
    scheduledAt: Date,
    status: {
      type: String,
      enum: ["a_affecter", "en_cours", "terminee"],
      default: "a_affecter",
    },
    notes: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Mission", missionSchema);
