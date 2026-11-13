
import { randomBytes, createHash } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { sendEmail } from "../services/emailService.js";
import { verifyTurnstileToken } from "../utils/turnstile.js";
import argon2 from "argon2";
import { z } from "zod";
import prisma from "../config/database.js";

import {
  createSession,
  getSessionCookieOptions,
} from "../utils/session.js";

import { getAuditDetails } from "../utils/auditDetails.js";

import {
  encryptMfaSecret,
  decryptMfaSecret,
} from "../utils/mfaCrypto.js";

import {
  createMfaEnrollment,
  verifyMfaToken,
} from "../utils/mfaTotp.js";

import {
  generateRecoveryCodes,
  hashRecoveryCode,
} from "../utils/mfaRecovery.js";

const googleClient = new OAuth2Client();

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
  turnstileToken: z.string().min(1).max(2048),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
  turnstileToken: z.string().min(1).max(2048),
});

const googleLoginSchema = z.object({
  credential: z.string().min(1).max(8192),
});

// Records failed login attempts without interrupting login
// if audit logging encounters a database error.
async function logFailedLogin(req, userId = null) {
  try {
    await prisma.auditEvent.create({
      data: {
        userId,
        action: "LOGIN_FAILED",
        entityType: "User",
        entityId: userId,
        ...getAuditDetails(req),
      },
    });
  } catch (error) {
    console.error("Failed login audit error:", error);
  }
}

// --------------------------------------------------
// REGISTER
// --------------------------------------------------

export async function register(req, res) {
  try {
    const validation = registerSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration details.",
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const name = validation.data.name;
    const email = validation.data.email.toLowerCase();
    const password = validation.data.password;

    const captchaValid = await verifyTurnstileToken(
      validation.data.turnstileToken,
      req.ip
    );

    if (!captchaValid) {
      return res.status(403).json({
        success: false,
        message: "CAPTCHA verification failed. Please try again.",
      });
    }

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      await tx.auditEvent.create({
        data: {
          userId: user.id,
          action: "USER_REGISTERED",
          entityType: "User",
          entityId: user.id,
          ...getAuditDetails(req),
        },
      });

      return user;
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: result,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create your account. Please try again.",
    });
  }
}

// --------------------------------------------------
// LOGIN
// --------------------------------------------------

export async function login(req, res) {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid login details.",
      });
    }

    const email = validation.data.email.toLowerCase();
    const password = validation.data.password;

    const captchaValid = await verifyTurnstileToken(
      validation.data.turnstileToken,
      req.ip
    );

    if (!captchaValid) {
      return res.status(403).json({
        success: false,
        message: "CAPTCHA verification failed. Please try again.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      await logFailedLogin(req);

      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await argon2.verify(
      user.passwordHash,
      password
    );

    if (!passwordMatches) {
      await logFailedLogin(req, user.id);

      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // MFA-enabled accounts must verify a second factor
    // before receiving an authenticated session.
    if (user.mfaEnabled) {
      const challengeToken = randomBytes(32).toString("hex");

      const tokenHash = createHash("sha256")
        .update(challengeToken)
        .digest("hex");

      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      await prisma.$transaction(async (tx) => {
        await tx.mfaLoginChallenge.updateMany({
          where: {
            userId: user.id,
            usedAt: null,
          },
          data: {
            usedAt: new Date(),
          },
        });

        await tx.mfaLoginChallenge.create({
          data: {
            userId: user.id,
            tokenHash,
            expiresAt,
          },
        });
      });

      res.clearCookie(
        "docufortis_session",
        getSessionCookieOptions()
      );

      return res.status(200).json({
        success: true,
        requiresMfa: true,
        challengeToken,
        message: "Enter your authenticator code to complete login.",
      });
    }

    // Normal login for accounts without MFA.
    const result = await prisma.$transaction(async (tx) => {
      const session = await createSession(user.id, tx);

      await tx.auditEvent.create({
        data: {
          userId: user.id,
          action: "USER_LOGIN",
          entityType: "User",
          entityId: user.id,
          ...getAuditDetails(req),
        },
      });

      return session;
    });

    res.cookie(
      "docufortis_session",
      result.token,
      getSessionCookieOptions()
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to log in. Please try again.",
    });
  }
}

// --------------------------------------------------
// GOOGLE LOGIN
// --------------------------------------------------

export async function googleLogin(req, res) {
  try {
    const validation = googleLoginSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid Google authentication request.",
      });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      console.error("GOOGLE_CLIENT_ID is not configured.");

      return res.status(500).json({
        success: false,
        message: "Google sign-in is temporarily unavailable.",
      });
    }

    let payload;

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: validation.data.credential,
        audience: clientId,
      });

      payload = ticket.getPayload();
    } catch (error) {
      console.error("Google token verification failed:", error.message);

      return res.status(401).json({
        success: false,
        message: "Google authentication failed. Please try again.",
      });
    }

    // Only accept identities with a verified Google email.
    if (
      !payload ||
      !payload.sub ||
      !payload.email ||
      payload.email_verified !== true
    ) {
      return res.status(401).json({
        success: false,
        message: "Google account verification failed.",
      });
    }

    const googleId = payload.sub;
    const email = payload.email.trim().toLowerCase();

    const name =
      typeof payload.name === "string" && payload.name.trim()
        ? payload.name.trim().slice(0, 80)
        : email.split("@")[0].slice(0, 80);

    const result = await prisma.$transaction(async (tx) => {
      // First, look for an account already linked to this Google ID.
      let user = await tx.user.findUnique({
        where: { googleId },
      });

      if (!user) {
        // If no Google ID match exists, check the verified email.
        const existingUser = await tx.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          // Never silently replace a different Google identity.
          if (
            existingUser.googleId &&
            existingUser.googleId !== googleId
          ) {
            throw new Error("GOOGLE_ACCOUNT_ALREADY_LINKED");
          }

          // Link this verified Google identity to the existing account.
          user = existingUser.googleId
            ? existingUser
            : await tx.user.update({
                where: { id: existingUser.id },
                data: { googleId },
              });
        } else {
          // Create a new account with a random, inaccessible password.
          // The required passwordHash field remains unchanged.
          const randomPassword = randomBytes(48).toString("hex");

          const passwordHash = await argon2.hash(randomPassword, {
            type: argon2.argon2id,
            memoryCost: 19456,
            timeCost: 2,
            parallelism: 1,
          });

          user = await tx.user.create({
            data: {
              name,
              email,
              googleId,
              passwordHash,
            },
          });

          await tx.auditEvent.create({
            data: {
              userId: user.id,
              action: "USER_REGISTERED",
              entityType: "User",
              entityId: user.id,
              metadata: {
                provider: "GOOGLE",
              },
              ...getAuditDetails(req),
            },
          });
        }
      }

      // MFA accounts must complete the existing MFA challenge flow.
      if (user.mfaEnabled) {
        const challengeToken = randomBytes(32).toString("hex");

        const tokenHash = createHash("sha256")
          .update(challengeToken)
          .digest("hex");

        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await tx.mfaLoginChallenge.updateMany({
          where: {
            userId: user.id,
            usedAt: null,
          },
          data: {
            usedAt: new Date(),
          },
        });

        await tx.mfaLoginChallenge.create({
          data: {
            userId: user.id,
            tokenHash,
            expiresAt,
          },
        });

        return {
          requiresMfa: true,
          challengeToken,
        };
      }

      const session = await createSession(user.id, tx);

      // Record successful Google sign-in.
      await tx.auditEvent.create({
        data: {
          userId: user.id,
          action: "USER_LOGIN",
          entityType: "User",
          entityId: user.id,
          metadata: {
            provider: "GOOGLE",
          },
          ...getAuditDetails(req),
        },
      });

      return {
        requiresMfa: false,
        session,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          mfaEnabled: user.mfaEnabled,
        },
      };
    });

    if (result.requiresMfa) {
      res.clearCookie(
        "docufortis_session",
        getSessionCookieOptions()
      );

      return res.status(200).json({
        success: true,
        requiresMfa: true,
        challengeToken: result.challengeToken,
        message: "Enter your authenticator code to complete login.",
      });
    }

    res.cookie(
      "docufortis_session",
      result.session.token,
      getSessionCookieOptions()
    );

    return res.status(200).json({
      success: true,
      message: "Google sign-in successful.",
      user: result.user,
    });
  } catch (error) {
    if (error.message === "GOOGLE_ACCOUNT_ALREADY_LINKED") {
      return res.status(409).json({
        success: false,
        message:
          "This email is already linked to a different Google account. Please use your existing sign-in method.",
      });
    }

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message:
          "This Google account could not be linked. Please try signing in again.",
      });
    }

    console.error("Google login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to complete Google sign-in. Please try again.",
    });
  }
}

// --------------------------------------------------
// GET CURRENT USER
// --------------------------------------------------

export async function getMe(req, res) {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
}

// --------------------------------------------------
// LOGOUT
// --------------------------------------------------

export async function logout(req, res) {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.session.update({
        where: { id: req.sessionId },
        data: {
          revokedAt: new Date(),
        },
      });

      await tx.auditEvent.create({
        data: {
          userId: req.user.id,
          action: "USER_LOGOUT",
          entityType: "User",
          entityId: req.user.id,
          ...getAuditDetails(req),
        },
      });
    });

    res.clearCookie(
      "docufortis_session",
      getSessionCookieOptions()
    );

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to log out. Please try again.",
    });
  }
}

// --------------------------------------------------
// PASSWORD RESET VALIDATION
// --------------------------------------------------

const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(254),
});

const resetPasswordSchema = z.object({
  token: z.string().length(64),
  newPassword: z.string().min(8).max(128),
});

const validateResetTokenSchema = z.object({
  token: z.string().length(64),
});

// --------------------------------------------------
// FORGOT PASSWORD
// --------------------------------------------------

export async function forgotPassword(req, res) {
  const parsed = forgotPasswordSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email address.",
    });
  }

  const email = parsed.data.email.toLowerCase();

  const genericMessage =
    "If an account with that email exists, a password reset link has been sent.";

  let tokenHash = null;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: genericMessage,
      });
    }

    const token = randomBytes(32).toString("hex");

    tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
        data: {
          usedAt: new Date(),
        },
      });

      await tx.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      await tx.auditEvent.create({
        data: {
          userId: user.id,
          action: "PASSWORD_RESET_REQUESTED",
          ...getAuditDetails(req),
        },
      });
    });

    const clientUrl = process.env.CLIENT_URL;

    if (!clientUrl) {
      throw new Error("CLIENT_URL is not configured.");
    }

    const resetUrl = new URL("/reset-password", clientUrl);
    resetUrl.searchParams.set("token", token);

    await sendEmail({
      to: user.email,
      subject: "Reset your DocuFortis password",
      text: [
        "A password reset was requested for your DocuFortis account.",
        "",
        `Reset your password using this link: ${resetUrl.toString()}`,
        "",
        "This link expires in 15 minutes.",
        "If you did not request this, you can safely ignore this email.",
      ].join("\n"),
    });

    return res.status(200).json({
      success: true,
      message: genericMessage,
    });
  } catch (error) {
    console.error("Password reset request failed:", error.message);

    try {
      if (tokenHash) {
        await prisma.passwordResetToken.updateMany({
          where: {
            tokenHash,
            usedAt: null,
          },
          data: {
            usedAt: new Date(),
          },
        });
      }
    } catch (cleanupError) {
      console.error("Reset token cleanup failed:", cleanupError.message);
    }

    return res.status(200).json({
      success: true,
      message: genericMessage,
    });
  }
}

// --------------------------------------------------
// RESET PASSWORD
// --------------------------------------------------

export async function resetPassword(req, res) {
  const parsed = resetPasswordSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid password reset request.",
    });
  }

  const { token, newPassword } = parsed.data;

  const tokenHash = createHash("sha256")
    .update(token)
    .digest("hex");

  const now = new Date();

  try {
    const passwordResetToken =
      await prisma.passwordResetToken.findUnique({
        where: { tokenHash },
      });

    if (
      !passwordResetToken ||
      passwordResetToken.usedAt ||
      passwordResetToken.expiresAt <= now
    ) {
      return res.status(400).json({
        success: false,
        message: "This password reset link is invalid or has expired.",
      });
    }

    const newPasswordHash = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    await prisma.$transaction(async (tx) => {
      const validToken = await tx.passwordResetToken.findFirst({
        where: {
          id: passwordResetToken.id,
          tokenHash,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      if (!validToken) {
        throw new Error("INVALID_OR_EXPIRED_RESET_TOKEN");
      }

      await tx.user.update({
        where: { id: validToken.userId },
        data: {
          passwordHash: newPasswordHash,
        },
      });

      await tx.passwordResetToken.update({
        where: { id: validToken.id },
        data: {
          usedAt: new Date(),
        },
      });

      await tx.passwordResetToken.updateMany({
        where: {
          userId: validToken.userId,
          usedAt: null,
        },
        data: {
          usedAt: new Date(),
        },
      });

      await tx.session.updateMany({
        where: {
          userId: validToken.userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      await tx.auditEvent.create({
        data: {
          userId: validToken.userId,
          action: "PASSWORD_RESET_COMPLETED",
          ...getAuditDetails(req),
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: "Your password has been reset successfully. Please log in again.",
    });
  } catch (error) {
    if (error.message === "INVALID_OR_EXPIRED_RESET_TOKEN") {
      return res.status(400).json({
        success: false,
        message: "This password reset link is invalid or has expired.",
      });
    }

    console.error("Password reset failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to reset your password. Please try again.",
    });
  }
}

// --------------------------------------------------
// VALIDATE RESET TOKEN
// --------------------------------------------------

export async function validateResetToken(req, res) {
  const parsed = validateResetTokenSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "This password reset link is invalid.",
    });
  }

  const tokenHash = createHash("sha256")
    .update(parsed.data.token)
    .digest("hex");

  try {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt <= new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "This password reset link has expired or has already been used. Please request a new one.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password reset link is valid.",
    });
  } catch (error) {
    console.error("Reset token validation failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify this password reset link. Please try again.",
    });
  }
}

// --------------------------------------------------
// VERIFY MFA LOGIN
// --------------------------------------------------

export async function verifyMfaLogin(req, res) {
  try {
    const schema = z.object({
      challengeToken: z.string().min(1),
      code: z.string().trim().min(1).max(20),
    });

    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification request.",
      });
    }

    const { challengeToken, code } = parsed.data;

    const tokenHash = createHash("sha256")
      .update(challengeToken)
      .digest("hex");

    const challenge = await prisma.mfaLoginChallenge.findUnique({
      where: { tokenHash },
      include: {
        user: true,
      },
    });

    if (
      !challenge ||
      challenge.usedAt ||
      challenge.expiresAt <= new Date() ||
      !challenge.user.mfaEnabled ||
      !challenge.user.mfaSecret
    ) {
      return res.status(401).json({
        success: false,
        message: "Verification challenge is invalid or expired. Please log in again.",
      });
    }

    const user = challenge.user;

    let validCode = false;
    let recoveryCodeId = null;
    let verifiedTimeStep = null;

    if (/^\d{6}$/.test(code)) {
      const secret = decryptMfaSecret(
        user.mfaSecret,
        user.id
      );

      const verification = await verifyMfaToken(
        secret,
        code,
        user.mfaLastUsedStep
      );

      validCode = verification.valid;
      verifiedTimeStep = verification.timeStep;
    } else {
      const codeHash = hashRecoveryCode(code);

      const recoveryCode = await prisma.mfaRecoveryCode.findFirst({
        where: {
          userId: user.id,
          codeHash,
          usedAt: null,
        },
      });

      if (recoveryCode) {
        validCode = true;
        recoveryCodeId = recoveryCode.id;
      }
    }

    if (!validCode) {
      return res.status(401).json({
        success: false,
        message: "Invalid authenticator or recovery code.",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const consumedChallenge = await tx.mfaLoginChallenge.updateMany({
        where: {
          id: challenge.id,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: {
          usedAt: new Date(),
        },
      });

      if (consumedChallenge.count !== 1) {
        throw new Error("MFA_CHALLENGE_ALREADY_USED");
      }

      if (recoveryCodeId) {
        const consumedRecoveryCode =
          await tx.mfaRecoveryCode.updateMany({
            where: {
              id: recoveryCodeId,
              usedAt: null,
            },
            data: {
              usedAt: new Date(),
            },
          });

        if (consumedRecoveryCode.count !== 1) {
          throw new Error("MFA_RECOVERY_CODE_ALREADY_USED");
        }
      }

      if (verifiedTimeStep !== null) {
        const updated = await tx.user.updateMany({
          where: {
            id: user.id,
            mfaLastUsedStep: user.mfaLastUsedStep,
          },
          data: {
            mfaLastUsedStep: BigInt(verifiedTimeStep),
          },
        });

        if (updated.count !== 1) {
          throw new Error("MFA_CODE_ALREADY_USED");
        }
      }

      const session = await createSession(user.id, tx);

      await tx.auditEvent.create({
        data: {
          userId: user.id,
          action: "USER_LOGIN",
          entityType: "User",
          entityId: user.id,
          ...getAuditDetails(req),
        },
      });

      return { session };
    });

    res.cookie(
      "docufortis_session",
      result.session.token,
      getSessionCookieOptions()
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mfaEnabled: user.mfaEnabled,
      },
    });
  } catch (error) {
    if (
      error.message === "MFA_CHALLENGE_ALREADY_USED" ||
      error.message === "MFA_RECOVERY_CODE_ALREADY_USED" ||
      error.message === "MFA_CODE_ALREADY_USED"
    ) {
      return res.status(401).json({
        success: false,
        message: "This verification attempt has expired or already been used. Please log in again.",
      });
    }

    console.error("MFA login verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify your MFA code.",
    });
  }
}

// --------------------------------------------------
// ENROLL MFA
// --------------------------------------------------

export async function enrollMfa(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        mfaEnabled: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.mfaEnabled) {
      return res.status(409).json({
        success: false,
        message: "MFA is already enabled on this account.",
      });
    }

    const { secret, qrCode } = await createMfaEnrollment(user.email);

    const encryptedSecret = encryptMfaSecret(
      secret,
      user.id
    );

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        mfaSecret: encryptedSecret,
        mfaPendingExpiresAt: expiresAt,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Scan this QR code with your authenticator app, then verify the code to enable MFA.",
      qrCode,
      expiresAt,
    });
  } catch (error) {
    console.error("MFA enrollment error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to start MFA enrollment.",
    });
  }
}

// --------------------------------------------------
// ENABLE MFA
// --------------------------------------------------

export async function enableMfa(req, res) {
  try {
    const schema = z.object({
      code: z.string().regex(/^\d{6}$/, "Enter a valid six-digit code."),
    });

    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid six-digit authenticator code.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        mfaEnabled: true,
        mfaSecret: true,
        mfaPendingExpiresAt: true,
      },
    });

    if (
      !user ||
      !user.mfaSecret ||
      !user.mfaPendingExpiresAt
    ) {
      return res.status(400).json({
        success: false,
        message: "Start MFA enrollment before enabling it.",
      });
    }

    if (user.mfaEnabled) {
      return res.status(409).json({
        success: false,
        message: "MFA is already enabled.",
      });
    }

    if (user.mfaPendingExpiresAt <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "MFA enrollment expired. Please start again.",
      });
    }

    const secret = decryptMfaSecret(
      user.mfaSecret,
      user.id
    );

    const verification = await verifyMfaToken(
      secret,
      parsed.data.code
    );

    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        message: "Incorrect authenticator code.",
      });
    }

    const { codes, hashedCodes } = generateRecoveryCodes();

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          mfaEnabled: true,
          mfaEnabledAt: new Date(),
          mfaPendingExpiresAt: null,
          mfaLastUsedStep: BigInt(verification.timeStep),
        },
      });

      await tx.mfaRecoveryCode.deleteMany({
        where: { userId: user.id },
      });

      await tx.mfaRecoveryCode.createMany({
        data: hashedCodes.map((item) => ({
          userId: user.id,
          codeHash: item.codeHash,
        })),
      });

      await tx.session.updateMany({
        where: {
          userId: user.id,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      await tx.auditEvent.create({
        data: {
          userId: user.id,
          action: "MFA_ENABLED",
          entityType: "User",
          entityId: user.id,
          ...getAuditDetails(req),
        },
      });
    });

    res.clearCookie(
      "docufortis_session",
      getSessionCookieOptions()
    );

    return res.status(200).json({
      success: true,
      message: "MFA enabled successfully. Save your recovery codes securely.",
      recoveryCodes: codes,
    });
  } catch (error) {
    console.error("MFA activation error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to enable MFA.",
    });
  }
}

// --------------------------------------------------
// DISABLE MFA
// --------------------------------------------------

export async function disableMfa(req, res) {
  try {
    const schema = z.object({
      password: z.string().min(1),
      code: z.string().trim().min(1).max(20),
    });

    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Password and verification code are required.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      return res.status(400).json({
        success: false,
        message: "MFA is not enabled on this account.",
      });
    }

    const passwordValid = await argon2.verify(
      user.passwordHash,
      parsed.data.password
    );

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password.",
      });
    }

    let validCode = false;
    let recoveryCodeId = null;
    let verifiedTimeStep = null;

    if (/^\d{6}$/.test(parsed.data.code)) {
      const secret = decryptMfaSecret(
        user.mfaSecret,
        user.id
      );

      const verification = await verifyMfaToken(
        secret,
        parsed.data.code,
        user.mfaLastUsedStep
      );

      validCode = verification.valid;
      verifiedTimeStep = verification.timeStep;
    } else {
      const codeHash = hashRecoveryCode(parsed.data.code);

      const recoveryCode = await prisma.mfaRecoveryCode.findFirst({
        where: {
          userId: user.id,
          codeHash,
          usedAt: null,
        },
      });

      if (recoveryCode) {
        validCode = true;
        recoveryCodeId = recoveryCode.id;
      }
    }

    if (!validCode) {
      return res.status(401).json({
        success: false,
        message: "Invalid authenticator or recovery code.",
      });
    }

    await prisma.$transaction(async (tx) => {
      if (recoveryCodeId) {
        const consumed = await tx.mfaRecoveryCode.updateMany({
          where: {
            id: recoveryCodeId,
            usedAt: null,
          },
          data: {
            usedAt: new Date(),
          },
        });

        if (consumed.count !== 1) {
          throw new Error("MFA_RECOVERY_CODE_ALREADY_USED");
        }
      }

      if (verifiedTimeStep !== null) {
        const updated = await tx.user.updateMany({
          where: {
            id: user.id,
            mfaEnabled: true,
            mfaLastUsedStep: user.mfaLastUsedStep,
          },
          data: {
            mfaEnabled: false,
            mfaSecret: null,
            mfaEnabledAt: null,
            mfaPendingExpiresAt: null,
            mfaLastUsedStep: null,
          },
        });

        if (updated.count !== 1) {
          throw new Error("MFA_CODE_ALREADY_USED");
        }
      } else {
        await tx.user.update({
          where: { id: user.id },
          data: {
            mfaEnabled: false,
            mfaSecret: null,
            mfaEnabledAt: null,
            mfaPendingExpiresAt: null,
            mfaLastUsedStep: null,
          },
        });
      }

      await tx.mfaRecoveryCode.deleteMany({
        where: { userId: user.id },
      });

      await tx.mfaLoginChallenge.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
        data: {
          usedAt: new Date(),
        },
      });

      await tx.session.updateMany({
        where: {
          userId: user.id,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      await tx.auditEvent.create({
        data: {
          userId: user.id,
          action: "MFA_DISABLED",
          entityType: "User",
          entityId: user.id,
          ...getAuditDetails(req),
        },
      });
    });

    res.clearCookie(
      "docufortis_session",
      getSessionCookieOptions()
    );

    return res.status(200).json({
      success: true,
      message: "MFA disabled. Please log in again.",
    });
  } catch (error) {
    if (
      error.message === "MFA_RECOVERY_CODE_ALREADY_USED" ||
      error.message === "MFA_CODE_ALREADY_USED"
    ) {
      return res.status(401).json({
        success: false,
        message: "The verification code has already been used. Please try again.",
      });
    }

    console.error("MFA deactivation error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to disable MFA.",
    });
  }
}
