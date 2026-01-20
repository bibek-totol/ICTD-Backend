export function isEmail(input: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}

import { Role } from "@prisma/client";

const roleSet = new Set(Object.values(Role));

export function isValidRole(value: unknown): value is Role {
  return typeof value === "string" && roleSet.has(value as Role);
}
