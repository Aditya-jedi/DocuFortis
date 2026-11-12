
import { createHash } from "node:crypto";
import prisma from "../config/database.js";
import { validateFileContent } from "../utils/fileValidation.js";
import {
  uploadDocumentToStorage,
  deleteDocumentFromStorage,
} from "../utils/storage.js";
import supabase from "../config/supabase.js";
import { getAuditDetails } from "../utils/auditDetails.js";

const STORAGE_LIMITS = {
  FREE: 60 * 1024 * 1024,
  PREMIUM: 90 * 1024 * 1024,
};

export async function uploadDocument(req, res) {
  let storageKey;

  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Please select a file to upload.",
      });
    }

    const validatedFile = await validateFileContent(file);

    const totalStorage = await prisma.document.aggregate({
      where: {
        ownerId: req.user.id,
        status: "ACTIVE",
      },
      _sum: {
        sizeBytes: true,
      },
    });

    const usedStorage = Number(totalStorage._sum.sizeBytes || 0);

const storageLimit =
  STORAGE_LIMITS[req.user.plan] ?? STORAGE_LIMITS.FREE;

if (usedStorage + file.size > storageLimit) {
  const limitMB = storageLimit / (1024 * 1024);

  return res.status(413).json({
    success: false,
    message: `Storage limit exceeded. Your account has a ${limitMB} MB storage limit.`,
  });
}

    const sha256Hash = createHash("sha256")
      .update(file.buffer)
      .digest("hex");

    storageKey = await uploadDocumentToStorage(
      file,
      req.user.id,
      validatedFile.extension,
      validatedFile.mimeType
    );

    try {
      const document = await prisma.$transaction(async (tx) => {
        const createdDocument = await tx.document.create({
          data: {
            ownerId: req.user.id,
            originalName: file.originalname,
            storageKey,
            mimeType: validatedFile.mimeType,
            sizeBytes: BigInt(file.size),
            sha256Hash,
          },
        });

        await tx.auditEvent.create({
          data: {
            ...getAuditDetails(req),
            userId: req.user.id,
            action: "DOCUMENT_UPLOADED",
            entityType: "DOCUMENT",
            entityId: createdDocument.id,
            metadata: {
              fileName: file.originalname,
              fileSize: file.size,
              mimeType: validatedFile.mimeType,
              sha256Hash,
            },
          },
        });

        return createdDocument;
      });

      return res.status(201).json({
        success: true,
        message: "Document uploaded successfully.",
        document: {
          id: document.id,
          originalName: document.originalName,
          mimeType: document.mimeType,
          sizeBytes: Number(document.sizeBytes),
          sha256Hash: document.sha256Hash,
          createdAt: document.createdAt,
        },
      });
    } catch (databaseError) {
      await deleteDocumentFromStorage(storageKey);
      storageKey = null;
      throw databaseError;
    }
  } catch (error) {
    console.error("Document upload error:", error);

    if (storageKey) {
      try {
        await deleteDocumentFromStorage(storageKey);
      } catch (cleanupError) {
        console.error("Storage cleanup failed:", cleanupError.message);
      }
    }

    if (
      error.message === "Invalid or unsupported file content." ||
      error.message === "File content does not match its declared MIME type." ||
      error.message === "Invalid text file."
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to upload document. Please try again.",
    });
  }
}

export async function getMyDocuments(req, res) {
  try {
    const documents = await prisma.document.findMany({
      where: {
        ownerId: req.user.id,
        status: "ACTIVE",
      },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        sizeBytes: true,
        sha256Hash: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedDocuments = documents.map((document) => ({
      ...document,
      sizeBytes: Number(document.sizeBytes),
    }));

    return res.status(200).json({
      success: true,
      count: formattedDocuments.length,
      documents: formattedDocuments,
    });
  } catch (error) {
    console.error("Document listing error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve your documents.",
    });
  }
}

export async function getStorageUsage(req, res) {
  try {
    const totalStorage = await prisma.document.aggregate({
      where: {
        ownerId: req.user.id,
        status: "ACTIVE",
      },
      _sum: {
        sizeBytes: true,
      },
    });

    const usedBytes = Number(totalStorage._sum.sizeBytes || 0);

    const limitBytes =
      STORAGE_LIMITS[req.user.plan] ?? STORAGE_LIMITS.FREE;

    const remainingBytes = Math.max(0, limitBytes - usedBytes);

    const usagePercentage = Number(
      ((usedBytes / limitBytes) * 100).toFixed(1)
    );

    return res.status(200).json({
      success: true,
      storage: {
        plan: req.user.plan || "FREE",
        usedBytes,
        limitBytes,
        remainingBytes,
        usagePercentage,
      },
    });
  } catch (error) {
    console.error("Storage usage error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve storage usage.",
    });
  }
}

export async function downloadDocument(req, res) {
  try {
    const { id } = req.params;

    const document = await prisma.document.findFirst({
      where: {
        id,
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

    const { data, error } = await supabase.storage
      .from("docufortis-documents")
      .download(document.storageKey);

    if (error || !data) {
      console.error("Supabase download error:", error?.message);

      return res.status(500).json({
        success: false,
        message: "Unable to retrieve the document.",
      });
    }

    res.setHeader("Content-Type", "application/octet-stream");

    const extension = document.originalName
      .split(".")
      .pop()
      .replace(/[^a-zA-Z0-9]/g, "");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="document-${document.id}.${extension}"`
    );

    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Length", document.sizeBytes.toString());

    const buffer = Buffer.from(await data.arrayBuffer());

    // Record the successful download activity
    await prisma.auditEvent.create({
      data: {
        ...getAuditDetails(req),
        userId: req.user.id,
        action: "DOCUMENT_DOWNLOADED",
        entityType: "DOCUMENT",
        entityId: document.id,
        metadata: {
          fileName: document.originalName,
          fileSize: Number(document.sizeBytes),
          sha256Hash: document.sha256Hash,
          accessMethod: "OWNER_DOWNLOAD",
        },
      },
    });

    return res.status(200).send(buffer);
  } catch (error) {
    console.error("Document download error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Unable to download document.",
      });
    }
  }
}


// Preview PDF and supported image documents in the browser
export async function previewDocument(req, res) {
  try {
    const { id } = req.params;

    // Verify document ownership and active status
    const document = await prisma.document.findFirst({
      where: {
        id,
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

    // Allow only explicitly supported preview formats
    const supportedPreviewTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!supportedPreviewTypes.includes(document.mimeType)) {
      return res.status(415).json({
        success: false,
        message: "Preview is not supported for this file type.",
      });
    }

    // Retrieve the file from private Supabase Storage
    const { data, error } = await supabase.storage
      .from("docufortis-documents")
      .download(document.storageKey);

    if (error || !data) {
      console.error("Supabase preview error:", error?.message);

      return res.status(500).json({
        success: false,
        message: "Unable to retrieve the document for preview.",
      });
    }

    const buffer = Buffer.from(await data.arrayBuffer());

    // Record the viewing activity
    await prisma.auditEvent.create({
      data: {
        ...getAuditDetails(req),
        userId: req.user.id,
        action: "DOCUMENT_VIEWED",
        entityType: "DOCUMENT",
        entityId: document.id,
        metadata: {
          fileName: document.originalName,
          fileSize: Number(document.sizeBytes),
          mimeType: document.mimeType,
        },
      },
    });

    // Serve the file inline using its validated MIME type
    const extensionMap = {
      "application/pdf": "pdf",
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };

    res.setHeader("Content-Type", document.mimeType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="document-${document.id}.${extensionMap[document.mimeType]}"`
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Content-Length", buffer.length);

    return res.status(200).send(buffer);
  } catch (error) {
    console.error("Document preview error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Unable to preview document.",
      });
    }
  }
}


// Delete a document owned by the logged-in user
export async function deleteDocument(req, res) {
  try {
    const { id } = req.params;

    // Find the active document and verify ownership
    const document = await prisma.document.findFirst({
      where: {
        id,
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

    // Mark the document as deleted and record the audit event
    const deleted = await prisma.$transaction(async (tx) => {
      const result = await tx.document.updateMany({
        where: {
          id,
          ownerId: req.user.id,
          status: "ACTIVE",
        },
        data: {
          status: "DELETED",
          deletedAt: new Date(),
        },
      });

      // Prevent duplicate deletion and duplicate audit events
      if (result.count === 0) {
        return false;
      }

      await tx.auditEvent.create({
        data: {
          ...getAuditDetails(req),
          userId: req.user.id,
          action: "DOCUMENT_DELETED",
          entityType: "DOCUMENT",
          entityId: document.id,
          metadata: {
            fileName: document.originalName,
            fileSize: Number(document.sizeBytes),
            sha256Hash: document.sha256Hash,
          },
        },
      });

      return true;
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Document not found.",
      });
    }

    // Remove the actual file from private Supabase Storage
    let storageCleanupPending = false;

    try {
      await deleteDocumentFromStorage(document.storageKey);
    } catch (storageError) {
      storageCleanupPending = true;
      console.error(
        "Document storage cleanup failed:",
        storageError.message
      );
    }

    return res.status(200).json({
      success: true,
      message: storageCleanupPending
        ? "Document deleted. Storage cleanup is pending."
        : "Document deleted successfully.",
      storageCleanupPending,
    });
  } catch (error) {
    console.error("Document deletion error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete document. Please try again.",
    });
  }
}
