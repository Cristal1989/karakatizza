import express from "express";
import { pool } from "../db.js";

const router = express.Router();

function requireSmmToken(req, res, next) {
  const configuredToken = process.env.SMM_CONTEXT_TOKEN;

  if (!configuredToken) {
    return res.status(500).json({
      message: "SMM_CONTEXT_TOKEN is not configured",
    });
  }

  const authHeader = req.headers.authorization || "";
  const expected = `Bearer ${configuredToken}`;

  if (authHeader !== expected) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  next();
}

router.get("/context", requireSmmToken, async (req, res) => {
  try {
    const [
      productsResult,
      settingsResult,
      promotionResult,
      giftRollResult,
    ] = await Promise.all([
      pool.query(`
        SELECT
          id,
          name,
          price,
          old_price AS "oldPrice",
          category,
          description,
          image,
          weight,
          popular,
          promo_type AS "promoType",
          priority,
          discount_offer_eligible AS "discountOfferEligible",
          free_soy_sauce AS "freeSoySauce",
          free_ginger AS "freeGinger",
          free_wasabi AS "freeWasabi",
          is_visible AS "isVisible",
          is_hit AS "isHit",
          is_new AS "isNew",
          is_weekly_offer AS "isWeeklyOffer",
          roll_type AS "rollType"
        FROM products
        WHERE is_visible = true
        ORDER BY priority ASC, created_at ASC
      `),

      pool.query(`
        SELECT
          opening_time,
          closing_time,
          allow_orders_after_hours,
          enable_after_hours_popup,
          closed_all_day,
          closed_all_day_date,
          popup_message,
          closed_all_day_message,
          pickup_address,
          instagram_link,
          telegram_link,
          delivery_enabled,
          pickup_enabled,
          pickup_discount_percent,
          delivery_text,
          pickup_text,
          shop_address,
          delivery_zones,
          telegram_promo_title,
          telegram_promo_text
        FROM site_settings
        WHERE id = 1
        LIMIT 1
      `),

      pool.query(`
        SELECT
          discount_percent AS "discountPercent",
          trigger_sum AS "triggerSum",
          is_active AS "isActive"
        FROM promotion_settings
        LIMIT 1
      `),

      pool.query(`
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
      `),
    ]);

    const settings = settingsResult.rows[0] || {};
    const promotion = promotionResult.rows[0] || null;
    const giftRoll = giftRollResult.rows[0] || null;

    const products = productsResult.rows.map((product) => ({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      oldPrice:
        product.oldPrice !== null && product.oldPrice !== undefined
          ? Number(product.oldPrice)
          : null,
      category: product.category,
      description: product.description || "",
      image: product.image || "",
      weight: product.weight || "",
      popular: product.popular === true,
      promoType: product.promoType || "none",
      priority: Number(product.priority ?? 10),
      discountOfferEligible: product.discountOfferEligible === true,
      freeSoySauce: Number(product.freeSoySauce || 0),
      freeGinger: Number(product.freeGinger || 0),
      freeWasabi: Number(product.freeWasabi || 0),
      isVisible: product.isVisible === true,
      isHit: product.isHit === true,
      isNew: product.isNew === true,
      isWeeklyOffer: product.isWeeklyOffer === true,
      rollType: product.rollType || "",
    }));

    return res.json({
      meta: {
        generatedAt: new Date().toISOString(),
        timezone: "Europe/Kyiv",
        currency: "UAH",
      },

      brand: {
        name: "Karakatizza",
        websiteUrl: "https://karakatizza.com",
        orderUrl: "https://karakatizza.com",
        instagramUrl: settings.instagram_link || null,
        telegramUrl: settings.telegram_link || null,
      },

      workingState: {
        openingTime: settings.opening_time || null,
        closingTime: settings.closing_time || null,
        allowOrdersAfterHours: settings.allow_orders_after_hours === true,
        closedAllDay: settings.closed_all_day === true,
        closedAllDayDate: settings.closed_all_day_date || null,
        showAfterHoursPopup: settings.enable_after_hours_popup === true,
        popupMessage: settings.popup_message || "",
        closedAllDayMessage: settings.closed_all_day_message || "",
      },

      ordering: {
        deliveryEnabled: settings.delivery_enabled === true,
        pickupEnabled: settings.pickup_enabled === true,
        pickupDiscountPercent: Number(settings.pickup_discount_percent ?? 0),
        pickupAddress:
          settings.pickup_address || settings.shop_address || "",
        deliveryText: settings.delivery_text || "",
        pickupText: settings.pickup_text || "",
        deliveryZones: Array.isArray(settings.delivery_zones)
          ? settings.delivery_zones
          : [],
      },

      products,

      promotions: {
        discountOffer: promotion
          ? {
              isActive: promotion.isActive === true,
              discountPercent: Number(promotion.discountPercent ?? 0),
              triggerSum: Number(promotion.triggerSum ?? 0),
            }
          : null,

        giftRoll: giftRoll
          ? {
              isActive: giftRoll.isActive === true,
              triggerSum: Number(giftRoll.triggerSum ?? 0),
              giftProductId: giftRoll.giftProductId || null,
              weekdaysOnly: giftRoll.weekdaysOnly === true,
              bonusType: giftRoll.bonusType || null,
              bonusTitle: giftRoll.bonusTitle || "",
              bonusDescription: giftRoll.bonusDescription || "",
              bonusImage: giftRoll.bonusImage || "",
              discountPercent:
                giftRoll.discountPercent !== null &&
                giftRoll.discountPercent !== undefined
                  ? Number(giftRoll.discountPercent)
                  : null,
              customText: giftRoll.customText || "",
              updatedAt: giftRoll.updatedAt || null,
            }
          : null,

        telegramPromo: {
          title: settings.telegram_promo_title || "",
          text: settings.telegram_promo_text || "",
        },
      },
    });
  } catch (error) {
    console.error("GET /api/smm/context ERROR:", error);

    return res.status(500).json({
      message: "Не вдалося отримати SMM context",
      error: error?.message || "Unknown error",
    });
  }
});

export default router;
