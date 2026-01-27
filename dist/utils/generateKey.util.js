import crypto from "crypto";
const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16; // AES block size
export function encryptAES256(text, secretKey) {
    // Ensure 32-byte key (AES-256)
    const key = crypto.createHash("sha256").update(secretKey).digest();
    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");
    // Store iv + encrypted data together
    return `${iv.toString("base64")}:${encrypted}`;
}
export const generateUsersManagementKey = (length = 64) => crypto.randomBytes(length).toString("base64");
