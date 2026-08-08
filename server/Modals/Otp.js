import mongoose from "mongoose";

const otpSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  email: { type: String },
  phone: { type: String },
  otp: { type: String, required: true },
  channel: { type: String, enum: ["email", "sms"], required: true },
  state: { type: String },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

otpSchema.index({ userId: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("otps", otpSchema);
