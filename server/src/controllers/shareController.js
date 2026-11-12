
import supabase from "../config/supabase.js";
import { z } from "zod";
import prisma from "../config/database.js";
import {
  generateShareToken,
  hashShareToken,
} from "../utils/shareToken.js";
import { getAuditDetails } from "../utils/auditDetails.js";

const createShareSchema = z.object({
  recipientEmail: z.string().trim().email().max(254),
  permission: z.enum(["VIEW", "VIEW_AND_DOWNLOAD"]),
  expiresInHours: z.number().int().min(1).max(720),
});

const PREVIEW_MIME_TYPES = {
  "application/pdf": "application/pdf",
  "image/png": "image/png",
  "image/jpeg": "image/jpeg",
  "image/jpg": "image/jpeg",
  "image/webp": "image/webp",
  "text/plain": "text/plain; charset=utf-8",
};

function getSafeFilename(filename) {
  return filename
    .replace(/[\r\n"]/g, "_")
    .replace(/[\\/]/g, "_");
}

// Record denied sharing access without exposing the reason to unauthorized users.
async function logDeniedShareAccess(req, share, reason) {
  try {
    await prisma.auditEvent.create({
      data: {
        ...getAuditDetails(req),
        userId: req.user.id,
        action: "SHARE_ACCESS_DENIED",
        entityType: "SHARE",
        entityId: share?.id ?? null,
        metadata: {
          reason,
          ...(share?.documentId
            ? { documentId: share.documentId }
            : {}),
        },
      },
    });
  } catch (error) {
    console.error("Denied share access audit error:", error);
  }
}

export async function getMyShares(req, res) {
  try {
    const shares = await prisma.shareGrant.findMany({
      where: {
        createdById: req.user.id,
      },
      select: {
        id: true,
        recipientEmail: true,
        permission: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
        document: {
          select: {
            id: true,
            originalName: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: shares.length,
      shares,
    });
  } catch (error) {
    console.error("Share listing error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve sharing links.",
    });
  }
}

export async function createShare(req, res) {
  try {
    const validation = createShareSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid sharing details.",
        errors: validation.error.issues,
      });
    }

    const { recipientEmail, permission, expiresInHours } =
      validation.data;

    const document = await prisma.document.findFirst({
      where: {
        id: req.params.id,
        ownerId: req.user.id,
        status: "ACTIVE",
      },
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found.",
      });
    }

    const token = generateShareToken();
    const tokenHash = hashShareToken(token);

    const expiresAt = new Date(
      Date.now() + expiresInHours * 60 * 60 * 1000
    );

    const recipient = await prisma.user.findFirst({
      where: {
        email: {
          equals: recipientEmail.toLowerCase(),
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    const share = await prisma.$transaction(async (tx) => {
      const createdShare = await tx.shareGrant.create({
        data: {
          documentId: document.id,
          createdById: req.user.id,
          recipientId: recipient?.id || null,
          recipientEmail: recipientEmail.toLowerCase(),
          permission,
          tokenHash,
          expiresAt,
        },
      });

      await tx.auditEvent.create({
        data: {
          ...getAuditDetails(req),
          userId: req.user.id,
          action: "SHARE_CREATED",
          entityType: "SHARE",
          entityId: createdShare.id,
          metadata: {
            documentId: document.id,
            recipientEmail: recipientEmail.toLowerCase(),
            permission,
            expiresAt: expiresAt.toISOString(),
          },
        },
      });

      return createdShare;
    });

    return res.status(201).json({
      success: true,
      message: "Sharing link created successfully.",
      share: {
        id: share.id,
        token,
        recipientEmail: share.recipientEmail,
        permission: share.permission,
        expiresAt: share.expiresAt,
      },
    });
  } catch (error) {
    console.error("Create share error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create sharing link.",
    });
  }
}

// Validate a sharing link and return its permitted access type.
export async function getSharedLinkAccess(req, res) {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "A sharing token is required.",
      });
    }

    const tokenHash = hashShareToken(token);

    const share = await prisma.shareGrant.findUnique({
      where: { tokenHash },
      include: {
        document: {
          select: {
            originalName: true,
            mimeType: true,
            status: true,
          },
        },
      },
    });

    if (!share) {
      await logDeniedShareAccess(req, null, "INVALID_OR_UNKNOWN_LINK");

      return res.status(404).json({
        success: false,
        message: "Sharing link not found.",
      });
    }

    if (
      share.revokedAt ||
      share.expiresAt <= new Date() ||
      share.document.status !== "ACTIVE"
    ) {
      await logDeniedShareAccess(req, share, "LINK_UNAVAILABLE");

      return res.status(403).json({
        success: false,
        message: "This sharing link is expired or unavailable.",
      });
    }

    if (
      share.recipientEmail.toLowerCase() !==
      req.user.email.toLowerCase()
    ) {
      await logDeniedShareAccess(req, share, "RECIPIENT_MISMATCH");

      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this document.",
      });
    }

    return res.status(200).json({
      success: true,
      permission: share.permission,
      document: {
        originalName: share.document.originalName,
        mimeType: share.document.mimeType,
      },
    });
  } catch (error) {
    console.error("Shared link access validation error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to validate sharing link.",
    });
  }
}

export async function previewSharedDocument(req, res) {
  try {
    const { token } = req.params;
    const tokenHash = hashShareToken(token);

    const share = await prisma.shareGrant.findUnique({
      where: { tokenHash },
      include: {
        document: true,
      },
    });

    if (!share) {
      await logDeniedShareAccess(req, null, "INVALID_OR_UNKNOWN_LINK");

      return res.status(404).json({
        success: false,
        message: "Sharing link not found.",
      });
    }

    if (
      share.revokedAt ||
      share.expiresAt <= new Date() ||
      share.document.status !== "ACTIVE"
    ) {
      await logDeniedShareAccess(req, share, "LINK_UNAVAILABLE");

      return res.status(403).json({
        success: false,
        message: "This sharing link is expired or unavailable.",
      });
    }

    if (
      share.recipientEmail.toLowerCase() !==
      req.user.email.toLowerCase()
    ) {
      await logDeniedShareAccess(req, share, "RECIPIENT_MISMATCH");

      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this document.",
      });
    }

    if (
      !["VIEW", "VIEW_AND_DOWNLOAD"].includes(share.permission)
    ) {
      await logDeniedShareAccess(req, share, "PREVIEW_NOT_PERMITTED");

      return res.status(403).json({
        success: false,
        message: "This sharing link does not allow document previews.",
      });
    }

    const contentType = PREVIEW_MIME_TYPES[share.document.mimeType];

    if (!contentType) {
      return res.status(415).json({
        success: false,
        message: "Preview is not supported for this file type.",
      });
    }

    const { data, error } = await supabase.storage
      .from("docufortis-documents")
      .download(share.document.storageKey);

    if (error || !data) {
      console.error("Shared preview storage error:", error?.message);

      return res.status(500).json({
        success: false,
        message: "Unable to retrieve shared document.",
      });
    }

    const buffer = Buffer.from(await data.arrayBuffer());

    await prisma.auditEvent.create({
      data: {
        ...getAuditDetails(req),
        userId: req.user.id,
        action: "SHARE_ACCESSED",
        entityType: "SHARE",
        entityId: share.id,
        metadata: {
          documentId: share.document.id,
          permission: share.permission,
          accessType: "PREVIEW",
        },
      },
    });

    const safeFilename = getSafeFilename(
      share.document.originalName
    );

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename*=UTF-8''${encodeURIComponent(safeFilename)}`
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Content-Length", buffer.length);

    return res.status(200).send(buffer);
  } catch (error) {
    console.error("Shared document preview error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Unable to preview shared document.",
      });
    }
  }
}

export async function revokeShare(req, res) {
  try {
    const { id } = req.params;

    const share = await prisma.shareGrant.findFirst({
      where: {
        id,
        createdById: req.user.id,
        revokedAt: null,
      },
    });

    if (!share) {
      return res.status(404).json({
        success: false,
        message: "Active sharing link not found.",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.shareGrant.update({
        where: { id: share.id },
        data: {
          revokedAt: new Date(),
        },
      });

      await tx.auditEvent.create({
        data: {
          ...getAuditDetails(req),
          userId: req.user.id,
          action: "SHARE_REVOKED",
          entityType: "SHARE",
          entityId: share.id,
          metadata: {
            documentId: share.documentId,
            recipientEmail: share.recipientEmail,
          },
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: "Sharing link revoked successfully.",
    });
  } catch (error) {
    console.error("Revoke share error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to revoke sharing link.",
    });
  }
}

export async function downloadSharedDocument(req, res) {
  try {
    const { token } = req.params;
    const tokenHash = hashShareToken(token);

    const share = await prisma.shareGrant.findUnique({
      where: { tokenHash },
      include: {
        document: true,
      },
    });

    if (!share) {
      await logDeniedShareAccess(req, null, "INVALID_OR_UNKNOWN_LINK");

      return res.status(404).json({
        success: false,
        message: "Sharing link not found.",
      });
    }

    if (
      share.revokedAt ||
      share.expiresAt <= new Date() ||
      share.document.status !== "ACTIVE"
    ) {
      await logDeniedShareAccess(req, share, "LINK_UNAVAILABLE");

      return res.status(403).json({
        success: false,
        message: "This sharing link is expired or unavailable.",
      });
    }

    if (
      share.recipientEmail.toLowerCase() !==
      req.user.email.toLowerCase()
    ) {
      await logDeniedShareAccess(req, share, "RECIPIENT_MISMATCH");

      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this document.",
      });
    }

    if (share.permission !== "VIEW_AND_DOWNLOAD") {
      await logDeniedShareAccess(req, share, "DOWNLOAD_NOT_PERMITTED");

      return res.status(403).json({
        success: false,
        message: "This sharing link does not allow downloads.",
      });
    }

    const { data, error } = await supabase.storage
      .from("docufortis-documents")
      .download(share.document.storageKey);

    if (error || !data) {
      console.error("Shared download error:", error?.message);

      return res.status(500).json({
        success: false,
        message: "Unable to retrieve shared document.",
      });
    }

    const buffer = Buffer.from(await data.arrayBuffer());

    await prisma.auditEvent.create({
      data: {
        ...getAuditDetails(req),
        userId: req.user.id,
        action: "DOCUMENT_DOWNLOADED",
        entityType: "DOCUMENT",
        entityId: share.document.id,
        metadata: {
          sharedAccess: true,
          shareId: share.id,
        },
      },
    });

    const safeFilename = getSafeFilename(
      share.document.originalName
    );

    res.setHeader(
      "Content-Type",
      share.document.mimeType || "application/octet-stream"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="shared-document"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`
    );

    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Content-Length", buffer.length);

    return res.status(200).send(buffer);
  } catch (error) {
    console.error("Shared download controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to download shared document.",
    });
  }
}
