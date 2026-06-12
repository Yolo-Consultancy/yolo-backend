const mongoose = require("mongoose");

const supportMessageSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    sender: { type: String, enum: ["client", "agent"], required: true },
    text: { type: String, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SupportMessage", supportMessageSchema);
