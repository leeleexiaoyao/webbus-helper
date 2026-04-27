import crypto from "crypto";

export function createId(prefix: string): string {
  const random = crypto.randomBytes(12).toString("hex");
  return `${prefix}_${random}`;
}
