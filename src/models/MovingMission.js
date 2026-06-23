const mongoose = require("mongoose");

const movingMissionSchema = new mongoose.Schema(
  {
    contactMessage: { type: mongoose.Schema.Types.ObjectId, ref: "ContactMessage" },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "Mover" },
    assigneeName: String,
    type: {
      type: String,
      enum: ["emballage", "transport", "montage", "complet"],
      default: "complet",
    },
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

module.exports = mongoose.model("MovingMission", movingMissionSchema);
