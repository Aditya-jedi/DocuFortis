
import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";


import {
  uploadDocument,
  getMyDocuments,
  getStorageUsage,
  downloadDocument,
  deleteDocument,
  previewDocument,
} from "../controllers/documentController.js";

const router = Router();
// Get the logged-in user's storage usage
router.get("/usage", requireAuth, getStorageUsage);

// Upload a document
router.post(
  "/upload",
  requireAuth,
  upload.single("file"),
  uploadDocument
);

// List the logged-in user's documents
router.get(
  "/",
  requireAuth,
  getMyDocuments
);

// Download an owned document
router.get(
  "/:id/download",
  requireAuth,
  downloadDocument
);

// Preview an owned PDF document
router.get("/:id/preview", requireAuth, previewDocument);

// Delete an owned document
router.delete("/:id", requireAuth, deleteDocument);

export default router;
