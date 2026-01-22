import * as XLSX from "xlsx";
import { Role } from "@prisma/client";
import { prisma } from "../configs/prisma.config";

// 🔁 Update path to your Excel file
const EXCEL_FILE_PATH = "../data/users.xlsx";
const SHEET_NAME = "Sheet1";

export async function uploadToDBFromExcelUserSheet() {
  const workbook = XLSX.readFile(EXCEL_FILE_PATH);
  const sheet = workbook.Sheets[SHEET_NAME];

  if (!sheet) {
    throw new Error(`Sheet "${SHEET_NAME}" not found`);
  }

  const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: null });

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
      const role =
        row.role && Role[row.role as keyof typeof Role]
          ? (row.role as Role)
          : Role.LabAdmin;

      // ❌ Skip invalid rows
      if (!userName || !email || !phoneNumber) {
        console.warn(`⚠️ Skipped row ${index + 1}: missing required fields`);
        continue;
      }

      // 🔍 Prevent duplicates
      const exists = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { phoneNumber }],
        },
      });

      if (exists) {
        console.warn(`⚠️ User already exists: ${email}`);
        continue;
      }

      await prisma.user.create({
        data: {
          userName,
          email,
          phoneNumber,
          altPhoneNumber,
          role,
        },
      });

      console.log(`✅ Inserted: ${email}`);
    } catch (error) {
      console.error(`❌ Failed row ${index + 1}`, error);
    }
  }
}
