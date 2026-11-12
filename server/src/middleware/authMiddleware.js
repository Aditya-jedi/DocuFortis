
import { createHash } from "node:crypto";
import prisma from "../config/database.js";

const LAST_USED_UPDATE_INTERVAL = 5 * 60 * 1000;

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.docufortis_session;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneCountryCode: true,
            phoneNumber: true,
            role: true,
            plan: true,
            mfaEnabled: true,
          },
        },
      },
    });

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date()
    ) {
      return res.status(401).json({
        success: false,
        message: "Your session is invalid or expired. Please log in again.",
      });
    }

    req.user = session.user;
    req.sessionId = session.id;

    // Update lastUsedAt at most once every five minutes.
    const now = new Date();

    if (
      !session.lastUsedAt ||
      now.getTime() - session.lastUsedAt.getTime() >=
        LAST_USED_UPDATE_INTERVAL
    ) {
      await prisma.session.updateMany({
        where: {
          id: session.id,
          revokedAt: null,
          expiresAt: { gt: now },
          OR: [
            { lastUsedAt: null },
            {
              lastUsedAt: {
                lte: new Date(
                  now.getTime() - LAST_USED_UPDATE_INTERVAL
                ),
              },
            },
          ],
        },
        data: {
          lastUsedAt: now,
        },
      });
    }

    return next();
  } catch (error) {
    console.error("Authentication middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify your session.",
    });
  }
}
