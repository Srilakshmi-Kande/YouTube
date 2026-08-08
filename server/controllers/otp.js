import users from "../Modals/Auth.js";
import Otp from "../Modals/Otp.js";
import { getOtpChannelForState, isSouthIndianState } from "../utils/regions.js";
import { generateOtp, getOtpExpiry } from "../utils/otpService.js";
import { sendOtpEmail, sendOtpSms } from "../utils/mailer.js";

export const sendOtp = async (req, res) => {
  const { userId, email, phone, state, name } = req.body;

  if (!userId || !email || !state) {
    return res.status(400).json({ message: "User, email, and state are required" });
  }

  const channel = getOtpChannelForState(state);

  if (channel === "sms" && !phone) {
    return res.status(400).json({
      message: "Mobile number is required for OTP verification in your region",
      requiresPhone: true,
      channel,
    });
  }

  try {
    const otp = generateOtp();
    await Otp.deleteMany({ userId });

    await Otp.create({
      userId,
      email,
      phone: phone || undefined,
      otp,
      channel,
      state,
      expiresAt: getOtpExpiry(),
    });

    let delivery;
    if (channel === "email") {
      delivery = await sendOtpEmail({ email, otp, name });
    } else {
      delivery = await sendOtpSms({ phone, otp });
    }

    if (phone && channel === "sms") {
      await users.findByIdAndUpdate(userId, { $set: { phone, state } });
    } else {
      await users.findByIdAndUpdate(userId, { $set: { state } });
    }

    return res.status(200).json({
      channel,
      isSouthIndia: isSouthIndianState(state),
      message:
        channel === "email"
          ? "OTP sent to your registered email"
          : "OTP sent to your registered mobile number",
      devOtp: delivery.devOtp,
    });
  } catch (error) {
    console.error("sendOtp error:", error);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
};

export const verifyOtp = async (req, res) => {
  const { userId, otp, phone } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({ message: "User and OTP are required" });
  }

  try {
    const record = await Otp.findOne({ userId, otp });
    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const updates = { state: record.state };
    if (phone) updates.phone = phone;
    if (record.phone) updates.phone = record.phone;

    const user = await users.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true }
    );

    await Otp.deleteMany({ userId });

    return res.status(200).json({ verified: true, result: user });
  } catch (error) {
    console.error("verifyOtp error:", error);
    return res.status(500).json({ message: "OTP verification failed" });
  }
};
