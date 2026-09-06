import express from "express";
import { pool } from "../db.js";
import requireSmmToken from "../middleware/requireSmmToken.js";
import {
  validatePlan,
  savePlan,
  validPlanId,
  changePlanStatus,
} from "../services/smmPlanService.js";

const router = express.Router();

router.post("/plans", requireSmmToken, async (req, res) => {
  const error = validatePlan(req.body);

  if (error) {
    return res.status(400).json({ message: error });
  }

  try {
    const plan = await savePlan(pool, req.body);
    return res.status(201).json(plan);
  } catch (error) {
    console.error("POST /api/smm/plans failed:", error);
    return res.status(500).json({
      message: "Не вдалося зберегти SMM-план",
    });
  }
});

router.patch("/plans/:id/status", requireSmmToken, async (req, res) => {
  if (!validPlanId(req.params.id)) {
    return res.status(400).json({
      message: "Invalid plan id",
    });
  }

  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({
      message: "Expected JSON object with status",
    });
  }

  const status = body.status;

  if (
    !["approved", "rejected", "regenerated"].includes(status) ||
    Object.keys(body).some((key) => key !== "status")
  ) {
    return res.status(400).json({
      message: "Expected status: approved, rejected or regenerated",
    });
  }

  try {
    const plan = await changePlanStatus(pool, req.params.id, status);

    if (!plan) {
      return res.status(404).json({
        message: "SMM-план не знайдено",
      });
    }

    return res.json(plan);
  } catch (error) {
    console.error("PATCH /api/smm/plans/:id/status failed:", error);
    return res.status(500).json({
      message: "Не вдалося оновити статус SMM-плану",
    });
  }
});

export default router;
