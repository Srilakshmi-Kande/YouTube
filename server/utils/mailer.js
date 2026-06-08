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
