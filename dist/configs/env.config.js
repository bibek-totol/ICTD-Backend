import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env") });
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
    database_url: process.env.DATABASE_URL,
    base_url: process.env.BASE_URL,
    port: process.env.PORT,
    node_env: process.env.NODE_ENV,
    jwt_secret: process.env.JWT_SECRET,
    jwt_expires_in: process.env.JWT_EXPIRES_IN || "7d",
    add_user_support: checkAddUserSupport(),
    email_verification_expiry: Number(process.env.EMAIL_VERIFICATION_EXPIRY),
};
export default config;
