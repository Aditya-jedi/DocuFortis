
import dotenv from "dotenv";

dotenv.config();

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const EXPECTED_HOSTNAME = process.env.TURNSTILE_HOSTNAME;
const EXPECTED_ACTION = "authentication";

export async function verifyTurnstileToken(token, remoteIp) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret || !token || !EXPECTED_HOSTNAME) {
    return false;
  }

  try {
    const body = new URLSearchParams({
      secret,
      response: token,
    });

    if (remoteIp) {
      body.append("remoteip", remoteIp);
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error("Cloudflare verification service unavailable.");
    }

    const result = await response.json();

    if (result.success !== true) {
      return false;
    }

    if (
      result.hostname?.toLowerCase() !==
      EXPECTED_HOSTNAME.toLowerCase()
    ) {
      console.warn("Turnstile hostname validation failed.");
      return false;
    }

    if (result.action !== EXPECTED_ACTION) {
      console.warn("Turnstile action validation failed.");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Turnstile verification error:", error.message);
    throw error;
  }
}
