import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import config from "../../configs/env.config";
import { fileURLToPath } from "url";
import { AppError } from "../../utils/AppError.util";

// create transport
// mailOptions
// sennd mail

// 1. transport

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateSixDigitCode() {
  // First digit: 1–9 (never 0)
  const firstDigit = Math.floor(Math.random() * 9) + 1;

  // Remaining 5 digits: 0–9
  const remainingDigits = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");

  return `${firstDigit}${remainingDigits}`;
}

async function compileHTML(templateName: string, replacements: Object) {
  const templatePath = path.join(__dirname, templateName);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  let html = fs.readFileSync(templatePath, "utf-8");

  // Replace {{email}}, {{link}} etc.
  for (const [key, value] of Object.entries(replacements)) {
    html = html.replace(new RegExp(`{{${key}}}`, "g"), String(value));
  }

  // no juice(), no css injection
  return html;
}

export const sendMailWithVerificationCode = async (receiverEmail: string) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure:
        Number(process.env.EMAIL_PORT) ===
        465 /*  true for port 465, false for other ports */,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // async..await is not allowed in global scope, must use a wrapper

    let emailVerificationCode = generateSixDigitCode();

    const ModifiedEmailVerificationCode = emailVerificationCode
      .split("")
      .join(" ");

    const mailOption = {
      from: process.env.SENDER_MAIL, // sender address
      to: receiverEmail, // list of receivers
      subject: "Email verification", // Subject line
      // text: `${message} ${verificationUrl}`, // plain text body
      html: await compileHTML("sendEmailCode.html", {
        emailVerificationCode: ModifiedEmailVerificationCode,
        emailVerificationCodeExpireTime: config.email_verification_expiry,
      }),
    };

    const info = await transporter.sendMail(mailOption);
    console.log("Message sent: %s", info.messageId);
    return emailVerificationCode;
  } catch (error: any) {
    console.log(`Sending email fail ${error.message}`);
    throw new AppError({ fnc: "sendMailWithVerificationCode", error });
  }
};
