const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, lowercase: true, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "agent", "chauffeur"], default: "agent" },
    portalScope: {
      type: String,
      enum: ["vehicules", "demenagement", "sur_mesure", "all"],
      default: "all",
    },
    active: { type: Boolean, default: true },
    refreshTokenHash: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
