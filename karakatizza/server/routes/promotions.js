import express from "express";
import requireAdminAuth from "../middleware/requireAdminAuth.js";

export default function promotionsRoutes(pool) {
  const router = express.Router();

  // Получить настройки акции
  router.get("/settings", requireAdminAuth, async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          discount_percent AS "discountPercent",
          trigger_sum AS "triggerSum",
          is_active AS "isActive"
        FROM promotion_settings
        LIMIT 1
      `);

      return res.json(result.rows[0]);
    } catch (error) {
      return res.status(500).json({
        message: "Ошибка получения акции",
        error: error.message,
      });
    }
  });

  // Обновить настройки акции
  router.put("/settings", requireAdminAuth, async (req, res) => {
    try {
      const { discountPercent, triggerSum, isActive } = req.body;

      const result = await pool.query(
        `
        UPDATE promotion_settings
        SET
          discount_percent = $1,
          trigger_sum = $2,
          is_active = $3,
          updated_at = NOW()
        RETURNING 
          discount_percent AS "discountPercent",
          trigger_sum AS "triggerSum",
          is_active AS "isActive"
        `,
        [
          Number(discountPercent) || 25,
          Number(triggerSum) || 600,
          isActive === true,
        ]
      );

      return res.json(result.rows[0]);
    } catch (error) {
      return res.status(500).json({
        message: "Ошибка обновления акции",
        error: error.message,
      });
    }
  });

  return router;
}
