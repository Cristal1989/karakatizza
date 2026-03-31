import express from "express";
import { pool } from "../db.js";

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

export default router;