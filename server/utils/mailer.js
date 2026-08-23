import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { BrevoClient } from "@getbrevo/brevo";
import { getPlanDetails } from "./plans.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});


const getBrevoClient = () => {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is not configured");
  }

  return new BrevoClient({
    apiKey: process.env.BREVO_API_KEY,
  });
};

export const sendPlanInvoiceEmail = async ({
  email,
  name,
  planId,
  paymentId,
  amount,
}) => {
  const plan = getPlanDetails(planId);

  const purchasedAt = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
  });

  const brevo = getBrevoClient();

  const result = await brevo.transactionalEmails.sendTransacEmail({
    sender: {
      name: "Yourtube",
      email: process.env.EMAIL_FROM,
    },

    to: [
      {
        email,
        name: name || "User",
      },
    ],

    subject: `Yourtube invoice — ${plan.name} plan`,

    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #dc2626;">
          Yourtube — Payment Confirmation
        </h2>

        <p>Hi ${name || "there"},</p>

        <p>
          Thank you for upgrading your plan.
          Your payment was successful.
        </p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px 0; color: #666;">Plan</td>
            <td style="padding: 8px 0;">
              <strong>${plan.name}</strong>
            </td>
          </tr>

          <tr>
            <td style="padding: 8px 0; color: #666;">Amount</td>
            <td style="padding: 8px 0;">
              <strong>₹${amount}</strong>
            </td>
          </tr>

          <tr>
            <td style="padding: 8px 0; color: #666;">Payment ID</td>
            <td style="padding: 8px 0;">
              ${paymentId}
            </td>
          </tr>

          <tr>
            <td style="padding: 8px 0; color: #666;">Date</td>
            <td style="padding: 8px 0;">
              ${purchasedAt}
            </td>
          </tr>
        </table>

        <p style="color: #666;">
          ${plan.description}
        </p>

        <p>
          Enjoy your upgraded experience on Yourtube!
        </p>
      </div>
    `,
  });

  console.log("[Brevo] Invoice email sent:", result);

  return { sent: true };
};

export const sendOtpEmail = async ({ email, otp, name }) => {
  const brevo = getBrevoClient();

  const result = await brevo.transactionalEmails.sendTransacEmail({
    sender: {
      name: "Yourtube",
      email: process.env.EMAIL_FROM,
    },

    to: [
      {
        email,
        name: name || "User",
      },
    ],

    subject: "Yourtube login OTP",

    htmlContent: `
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

  console.log("[Brevo] OTP email sent:", result);

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
