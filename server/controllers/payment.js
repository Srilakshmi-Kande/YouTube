import crypto from "crypto";
import Razorpay from "razorpay";
import users from "../Modals/Auth.js";
import { PAID_PLANS, PLANS } from "../utils/plans.js";
import { sendPlanInvoiceEmail } from "../utils/mailer.js";

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return null;
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

export const getPlans = async (_req, res) => {
  return res.status(200).json({ plans: Object.values(PLANS) });
};

export const createOrder = async (req, res) => {
  const { userId, planId } = req.body;

  if (!userId || !planId || !PAID_PLANS.includes(planId)) {
    return res.status(400).json({ message: "Invalid plan or user" });
  }

  const user = await users.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const plan = PLANS[planId];
  const razorpay = getRazorpay();

  if (!razorpay) {
    return res.status(503).json({ message: "Payment service not configured" });
  }

  try {
    const order = await razorpay.orders.create({
      amount: plan.amountInPaise,
      currency: "INR",
      receipt: `rcpt_${planId}_${Date.now()}`,
      notes: { userId, planId },
    });

    return res.status(200).json({
      orderId: order.id,
      amount: plan.amountInPaise,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
      planId,
      planName: plan.name,
    });
  } catch (error) {
    console.error("createOrder error:", error);
    return res.status(500).json({ message: "Failed to create payment order" });
  }
};

export const verifyPayment = async (req, res) => {
  const {
    userId,
    planId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  if (
    !userId ||
    !planId ||
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !PAID_PLANS.includes(planId)
  ) {
    return res.status(400).json({ message: "Missing or invalid payment details" });
  }

  if (!process.env.RAZORPAY_KEY_SECRET) {
    return res.status(503).json({ message: "Payment service not configured" });
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ message: "Payment verification failed" });
  }

  try {
    const plan = PLANS[planId];
    const updatedUser = await users.findByIdAndUpdate(
      userId,
      {
        $set: {
          plan: planId,
          planPurchasedAt: new Date(),
          razorpayPaymentId: razorpay_payment_id,
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    try {
      await sendPlanInvoiceEmail({
        email: updatedUser.email,
        name: updatedUser.name,
        planId,
        paymentId: razorpay_payment_id,
        amount: plan.price,
      });
    } catch (emailError) {
      console.error("Invoice email error:", emailError);
    }

    return res.status(200).json({ result: updatedUser, message: "Plan upgraded successfully" });
  } catch (error) {
    console.error("verifyPayment error:", error);
    return res.status(500).json({ message: "Failed to update plan" });
  }
};
