import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  createUpgradeRequest,
  simulatePayment,
  getMyUpgradeRequest,
} from "../controllers/upgradeController.js";

const router = express.Router();

router.get("/my-request", requireAuth, getMyUpgradeRequest);
router.post("/request", requireAuth, createUpgradeRequest);
router.post("/:requestId/payment", requireAuth, simulatePayment);

export default router;