import nodemailer from "nodemailer";
import { getPlanDetails } from "./plans.js";

const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendPlanInvoiceEmail = async ({ email, name, planId, paymentId, amount }) => {
  const transporter = createTransporter();
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

  if (!transporter) {
    console.log("[mailer] SMTP not configured — invoice email skipped for", email);
    return { sent: false, reason: "SMTP not configured" };
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: `Yourtube invoice — ${plan.name} plan`,
    html,
  });

  return { sent: true };
};

export const sendOtpEmail = async ({ email, otp, name }) => {
  const transporter = createTransporter();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Yourtube — Login verification</h2>
      <p>Hi ${name || "there"},</p>
      <p>Your one-time password for signing in is:</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
      <p style="color: #666;">This code expires in 10 minutes. Do not share it with anyone.</p>
    </div>
  `;

  if (!transporter) {
    console.log(`[mailer] OTP for ${email}: ${otp}`);
    return { sent: false, reason: "SMTP not configured", devOtp: otp };
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Yourtube login OTP",
    html,
  });

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
