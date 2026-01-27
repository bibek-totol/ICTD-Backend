"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToDBFromExcelUserSheet = uploadToDBFromExcelUserSheet;
const XLSX = __importStar(require("xlsx"));
const client_1 = require("@prisma/client");
const prisma_config_1 = require("../configs/prisma.config");
// 🔁 Update path to your Excel file
const EXCEL_FILE_PATH = "../data/users.xlsx";
const SHEET_NAME = "Sheet1";
async function uploadToDBFromExcelUserSheet() {
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    const sheet = workbook.Sheets[SHEET_NAME];
    if (!sheet) {
        throw new Error(`Sheet "${SHEET_NAME}" not found`);
    }
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
    console.log(`📄 Rows found: ${rows.length}`);
    for (const [index, row] of rows.entries()) {
        try {
            const userName = String(row.head || "").trim();
            const email = String(row.email || "")
                .trim()
                .toLowerCase();
            const phoneNumber = row.mobile ? String(row.mobile).trim() : null;
            const altPhoneNumber = row.alt_mobile
                ? String(row.alt_mobile).trim()
                : null;
            const role = row.role && client_1.Role[row.role]
                ? row.role
                : client_1.Role.LabAdmin;
            // ❌ Skip invalid rows
            if (!userName || !email || !phoneNumber) {
                console.warn(`⚠️ Skipped row ${index + 1}: missing required fields`);
                continue;
            }
            // 🔍 Prevent duplicates
            const exists = await prisma_config_1.prisma.user.findFirst({
                where: {
                    OR: [{ email }, { phoneNumber }],
                },
            });
            if (exists) {
                console.warn(`⚠️ User already exists: ${email}`);
                continue;
            }
            await prisma_config_1.prisma.user.create({
                data: {
                    userName,
                    email,
                    phoneNumber,
                    altPhoneNumber,
                    role,
                },
            });
            console.log(`✅ Inserted: ${email}`);
        }
        catch (error) {
            console.error(`❌ Failed row ${index + 1}`, error);
        }
    }
}
