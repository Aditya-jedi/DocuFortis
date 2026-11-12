import { randomBytes, createHash } from "node:crypto";

export function generateRecoveryCodes(count = 10) {
  const codes = Array.from({ length: count }, () => {
    const raw = randomBytes(8).toString("hex").toUpperCase();

    return `${raw.slice(0, 8)}-${raw.slice(8)}`;
  });

  const hashedCodes = codes.map((code) => ({
    codeHash: hashRecoveryCode(code),
  }));

  return {
    codes,
    hashedCodes,
  };
}

export function hashRecoveryCode(code) {
  const normalized = code.replace(/-/g, "").toUpperCase();

  return createHash("sha256")
    .update(normalized)
    .digest("hex");
}