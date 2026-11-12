import {
  generateSecret,
  generateURI,
  verify,
} from "otplib";

import QRCode from "qrcode";

const ISSUER = "DocuFortis";

export async function createMfaEnrollment(email) {
  const secret = generateSecret();

  const uri = generateURI({
    issuer: ISSUER,
    label: email,
    secret,
  });

  const qrCode = await QRCode.toDataURL(uri);

  return {
    secret,
    qrCode,
  };
}

export async function verifyMfaToken(
  secret,
  token,
  lastUsedStep = null
) {
  if (!/^\d{6}$/.test(token)) {
    return {
      valid: false,
      timeStep: null,
    };
  }

  const result = await verify({
    secret,
    token,
    ...(lastUsedStep !== null
      ? { afterTimeStep: Number(lastUsedStep) }
      : {}),
  });

  return {
    valid: result.valid,
    timeStep: result.valid ? result.timeStep : null,
  };
}