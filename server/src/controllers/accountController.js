
import argon2 from "argon2";
import { z } from "zod";
import prisma from "../config/database.js";
import { getAuditDetails } from "../utils/auditDetails.js";

// Fields safe to return to the authenticated account owner.
const profileSelect = {
  id: true,
  name: true,
  email: true,
  phoneCountryCode: true,
  phoneNumber: true,
  role: true,
  plan: true,
  mfaEnabled: true,
  createdAt: true,
  updatedAt: true,
};

const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phoneCountryCode: z.string().trim().max(8).nullable().optional(),
  phoneNumber: z.string().trim().max(20).nullable().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "Provide at least one account detail to update." }
);

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
});

// --------------------------------------------------
// GET ACCOUNT PROFILE
// --------------------------------------------------

export async function getProfile(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: profileSelect,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve account details.",
    });
  }
}

// --------------------------------------------------
// UPDATE ACCOUNT PROFILE
// --------------------------------------------------

export async function updateProfile(req, res) {
  try {
    const validation = updateProfileSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid account details.",
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const input = validation.data;
    const data = {};

    if (input.name !== undefined) {
      data.name = input.name;
    }

    const countryCodeProvided =
      input.phoneCountryCode !== undefined;
    const phoneNumberProvided =
      input.phoneNumber !== undefined;

    // Update phone information together to avoid mismatched values.
    if (countryCodeProvided !== phoneNumberProvided) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide both the phone country code and phone number.",
      });
    }

    if (countryCodeProvided && phoneNumberProvided) {
      const countryCode = input.phoneCountryCode?.trim() || "";
      const phoneNumber = input.phoneNumber?.trim() || "";

      // Allow both fields to be cleared.
      if (!countryCode && !phoneNumber) {
        data.phoneCountryCode = null;
        data.phoneNumber = null;
      } else {
        if (!/^\+[1-9]\d{0,3}$/.test(countryCode)) {
          return res.status(400).json({
            success: false,
            message:
              "Enter a valid country calling code, such as +91.",
          });
        }

        const normalizedPhone = phoneNumber.replace(/[\s()-]/g, "");

        if (!/^\d{6,15}$/.test(normalizedPhone)) {
          return res.status(400).json({
            success: false,
            message:
              "Enter a valid phone number containing 6 to 15 digits.",
          });
        }

        data.phoneCountryCode = countryCode;
        data.phoneNumber = normalizedPhone;
      }
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: req.user.id },
        data,
        select: profileSelect,
      });

      await tx.auditEvent.create({
        data: {
          userId: req.user.id,
          action: "PROFILE_UPDATED",
          entityType: "User",
          entityId: req.user.id,
          metadata: {
            updatedFields: Object.keys(data),
          },
          ...getAuditDetails(req),
        },
      });

      return user;
    });

    return res.status(200).json({
      success: true,
      message: "Account details updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update account details.",
    });
  }
}

// --------------------------------------------------
// CHANGE PASSWORD
// --------------------------------------------------

export async function changePassword(req, res) {
  try {
    const validation = changePasswordSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid password change request.",
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const { currentPassword, newPassword } = validation.data;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    const currentPasswordValid = await argon2.verify(
      user.passwordHash,
      currentPassword
    );

    if (!currentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Your current password is incorrect.",
      });
    }

    const samePassword = await argon2.verify(
      user.passwordHash,
      newPassword
    );

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message: "Your new password must be different from your current password.",
      });
    }

    const newPasswordHash = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newPasswordHash,
        },
      });

      // Keep the current session active, but revoke other sessions.
      await tx.session.updateMany({
        where: {
          userId: user.id,
          id: { not: req.sessionId },
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      // Invalidate outstanding password-reset links.
      await tx.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
        data: {
          usedAt: new Date(),
        },
      });

      await tx.auditEvent.create({
        data: {
          userId: user.id,
          action: "PASSWORD_CHANGED",
          entityType: "User",
          entityId: user.id,
          ...getAuditDetails(req),
        },
      });
    });

    return res.status(200).json({
      success: true,
      message:
        "Password changed successfully. Other active sessions have been signed out.",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to change your password. Please try again.",
    });
  }
}
