import dotenv from "dotenv";
import path from "path";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing in .env");
}

function checkAddUserSupport() {
  return process.env.ADD_USER_SUPPORT === "true" ||
    process.env.ADD_USER_SUPPORT === "TRUE" ||
    process.env.ADD_USER_SUPPORT === "yes" ||
    process.env.ADD_USER_SUPPORT === "YES" ||
    process.env.ADD_USER_SUPPORT === "1" ||
    process.env.ADD_USER_SUPPORT === "on" ||
    process.env.ADD_USER_SUPPORT === "ON" ||
    process.env.ADD_USER_SUPPORT === "0N" ||
    process.env.ADD_USER_SUPPORT === "0n"
    ? true
    : false;
}

const config = {
  database_url: process.env.DATABASE_URL as string,
  base_url: process.env.BASE_URL as string,
  port: process.env.PORT as string,
  node_env: process.env.NODE_ENV as string,
  jwt_secret: process.env.JWT_SECRET as string,
  jwt_expires_in: (process.env.JWT_EXPIRES_IN as string) || "7d",
  add_user_support: checkAddUserSupport(),
  email_verification_expiry: Number(process.env.EMAIL_VERIFICATION_EXPIRY),
};

export default config;
