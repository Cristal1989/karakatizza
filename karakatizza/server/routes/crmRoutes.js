import express from "express";
import { pool } from "../db.js";
import {
  issueTelegramGift,
  getActiveTelegramGiftByPhone,
  markTelegramGiftUsed,
  linkTelegramToCustomerByPhone,
  getTelegramGiftsByTelegramUserId,
  getTelegramCustomersForBroadcast,
  saveTelegramBroadcastHistory,
  getTelegramBroadcastHistory,
  getTelegramBroadcastCount,
} from "../services/crmService.js";
import { sendTelegramTextToUser, sendTelegramTextToMany } from "../bot.js";
import { normalizeUaPhone } from "../utils/phone.js";
import requireAdminAuth from "../middleware/requireAdminAuth.js";

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
        COALESCE(last_order_at, first_order_at, created_at) < NOW() - ($${paramIndex} * INTERVAL '1 day')
      `);
      values.push(Number(inactiveDays));
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
        DATE_PART('day', NOW() - COALESCE(last_order_at, first_order_at, created_at))::int AS inactive_days,
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
           OR phone = $2
           OR phone_normalized = $3
        ORDER BY created_at DESC, id DESC
      `,
      [
        customerId,
        customerResult.rows[0].phone,
        customerResult.rows[0].phone_normalized,
      ]
    );

    res.json({
      success: true,
      customer: customerResult.rows[0],
      orders: ordersResult.rows,
    });
  } catch (error) {
    console.error("CRM CUSTOMER ORDERS ERROR:", error);
    res.status(500).json({
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

router.post("/telegram/send-one", requireAdminAuth, async (req, res) => {
  try {
    const { telegramUserId, text } = req.body || {};

    if (!telegramUserId) {
      return res.status(400).json({
        success: false,
        message: "Потрібен telegramUserId",
      });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Потрібен текст повідомлення",
      });
    }

    const customerResult = await pool.query(
      `
        SELECT
          id,
          name,
          telegram_user_id
        FROM customers
        WHERE telegram_user_id = $1
        ORDER BY id DESC
        LIMIT 1
      `,
      [String(telegramUserId)]
    );

    const customer = customerResult.rows[0] || null;

    const result = await sendTelegramTextToUser(telegramUserId, text, {
      name: customer?.name || "",
    });

    return res.json({
      success: true,
      message: "Повідомлення відправлено",
      result,
    });
  } catch (error) {
    console.error("CRM TELEGRAM SEND ONE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Не вдалося відправити повідомлення",
      error: error?.message || "Unknown error",
    });
  }
});

router.post("/telegram/send-broadcast", requireAdminAuth, async (req, res) => {
  try {
    const {
      text,
      search = "",
      orderType = "all",
      inactiveDays = "",
      minTotalSpent = "",
      minLastOrderAmount = "",
    } = req.body || {};

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Потрібен текст повідомлення",
      });
    }

    const customers = await getTelegramCustomersForBroadcast(pool, {
      search,
      orderType,
      telegram: "with",
      inactiveDays,
      minTotalSpent,
      minLastOrderAmount,
    });

    const sendResults = await sendTelegramTextToMany(customers, text);

    const sentCount = sendResults.filter((item) => item.success).length;
    const failedCount = sendResults.filter((item) => !item.success).length;

    const filters = {
      search,
      orderType,
      inactiveDays,
      minTotalSpent,
      minLastOrderAmount,
    };

    await saveTelegramBroadcastHistory(pool, {
      text,
      filters,
      recipientsCount: customers.length,
      sentCount,
      failedCount,
      results: sendResults,
    });

    return res.json({
      success: true,
      total: customers.length,
      sentCount,
      failedCount,
      results: sendResults,
    });
  } catch (error) {
    console.error("CRM TELEGRAM BROADCAST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Не вдалося виконати розсилку",
      error: error?.message || "Unknown error",
    });
  }
});

router.post("/telegram/broadcast-count", requireAdminAuth, async (req, res) => {
  try {
    const {
      search = "",
      orderType = "all",
      inactiveDays = "",
      minTotalSpent = "",
      minLastOrderAmount = "",
    } = req.body || {};

    const count = await getTelegramBroadcastCount(pool, {
      search,
      orderType,
      inactiveDays,
      minTotalSpent,
      minLastOrderAmount,
    });

    return res.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("CRM TELEGRAM BROADCAST COUNT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Не вдалося порахувати отримувачів розсилки",
      error: error?.message || "Unknown error",
    });
  }
});

router.get("/telegram/broadcast-history", requireAdminAuth, async (req, res) => {
  try {
    const limit = Number(req.query.limit || 20);

    const items = await getTelegramBroadcastHistory(pool, limit);

    return res.json({
      success: true,
      items,
    });
  } catch (error) {
    console.error("CRM TELEGRAM BROADCAST HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Не вдалося отримати історію розсилок",
      error: error?.message || "Unknown error",
    });
  }
});

router.get("/telegram/customer/:telegramUserId", async (req, res) => {
  
  try {
    const { telegramUserId } = req.params;

    if (!telegramUserId) {
      return res.status(400).json({
        success: false,
        message: "Потрібен telegramUserId",
      });
    }

    const result = await pool.query(
      `
        SELECT
          id,
          name,
          phone,
          telegram_user_id,
          telegram_username,
          telegram_first_name,
          is_telegram_subscribed,
          is_phone_confirmed
        FROM customers
        WHERE telegram_user_id = $1
        ORDER BY id DESC
        LIMIT 1
      `,
      [String(telegramUserId)]
    );
    console.log("CRM TELEGRAM CUSTOMER LOOKUP", {
      telegramUserId,
      found: Boolean(result.rows[0]),
      customer: result.rows[0] || null,
    });

    return res.json({
      success: true,
      customer: result.rows[0] || null,
    });
  } catch (error) {
    console.error("CRM TELEGRAM CUSTOMER BY USER ID ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Не вдалося отримати клієнта Telegram",
      error: error?.message || "Unknown error",
    });
  }
});

router.post("/telegram-gifts/issue-test", requireAdminAuth, async (req, res) => {
  try {
    const {
      customerId = null,
      phone = "",
      giftRollId = "telegram-test-bonus",
      giftRollTitle = "Тестовий бонус",
      comment = "Manual test bonus",
    } = req.body || {};

    const phoneNormalized = normalizeUaPhone(phone);

    if (!phoneNormalized) {
      return res.status(400).json({
        success: false,
        message: "Потрібен коректний номер телефону",
      });
    }

    let resolvedCustomerId = customerId ? Number(customerId) : null;

    if (!resolvedCustomerId) {
      const customerResult = await pool.query(
        `
          SELECT id
          FROM customers
          WHERE phone_normalized = $1
          LIMIT 1
        `,
        [phoneNormalized]
      );

      if (!customerResult.rows.length) {
        return res.status(404).json({
          success: false,
          message: "Клієнта з таким номером не знайдено",
        });
      }

      resolvedCustomerId = customerResult.rows[0].id;
    }

    const activeResult = await pool.query(
      `
        SELECT
          id,
          customer_id,
          phone_normalized,
          gift_roll_id,
          gift_roll_title,
          status,
          source,
          comment,
          issued_at,
          used_at,
          created_at,
          updated_at
        FROM telegram_gifts
        WHERE phone_normalized = $1
          AND status = 'issued'
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [phoneNormalized]
    );

    if (activeResult.rows.length) {
      return res.json({
        success: true,
        created: false,
        reason: "active_gift_exists",
        gift: activeResult.rows[0],
      });
    }

    const insertResult = await pool.query(
      `
        INSERT INTO telegram_gifts (
          customer_id,
          phone_normalized,
          gift_roll_id,
          gift_roll_title,
          status,
          source,
          comment,
          issued_at,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, 'issued', 'telegram', $5, NOW(), NOW(), NOW())
        RETURNING
          id,
          customer_id,
          phone_normalized,
          gift_roll_id,
          gift_roll_title,
          status,
          source,
          comment,
          issued_at,
          used_at,
          created_at,
          updated_at
      `,
      [
        resolvedCustomerId,
        phoneNormalized,
        giftRollId || "telegram-test-bonus",
        giftRollTitle || "Тестовий бонус",
        comment || "Manual test bonus",
      ]
    );

    return res.json({
      success: true,
      created: true,
      gift: insertResult.rows[0],
    });
  } catch (error) {
    console.error("ISSUE TEST TELEGRAM GIFT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Не вдалося видати тестовий бонус",
      error: error?.message || "Unknown error",
    });
  }
});

router.post("/telegram-gifts/use-active", async (req, res) => {
  try {
    const { phone = "" } = req.body || {};

    const phoneNormalized = normalizeUaPhone(phone);

    if (!phoneNormalized) {
      return res.status(400).json({
        success: false,
        message: "Потрібен коректний номер телефону",
      });
    }

    const activeResult = await pool.query(
      `
        SELECT id
        FROM telegram_gifts
        WHERE phone_normalized = $1
          AND status = 'issued'
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [phoneNormalized]
    );

    if (!activeResult.rows.length) {
      return res.json({
        success: true,
        updated: false,
        message: "Активного бонусу для цього номера немає",
      });
    }

    const giftId = activeResult.rows[0].id;

    const updateResult = await pool.query(
      `
        UPDATE telegram_gifts
        SET
          status = 'used',
          used_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
        RETURNING
          id,
          customer_id,
          phone_normalized,
          gift_roll_id,
          gift_roll_title,
          status,
          source,
          comment,
          issued_at,
          used_at,
          created_at,
          updated_at
      `,
      [giftId]
    );

    return res.json({
      success: true,
      updated: true,
      gift: updateResult.rows[0],
    });
  } catch (error) {
    console.error("USE ACTIVE TELEGRAM GIFT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Не вдалося списати активний бонус",
      error: error?.message || "Unknown error",
    });
  }
});

router.get("/telegram-checkout-status/:phone", async (req, res) => {
  try {
    const rawPhone = req.params.phone || "";
    const phoneNormalized = normalizeUaPhone(rawPhone);

    if (!phoneNormalized) {
      return res.json({
        success: true,
        phoneNormalized: null,
        hasCustomer: false,
        telegramLinked: false,
        activeGift: null,
      });
    }

    const customerResult = await pool.query(
      `
        SELECT
          id,
          name,
          phone,
          phone_normalized,
          telegram_user_id,
          telegram_username,
          telegram_first_name,
          is_telegram_subscribed,
          is_phone_confirmed
        FROM customers
        WHERE phone_normalized = $1
        LIMIT 1
      `,
      [phoneNormalized]
    );

    const customer = customerResult.rows[0] || null;
    const telegramLinked = Boolean(customer?.telegram_user_id);

    let activeGift = null;

    try {
      activeGift = await getActiveTelegramGiftByPhone(pool, phoneNormalized);
    } catch (giftError) {
      console.error("CHECKOUT ACTIVE GIFT ERROR:", giftError);
    }

    return res.json({
      success: true,
      phoneNormalized,
      hasCustomer: Boolean(customer),
      telegramLinked,
      customer: customer
        ? {
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            telegramUsername: customer.telegram_username,
            telegramFirstName: customer.telegram_first_name,
            isTelegramSubscribed: customer.is_telegram_subscribed === true,
            isPhoneConfirmed: customer.is_phone_confirmed === true,
          }
        : null,
      activeGift: activeGift
        ? {
            id: activeGift.id,
            giftRollId: activeGift.gift_roll_id,
            giftRollTitle: activeGift.gift_roll_title,
            comment: activeGift.comment,
            status: activeGift.status,
            source: activeGift.source,
            issuedAt: activeGift.issued_at,
          }
        : null,
    });
  } catch (error) {
    console.error("TELEGRAM CHECKOUT STATUS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Не вдалося отримати статус Telegram для checkout",
      error: error?.message || "Unknown error",
    });
  }
});

router.get("/telegram-gifts/history/:phone",  async (req, res) => {
  try {
    const rawPhone = req.params.phone || "";
    const phoneNormalized = normalizeUaPhone(rawPhone);

    if (!phoneNormalized) {
      return res.json({
        success: true,
        gifts: [],
      });
    }

    const result = await pool.query(
      `
        SELECT
          id,
          customer_id,
          phone_normalized,
          gift_roll_id,
          gift_roll_title,
          status,
          source,
          comment,
          issued_at,
          used_at,
          created_at,
          updated_at
        FROM telegram_gifts
        WHERE phone_normalized = $1
        ORDER BY created_at DESC, id DESC
      `,
      [phoneNormalized]
    );

    return res.json({
      success: true,
      gifts: result.rows,
    });
  } catch (error) {
    console.error("TELEGRAM GIFTS HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Не вдалося отримати історію бонусів",
      error: error?.message || "Unknown error",
    });
  }
});

router.get("/customers/:id/bonus-history", async (req, res) => {
  try {
    const customerId = Number(req.params.id);

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Некоректний ID клієнта",
      });
    }

    const result = await pool.query(
      `
        SELECT
          id,
          customer_id,
          phone_normalized,
          gift_roll_id,
          gift_roll_title,
          status,
          source,
          comment,
          issued_at,
          used_at,
          created_at,
          updated_at
        FROM telegram_gifts
        WHERE customer_id = $1
        ORDER BY created_at DESC, id DESC
      `,
      [customerId]
    );

    return res.json({
      success: true,
      gifts: result.rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Не вдалося завантажити історію бонусів",
      error: error?.message || "Unknown error",
    });
  }
});

router.post("/telegram/reset-test-user", requireAdminAuth, async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Не вказано номер телефону",
      });
    }

    const phoneNormalized = normalizeUaPhone(phone);

    if (!phoneNormalized) {
      return res.status(400).json({
        success: false,
        message: "Некоректний номер телефону",
      });
    }

    const clientResult = await pool.query(
      `
      UPDATE customers
      SET
        telegram_user_id = NULL,
        telegram_username = NULL,
        telegram_first_name = NULL,
        is_telegram_subscribed = false,
        is_phone_confirmed = false,
        updated_at = NOW()
      WHERE phone_normalized = $1
         OR phone = $2
      RETURNING id, name, phone, phone_normalized
      `,
      [phoneNormalized, phone]
    );

    await pool.query(
      `
      DELETE FROM telegram_gifts
      WHERE phone_normalized = $1
      `,
      [phoneNormalized]
    );

    return res.json({
      success: true,
      message: "Тестові дані користувача скинуто",
      customer: clientResult.rows[0] || null,
    });
  } catch (error) {
    console.error("RESET TEST USER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Помилка скидання тестових даних",
    });
  }
});

export default router;
