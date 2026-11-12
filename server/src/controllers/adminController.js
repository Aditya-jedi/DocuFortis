import prisma from "../config/database.js";
import { deleteDocumentFromStorage } from "../utils/storage.js";

const toNumber = (value) => Number(value || 0);

const getLimit = (value, fallback = 100) => {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, 100);
};

export async function getOverview(req, res) {
  try {
    const [
      totalUsers,
      freeUsers,
      premiumUsers,
      totalDocuments,
      activeDocuments,
      deletedDocuments,
      activeStorage,
      pendingUpgradeRequests,
      totalShares,
      totalAuditEvents,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { plan: "FREE", role: "USER" },
      }),
      prisma.user.count({
        where: { plan: "PREMIUM", role: "USER" },
      }),
      prisma.document.count(),
      prisma.document.count({
        where: { status: "ACTIVE" },
      }),
      prisma.document.count({
        where: { status: "DELETED" },
      }),
      prisma.document.aggregate({
        where: { status: "ACTIVE" },
        _sum: { sizeBytes: true },
      }),
      prisma.upgradeRequest.count({
        where: { status: "PENDING" },
      }),
      prisma.shareGrant.count(),
      prisma.auditEvent.count(),
    ]);

    return res.status(200).json({
      success: true,
      overview: {
        totalUsers,
        freeUsers,
        premiumUsers,
        totalDocuments,
        activeDocuments,
        deletedDocuments,
        activeStorageBytes: toNumber(activeStorage._sum.sizeBytes),
        pendingUpgradeRequests,
        totalShares,
        totalAuditEvents,
      },
    });
  } catch (error) {
    console.error("Admin overview error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load admin overview.",
    });
  }
}

export async function getUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        plan: true,
        mfaEnabled: true,
        createdAt: true,
        documents: {
          where: { status: "ACTIVE" },
          select: { sizeBytes: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: getLimit(req.query.limit),
    });

    const safeUsers = users.map((user) => {
      const storageUsedBytes = user.documents.reduce(
        (total, document) => total + toNumber(document.sizeBytes),
        0
      );

      const { documents, ...safeUser } = user;

      return {
        ...safeUser,
        storageUsedBytes,
      };
    });

    return res.status(200).json({
      success: true,
      users: safeUsers,
    });
  } catch (error) {
    console.error("Admin users error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load users.",
    });
  }
}

export async function getDocuments(req, res) {
  try {
    const documents = await prisma.document.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { shares: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: getLimit(req.query.limit),
    });

    return res.status(200).json({
      success: true,
      documents: documents.map((document) => ({
        id: document.id,
        originalName: document.originalName,
        mimeType: document.mimeType,
        sizeBytes: toNumber(document.sizeBytes),
        sha256Hash: document.sha256Hash,
        status: document.status,
        createdAt: document.createdAt,
        deletedAt: document.deletedAt,
        owner: document.owner,
        shareCount: document._count.shares,
      })),
    });
  } catch (error) {
    console.error("Admin documents error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load documents.",
    });
  }
}

export async function getDeletedDocuments(req, res) {
  try {
    const documents = await prisma.document.findMany({
      where: { status: "DELETED" },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { shares: true },
        },
      },
      orderBy: { deletedAt: "desc" },
      take: getLimit(req.query.limit),
    });

    return res.status(200).json({
      success: true,
      documents: documents.map((document) => ({
        id: document.id,
        originalName: document.originalName,
        mimeType: document.mimeType,
        sizeBytes: toNumber(document.sizeBytes),
        sha256Hash: document.sha256Hash,
        createdAt: document.createdAt,
        deletedAt: document.deletedAt,
        owner: document.owner,
        shareCount: document._count.shares,
      })),
    });
  } catch (error) {
    console.error("Admin deleted documents error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load deleted documents.",
    });
  }
}

export async function permanentlyDeleteDocument(req, res) {
  const { documentId } = req.params;

  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { shares: true },
        },
      },
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found.",
      });
    }

    if (document.status !== "DELETED") {
      return res.status(409).json({
        success: false,
        message:
          "Only documents already marked as deleted can be permanently removed.",
      });
    }

    // Remove the Supabase object first.
    // If this fails, the database record remains available for retry.
    await deleteDocumentFromStorage(document.storageKey);

    await prisma.$transaction(async (tx) => {
      await tx.auditEvent.create({
        data: {
          userId: req.user.id,
          action: "DOCUMENT_DELETED",
          entityType: "DOCUMENT",
          entityId: document.id,
          ipAddress: req.ip || null,
          userAgent: req.get("user-agent") || null,
          metadata: {
            operation: "ADMIN_PERMANENT_DELETE",
            originalName: document.originalName,
            ownerId: document.ownerId,
            ownerEmail: document.owner?.email || null,
            cascadedShareCount: document._count.shares,
          },
        },
      });

      // Existing Prisma relation cascades associated share records.
      await tx.document.delete({
        where: { id: document.id },
      });
    });

    return res.status(200).json({
      success: true,
      message:
        "Document and its associated sharing records were permanently deleted.",
      deletedDocumentId: document.id,
    });
  } catch (error) {
    console.error("Admin permanent document deletion error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Permanent deletion failed. The document record has been retained where possible; please retry.",
    });
  }
}

export async function getShares(req, res) {
  try {
    const shareRecords = await prisma.shareGrant.findMany({
      select: {
        id: true,
        documentId: true,
        createdById: true,
        recipientId: true,
        recipientEmail: true,
        permission: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: getLimit(req.query.limit),
    });

    const documentIds = [
      ...new Set(shareRecords.map((share) => share.documentId)),
    ];

    const userIds = [
      ...new Set(
        shareRecords
          .flatMap((share) => [
            share.createdById,
            share.recipientId,
          ])
          .filter(Boolean)
      ),
    ];

    const [documents, users] = await Promise.all([
      documentIds.length
        ? prisma.document.findMany({
            where: { id: { in: documentIds } },
            select: {
              id: true,
              originalName: true,
              status: true,
            },
          })
        : [],

      userIds.length
        ? prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
              id: true,
              name: true,
              email: true,
            },
          })
        : [],
    ]);

    const documentById = new Map(
      documents.map((document) => [document.id, document])
    );

    const userById = new Map(
      users.map((user) => [user.id, user])
    );

    const shares = shareRecords.map((share) => ({
      id: share.id,
      permission: share.permission,
      recipientEmail: share.recipientEmail,
      expiresAt: share.expiresAt,
      revokedAt: share.revokedAt,
      createdAt: share.createdAt,
      document: documentById.get(share.documentId) || null,
      createdBy: userById.get(share.createdById) || null,
      recipient: share.recipientId
        ? userById.get(share.recipientId) || null
        : null,
      isExpired: share.expiresAt
        ? new Date(share.expiresAt) < new Date()
        : false,
      isRevoked: Boolean(share.revokedAt),
    }));

    return res.status(200).json({
      success: true,
      shares,
    });
  } catch (error) {
    console.error("Admin shares error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load sharing records.",
    });
  }
}

export async function getAuditLogs(req, res) {
  try {
    const logs = await prisma.auditEvent.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: getLimit(req.query.limit),
    });

    return res.status(200).json({
      success: true,
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        metadata: log.metadata,
        createdAt: log.createdAt,
        user: log.user,
      })),
    });
  } catch (error) {
    console.error("Admin audit logs error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load audit logs.",
    });
  }
}

export async function getUpgradeRequests(req, res) {
  try {
    const requests = await prisma.upgradeRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            plan: true,
          },
        },
        reviewedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: getLimit(req.query.limit),
    });

    return res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("Admin upgrade requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load upgrade requests.",
    });
  }
}

export async function reviewUpgradeRequest(req, res) {
  const { requestId } = req.params;
  const { decision } = req.body;

  if (!["APPROVED", "REJECTED"].includes(decision)) {
    return res.status(400).json({
      success: false,
      message: "Decision must be APPROVED or REJECTED.",
    });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.upgradeRequest.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        return {
          status: 404,
          message: "Upgrade request not found.",
        };
      }

      if (request.status !== "PENDING") {
        return {
          status: 409,
          message: "This upgrade request has already been reviewed.",
        };
      }

      if (
        decision === "APPROVED" &&
        request.paymentStatus !== "SUCCESS"
      ) {
        return {
          status: 400,
          message:
            "A successful demo payment is required before approval.",
        };
      }

      const updated = await tx.upgradeRequest.updateMany({
        where: {
          id: requestId,
          status: "PENDING",
        },
        data: {
          status: decision,
          reviewedById: req.user.id,
          reviewedAt: new Date(),
        },
      });

      if (updated.count !== 1) {
        return {
          status: 409,
          message: "This upgrade request has already been reviewed.",
        };
      }

      if (decision === "APPROVED") {
        await tx.user.update({
          where: { id: request.userId },
          data: { plan: "PREMIUM" },
        });
      }

      return {
        status: 200,
        message: `Upgrade request ${decision.toLowerCase()} successfully.`,
      };
    });

    return res.status(result.status).json({
      success: result.status === 200,
      message: result.message,
    });
  } catch (error) {
    console.error("Review upgrade request error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to review upgrade request.",
    });
  }
}

export async function revokePremium(req, res) {
  const { userId } = req.params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          plan: true,
        },
      });

      if (!user) {
        return {
          status: 404,
          message: "User not found.",
        };
      }

      if (user.role !== "USER") {
        return {
          status: 403,
          message: "Premium cannot be revoked from an admin account.",
        };
      }

      if (user.plan !== "PREMIUM") {
        return {
          status: 409,
          message: "This account does not currently have Premium.",
        };
      }

      const updated = await tx.user.updateMany({
        where: {
          id: userId,
          role: "USER",
          plan: "PREMIUM",
        },
        data: {
          plan: "FREE",
        },
      });

      if (updated.count !== 1) {
        return {
          status: 409,
          message: "The user's plan has already changed. Refresh and try again.",
        };
      }

      const rejectedRequests = await tx.upgradeRequest.updateMany({
        where: {
          userId,
          status: "PENDING",
        },
        data: {
          status: "REJECTED",
          reviewedById: req.user.id,
          reviewedAt: new Date(),
        },
      });

      await tx.auditEvent.create({
        data: {
          userId: req.user.id,
          action: "PREMIUM_REVOKED",
          entityType: "USER",
          entityId: user.id,
          ipAddress: req.ip || null,
          userAgent: req.get("user-agent") || null,
          metadata: {
            affectedUserId: user.id,
            affectedUserEmail: user.email,
            previousPlan: "PREMIUM",
            newPlan: "FREE",
            rejectedPendingRequests: rejectedRequests.count,
          },
        },
      });

      return {
        status: 200,
        message: `Premium access revoked successfully for ${user.email}.`,
      };
    });

    return res.status(result.status).json({
      success: result.status === 200,
      message: result.message,
    });
  } catch (error) {
    console.error("Admin Premium revocation error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to revoke Premium access.",
    });
  }
}
