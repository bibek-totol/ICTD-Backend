export function isEmail(input) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}
import { Role } from "@prisma/client";
const roleSet = new Set(Object.values(Role));
export function isValidRole(value) {
    return typeof value === "string" && roleSet.has(value);
}
