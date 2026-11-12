import { randomBytes, createHash } from "node:crypto";

export function generateShareToken() {
  return randomBytes(32).toString("hex");
}

export function hashShareToken(token) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}