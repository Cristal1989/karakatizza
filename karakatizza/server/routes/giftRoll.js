import express from "express";

export default function giftRollRoutes(pool) {
  const router = express.Router();

  // Получить настройки подарочного ролла
  router.get("/settings", async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          trigger_sum AS "triggerSum",
          gift_product_id AS "giftProductId",
          is_active AS "isActive",
          weekdays_only AS "weekdaysOnly"
        FROM gift_roll_settings
        LIMIT 1
      `);

      return res.json(result.rows[0]);
    } catch (error) {
      return res.status(500).json({
        message: "Ошибка получения настроек подарка",
        error: error.message,
      });
    }
  });

  // Обновить настройки
  router.put("/settings", async (req, res) => {
    try {
      const { triggerSum, giftProductId, isActive, weekdaysOnly } = req.body;

      const result = await pool.query(
        `
        UPDATE gift_roll_settings
        SET
          trigger_sum = $1,
          gift_product_id = $2,
          is_active = $3,
          weekdays_only = $4,
          updated_at = NOW()
        RETURNING
          trigger_sum AS "triggerSum",
          gift_product_id AS "giftProductId",
          is_active AS "isActive",
          weekdays_only AS "weekdaysOnly"
        `,
        [
          Number(triggerSum) || 1000,
          giftProductId || null,
          isActive === true,
          weekdaysOnly !== false,
        ]
      );

      return res.json(result.rows[0]);
    } catch (error) {
      return res.status(500).json({
        message: "Ошибка обновления настроек подарка",
        error: error.message,
      });
    }
  });

  return router;
}
