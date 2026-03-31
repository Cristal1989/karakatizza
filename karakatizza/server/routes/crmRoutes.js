import express from "express";
import { pool } from "../db.js";
import {
  issueTelegramGift,
  getActiveTelegramGiftByPhone,
  markTelegramGiftUsed,
  linkTelegramToCustomerByPhone,
  getTelegramGiftsByTelegramUserId
} from "../services/crmService.js";

const router = express.Router();

router.get("/customers", async (req, res) => {
  try {
    const {
      search = "",
      orderType = "all",
      telegram = "all",
      inactiveDays = "",
      minTotalSpent = "",
      minLastOrderAmount = "",
    } = req.query;

    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (search.trim()) {
      conditions.push(`
        (
          phone ILIKE $${paramIndex}
          OR phone_normalized ILIKE $${paramIndex}
          OR name ILIKE $${paramIndex}
        )
      `);
      values.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (orderType === "first") {
      conditions.push(`orders_count = 1`);
    }

    if (orderType === "repeat") {
      conditions.push(`orders_count > 1`);
    }

    if (telegram === "yes") {
      conditions.push(`is_telegram_subscribed = true`);
    }

    if (telegram === "no") {
      conditions.push(`is_telegram_subscribed = false`);
    }

    if (inactiveDays && !Number.isNaN(Number(inactiveDays))) {
      conditions.push(`
        last_order_at IS NOT NULL
        AND last_order_at < NOW() - ($${paramIndex} || ' days')::interval
      `);
      values.push(String(Number(inactiveDays)));
      paramIndex++;
    }

    if (minTotalSpent && !Number.isNaN(Number(minTotalSpent))) {
      conditions.push(`total_spent >= $${paramIndex}`);
      values.push(Number(minTotalSpent));
      paramIndex++;
    }
    
    if (minLastOrderAmount && !Number.isNaN(Number(minLastOrderAmount))) {
      conditions.push(`last_order_amount >= $${paramIndex}`);
      values.push(Number(minLastOrderAmount));
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";


    const result = await pool.query(
      `
      SELECT
        id,
        phone,
        phone_normalized,
        name,
        telegram_user_id,
        telegram_username,
        telegram_first_name,
        is_telegram_subscribed,
        is_phone_confirmed,
        first_order_at,
        last_order_at,
        orders_count,
        total_spent,
        last_order_amount,
        created_at,
        updated_at,
        CASE
          WHEN orders_count > 0
            THEN ROUND((total_spent / orders_count)::numeric, 2)
          ELSE 0
        END AS avg_check
      FROM customers
      ${whereClause}
      ORDER BY last_order_at DESC NULLS LAST, id DESC
      `,
      values
    );

    res.json({
      success: true,
      customers: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      message: "Помилка завантаження клієнтів",
      error: error?.message || "Unknown error",
    });
  }
});

router.get("/customers/:id/orders", async (req, res) => {
  try {
    const customerId = Number(req.params.id);

    if (!customerId) {
      return res.status(400).json({
        message: "Некоректний ID клієнта",
      });
    }

    const customerResult = await pool.query(
      `
      SELECT
        id,
        phone,
        phone_normalized,
        name,
        telegram_user_id,
        telegram_username,
        telegram_first_name,
        is_telegram_subscribed,
        is_phone_confirmed,
        first_order_at,
        last_order_at,
        orders_count,
        total_spent,
        last_order_amount
      FROM customers
      WHERE id = $1
      LIMIT 1
      `,
      [customerId]
    );

    if (customerResult.rows.length === 0) {
      return res.status(404).json({
        message: "Клієнта не знайдено",
      });
    }

    const ordersResult = await pool.query(
      `
      SELECT
        id,
        customer_id,
        phone,
        phone_normalized,
        name,
        mode,
        address,
        resolved_address,
        entrance,
        comment,
        payment_method,
        need_exact_time,
        exact_time,
        total_amount,
        items_json,
        items_summary,
        condiments_json,
        regular_sticks_count,
        training_sticks_count,
        sticks_extra_price,
        status,
        source,
        gift_roll_applied,
        gift_roll_id,
        gift_roll_title,
        created_at
      FROM orders
      WHERE customer_id = $1
      ORDER BY created_at DESC, id DESC
      `,
      [customerId]
    );

    res.json({
      success: true,
      customer: customerResult.rows[0],
      orders: ordersResult.rows,
    });
  } catch (error) {
    console.error("CRM CUSTOMER ORDERS ERROR:", error);
    res.
      status(500).json({
      message: "Помилка завантаження замовлень клієнта",
    });
  }
});

router.get("/telegram-gifts/active/:phone", async (req, res) => {
  try {
    const { phone } = req.params;

    const gift = await getActiveTelegramGiftByPhone(pool, phone);

    return res.json({
      success: true,
      gift: gift || null,
    });
  } catch (error) {
    console.error("CRM TELEGRAM GIFT ACTIVE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Не вдалося отримати активний подарунок",
      error: error?.message || "Unknown error",
    });
  }
});

router.post("/telegram-gifts/issue", async (req, res) => {
  try {
    const {
      customerId = null,
      phone,
      giftRollId = "",
      giftRollTitle = "",
      comment = "",
    } = req.body || {};

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Потрібен номер телефону",
      });
    }

    const result = await issueTelegramGift(pool, {
      customerId,
      phone,
      giftRollId,
      giftRollTitle,
      comment,
    });

    return res.json({
      success: true,
      created: result.created,
      reason: result.reason,
      gift: result.gift || null,
    });
  } catch (error) {
    console.error("CRM TELEGRAM GIFT ISSUE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Не вдалося видати telegram-подарунок",
      error: error?.message || "Unknown error",
    });
  }
});

router.post("/telegram-gifts/use", async (req, res) => {
  try {
    const { giftId } = req.body || {};

    if (!giftId) {
      return res.status(400).json({
        success: false,
        message: "Потрібен giftId",
      });
    }

    const gift = await markTelegramGiftUsed(pool, giftId);

    if (!gift) {
      return res.status(404).json({
        success: false,
        message: "Активний подарунок не знайдено або вже використаний",
      });
    }

    return res.json({
      success: true,
      gift,
    });
  } catch (error) {
    console.error("CRM TELEGRAM GIFT USE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Не вдалося списати telegram-подарунок",
      error: error?.message || "Unknown error",
    });
  }
});

router.post("/telegram/link", async (req, res) => {
  try {
    const {
      phone,
      telegramUserId,
      telegramUsername = "",
      telegramFirstName = "",
    } = req.body || {};

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Потрібен номер телефону",
      });
    }

    if (!telegramUserId) {
      return res.status(400).json({
        success: false,
        message: "Потрібен telegramUserId",
      });
    }

    const result = await linkTelegramToCustomerByPhone(pool, {
      phone,
      telegramUserId,
      telegramUsername,
      telegramFirstName,
    });

    if (!result.linked) {
      return res.status(404).json({
        success: false,
        reason: result.reason,
        message: "Клієнта з таким номером не знайдено",
        customer: null,
      });
    }

    return res.json({
      success: true,
      linked: true,
      reason: result.reason,
      customer: result.customer,
    });
  } catch (error) {
    console.error("CRM TELEGRAM LINK ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Не вдалося прив'язати Telegram до клієнта",
      error: error?.message || "Unknown error",
    });
  }
});

router.get("/telegram/bonus/:telegramUserId", async (req, res) => {
  try {
    const { telegramUserId } = req.params;

    if (!telegramUserId) {
      return res.status(400).json({
        success: false,
        message: "Потрібен telegramUserId",
      });
    }

    const result = await getTelegramGiftsByTelegramUserId(pool, telegramUserId);

    const activeGift =
      result.gifts.find((gift) => gift.status === "issued") || null;

    const usedGift =
      result.gifts.find((gift) => gift.status === "used") || null;

    return res.json({
      success: true,
      customer: result.customer,
      activeGift,
      usedGift,
      gifts: result.gifts,
    });
  } catch (error) {
    console.error("CRM TELEGRAM BONUS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Не вдалося отримати дані по бонусу",
      error: error?.message || "Unknown error",
    });
  }
});

export default router;