import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";

import {
  getOverview,
  getUsers,
  getDocuments,
  getDeletedDocuments,
  permanentlyDeleteDocument,
  getShares,
  getAuditLogs,
  getUpgradeRequests,
  reviewUpgradeRequest,
  revokePremium,
} from "../controllers/adminController.js";

const router = express.Router();

// Every admin endpoint requires authentication and ADMIN role.
router.use(requireAuth, requireAdmin);

router.get("/check", (req, res) => {
  return res.status(200).json({
    success: true,
    admin: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

router.get("/overview", getOverview);

router.get("/users", getUsers);

router.get("/documents/deleted", getDeletedDocuments);
router.get("/documents", getDocuments);

router.delete(
  "/documents/:documentId/permanent",
  permanentlyDeleteDocument
);

router.get("/shares", getShares);

router.get("/audit-logs", getAuditLogs);

router.get("/upgrade-requests", getUpgradeRequests);

router.patch(
  "/upgrade-requests/:requestId",
  reviewUpgradeRequest
);
router.patch(
  "/users/:userId/revoke-premium",
  revokePremium
);

export default router;