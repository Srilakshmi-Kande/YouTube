import { Resend } from "resend";
import { getPlanDetails } from "./plans.js";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPlanInvoiceEmail = async ({ email, name, planId, paymentId, amount }) => {
  const plan = getPlanDetails(planId);
  const purchasedAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Yourtube — Payment Confirmation</h2>
      <p>Hi ${name || "there"},</p>
      <p>Thank you for upgrading your plan. Your payment was successful.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px 0; color: #666;">Plan</td><td style="padding: 8px 0;"><strong>${plan.name}</strong></td></tr>
        <tr><td style="padding: 8px 0; color: #666;">Amount</td><td style="padding: 8px 0;"><strong>₹${amount}</strong></td></tr>
        <tr><td style="padding: 8px 0; color: #666;">Payment ID</td><td style="padding: 8px 0;">${paymentId}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;">Date</td><td style="padding: 8px 0;">${purchasedAt}</td></tr>
      </table>
      <p style="color: #666;">${plan.description}</p>
      <p>Enjoy your upgraded experience on Yourtube!</p>
    </div>
  `;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "Yourtube <onboarding@resend.dev>",
    to: [email],
    subject: `Yourtube invoice — ${plan.name} plan`,
    html,
  });

  if (error) {
    console.error("[Resend] Invoice email failed:", error);
    throw new Error(error.message || "Failed to send invoice email");
  }

  console.log("[Resend] Invoice email sent:", data?.id);

  return { sent: true };
};

export const sendOtpEmail = async ({ email, otp, name }) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "Yourtube <onboarding@resend.dev>",
    to: [email],
    subject: "Yourtube login OTP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Yourtube — Login verification</h2>

        <p>Hi ${name || "there"},</p>

        <p>Your one-time password for signing in is:</p>

        <p style="
          font-size: 28px;
          font-weight: bold;
          letter-spacing: 4px;
        ">
          ${otp}
        </p>

        <p style="color: #666;">
          This code expires in 10 minutes.
          Do not share it with anyone.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("[Resend] Email failed:", error);
    throw new Error(error.message || "Failed to send OTP email");
  }

  console.log("[Resend] OTP email sent:", data?.id);

  return { sent: true };
};

export const sendOtpSms = async ({ phone, otp }) => {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const auth = Buffer.from(
      `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
    ).toString("base64");

    const body = new URLSearchParams({
      To: phone,
      From: process.env.TWILIO_PHONE_NUMBER,
      Body: `Your Yourtube login OTP is ${otp}. Valid for 10 minutes.`,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      }
    );

    if (!response.ok) {
      throw new Error("Failed to send SMS OTP");
    }

    return { sent: true };
  }

  console.log(`[sms] OTP for ${phone}: ${otp}`);
  return { sent: false, reason: "SMS provider not configured", devOtp: otp };
};
