"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEmail = isEmail;
exports.isValidRole = isValidRole;
function isEmail(input) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}
const client_1 = require("@prisma/client");
const roleSet = new Set(Object.values(client_1.Role));
function isValidRole(value) {
    return typeof value === "string" && roleSet.has(value);
}
