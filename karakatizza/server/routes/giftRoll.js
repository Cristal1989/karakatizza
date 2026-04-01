import express from "express";

export default function giftRollRoutes(pool) {
  const router = express.Router();

  // Получить настройки welcome-бонуса / подарочного ролла
  router.get("/settings", async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          trigger_sum AS "triggerSum",
          gift_product_id AS "giftProductId",
          is_active AS "isActive",
          weekdays_only AS "weekdaysOnly",

          bonus_type AS "bonusType",
          bonus_title AS "bonusTitle",
          bonus_description AS "bonusDescription",
          bonus_image AS "bonusImage",
          discount_percent AS "discountPercent",
          custom_text AS "customText",

          updated_at AS "updatedAt"
        FROM gift_roll_settings
        LIMIT 1
      `);

      const row = result.rows[0];

      if (!row) {
        return res.json({
          triggerSum: 1000,
          giftProductId: "",
          isActive: true,
          weekdaysOnly: true,

          bonusType: "gift_product",
          bonusTitle: "",
          bonusDescription: "",
          bonusImage: "",
          discountPercent: "",
          customText: "",

          updatedAt: null,
        });
      }

      return res.json({
        triggerSum: row.triggerSum ?? 1000,
        giftProductId: row.giftProductId ?? "",
        isActive: row.isActive ?? true,
        weekdaysOnly: row.weekdaysOnly ?? true,

        bonusType: row.bonusType || "gift_product",
        bonusTitle: row.bonusTitle || "",
        bonusDescription: row.bonusDescription || "",
        bonusImage: row.bonusImage || "",
        discountPercent:
          row.discountPercent === null || row.discountPercent === undefined
            ? ""
            : String(row.discountPercent),
        customText: row.customText || "",

        updatedAt: row.updatedAt || null,
      });
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
      const {
        triggerSum,
        giftProductId,
        isActive,
        weekdaysOnly,

        bonusType = "gift_product",
        bonusTitle = "",
        bonusDescription = "",
        bonusImage = "",
        discountPercent = "",
        customText = "",
      } = req.body;

      const normalizedDiscountPercent =
        discountPercent === "" || discountPercent === null || discountPercent === undefined
          ? null
          : Number(discountPercent);

      const result = await pool.query(
        `
          UPDATE gift_roll_settings
          SET
            trigger_sum = $1,
            gift_product_id = $2,
            is_active = $3,
            weekdays_only = $4,

            bonus_type = $5,
            bonus_title = $6,
            bonus_description = $7,
            bonus_image = $8,
            discount_percent = $9,
            custom_text = $10,

            updated_at = NOW()
          RETURNING
            trigger_sum AS "triggerSum",
            gift_product_id AS "giftProductId",
            is_active AS "isActive",
            weekdays_only AS "weekdaysOnly",

            bonus_type AS "bonusType",
            bonus_title AS "bonusTitle",
            bonus_description AS "bonusDescription",
            bonus_image AS "bonusImage",
            discount_percent AS "discountPercent",
            custom_text AS "customText",

            updated_at AS "updatedAt"
        `,
        [
          Number(triggerSum) || 1000,
          giftProductId || null,
          isActive !== false,
          weekdaysOnly !== false,

          bonusType || "gift_product",
          bonusTitle || "",
          bonusDescription || "",
          bonusImage || "",
          normalizedDiscountPercent,
          customText || "",
        ]
      );

      const row = result.rows[0];

      return res.json({
        triggerSum: row.triggerSum ?? 1000,
        giftProductId: row.giftProductId ?? "",
        isActive: row.isActive ?? true,
        weekdaysOnly: row.weekdaysOnly ?? true,

        bonusType: row.bonusType || "gift_product",
        bonusTitle: row.bonusTitle || "",
        bonusDescription: row.bonusDescription || "",
        bonusImage: row.bonusImage || "",
        discountPercent:
          row.discountPercent === null || row.discountPercent === undefined
            ? ""
            : String(row.discountPercent),
        customText: row.customText || "",

        updatedAt: row.updatedAt || null,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Ошибка обновления настроек подарка",
        error: error.message,
      });
    }
  });

  return router;
}