"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUsersManagementKey = void 0;
exports.encryptAES256 = encryptAES256;
const crypto_1 = __importDefault(require("crypto"));
const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16; // AES block size
function encryptAES256(text, secretKey) {
    // Ensure 32-byte key (AES-256)
    const key = crypto_1.default.createHash("sha256").update(secretKey).digest();
    // Generate random IV
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");
    // Store iv + encrypted data together
    return `${iv.toString("base64")}:${encrypted}`;
}
const generateUsersManagementKey = (length = 64) => crypto_1.default.randomBytes(length).toString("base64");
exports.generateUsersManagementKey = generateUsersManagementKey;
