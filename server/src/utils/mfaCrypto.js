import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey() {
  const key = process.env.MFA_ENCRYPTION_KEY;

  if (!key || !/^[a-f0-9]{64}$/i.test(key)) {
    throw new Error(
      "MFA_ENCRYPTION_KEY must be a valid 32-byte hexadecimal key."
    );
  }

  return Buffer.from(key, "hex");
}

export function encryptMfaSecret(secret, userId) {
  const iv = randomBytes(12);

  const cipher = createCipheriv(
    ALGORITHM,
    getEncryptionKey(),
    iv
  );

  cipher.setAAD(Buffer.from(userId, "utf8"));

  const encrypted = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

export function decryptMfaSecret(encryptedData, userId) {
  const parts = encryptedData.split(":");

  if (
    parts.length !== 4 ||
    parts[0] !== "v1" ||
    !/^[a-f0-9]{24}$/i.test(parts[1]) ||
    !/^[a-f0-9]{32}$/i.test(parts[2]) ||
    !/^(?:[a-f0-9]{2})+$/i.test(parts[3])
  ) {
    throw new Error("Invalid encrypted MFA secret.");
  }

  const [, ivHex, authTagHex, encryptedHex] = parts;

  const decipher = createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(ivHex, "hex")
  );

  decipher.setAAD(Buffer.from(userId, "utf8"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}