"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMailWithVerificationCode = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const env_config_1 = __importDefault(require("../../configs/env.config"));
const AppError_util_1 = require("../../utils/AppError.util");
function generateSixDigitCode() {
    const firstDigit = Math.floor(Math.random() * 9) + 1;
    const remainingDigits = Math.floor(Math.random() * 100000)
        .toString()
        .padStart(5, "0");
    return `${firstDigit}${remainingDigits}`;
}
async function compileHTML(templateName, replacements) {
    const templatePath = path_1.default.join(__dirname, templateName);
    if (!fs_1.default.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templatePath}`);
    }
    let html = fs_1.default.readFileSync(templatePath, "utf-8");
    for (const [key, value] of Object.entries(replacements)) {
        html = html.replace(new RegExp(`{{${key}}}`, "g"), String(value));
    }
    return html;
}
const sendMailWithVerificationCode = async (receiverEmail) => {
    try {
        const transporter = nodemailer_1.default.createTransport({
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
                emailVerificationCodeExpireTime: env_config_1.default.email_verification_expiry,
            }),
        };
        const info = await transporter.sendMail(mailOption);
        console.log("Message sent:", info.messageId);
        return emailVerificationCode;
    }
    catch (error) {
        throw new AppError_util_1.AppError({ fnc: "sendMailWithVerificationCode", error });
    }
};
exports.sendMailWithVerificationCode = sendMailWithVerificationCode;
