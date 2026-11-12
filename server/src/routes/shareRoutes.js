
import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  createShare,
  getMyShares,
  getSharedLinkAccess,
  previewSharedDocument,
  revokeShare,
  downloadSharedDocument,
} from "../controllers/shareController.js";

const router = Router();

router.get("/", requireAuth, getMyShares);
router.post("/:id", requireAuth, createShare);

// Validate link access and retrieve its permitted action.
router.get("/:token/access", requireAuth, getSharedLinkAccess);

router.get("/:token/preview", requireAuth, previewSharedDocument);
router.get("/:token/download", requireAuth, downloadSharedDocument);

router.delete("/:id", requireAuth, revokeShare);

export default router;
