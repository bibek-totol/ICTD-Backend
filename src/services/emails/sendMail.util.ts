import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import config from "../../configs/env.config";
import { AppError } from "../../utils/AppError.util";

function generateSixDigitCode() {
  const firstDigit = Math.floor(Math.random() * 9) + 1;
  const remainingDigits = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");

  return `${firstDigit}${remainingDigits}`;
}

async function compileHTML(
  templateName: string,
  replacements: Record<string, any>,
) {
  const templatePath = path.join(__dirname, templateName);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  let html = fs.readFileSync(templatePath, "utf-8");

  for (const [key, value] of Object.entries(replacements)) {
    html = html.replace(new RegExp(`{{${key}}}`, "g"), String(value));
  }

  return html;
}

export const sendMailWithVerificationCode = async (receiverEmail: string) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const emailVerificationCode = generateSixDigitCode();

    const ModifiedEmailVerificationCode = emailVerificationCode
      .split("")
      .join(" ");

    const mailOption = {
      from: process.env.SENDER_MAIL,
      to: receiverEmail,
      subject: "Email verification",
      html: await compileHTML("sendEmailCode.html", {
        emailVerificationCode: ModifiedEmailVerificationCode,
        emailVerificationCodeExpireTime: config.email_verification_expiry,
      }),
    };

    const info = await transporter.sendMail(mailOption);
    console.log("Message sent:", info.messageId);

    return emailVerificationCode;
  } catch (error: any) {
    throw new AppError({ fnc: "sendMailWithVerificationCode", error });
  }
};
