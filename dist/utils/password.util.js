"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptPassword = encryptPassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function encryptPassword(password) {
    const salt = await bcryptjs_1.default.genSalt(10);
    const hashed = await bcryptjs_1.default.hash(password, salt);
    return hashed;
}
