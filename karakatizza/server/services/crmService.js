import { normalizeUaPhone } from "../utils/phone.js";

function buildItemsSummary(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return "";
  }

  return items
    .map((item) => {
      const name = item?.name || "Товар";
      const qty = Number(item?.paidQuantity ?? item?.quantity ?? 0) || 0;
      const freeQty = Number(item?.freeQuantity ?? 0) || 0;

      if (freeQty > 0) {
        return `${name} x${qty} + ${freeQty} подарунок`;
      }

      return `${name} x${qty}`;
    })
    .join(", ");
}

export async function findOrCreateCustomer(pool, { phone, name, totalAmount }) {
  const phoneNormalized = normalizeUaPhone(phone);

  if (!phoneNormalized) {
    throw new Error("Некоректний номер телефону");
  }

  const existingResult = await pool.query(
    `
    SELECT *
    FROM customers
    WHERE phone_normalized = $1
    LIMIT 1
    `,
    [phoneNormalized]
  );

  const now = new Date();

  if (existingResult.rows.length > 0) {
    const customer = existingResult.rows[0];

    const updatedResult = await pool.query(
      `
      UPDATE customers
      SET
        phone = $1,
        name = CASE
          WHEN COALESCE($2, '') <> '' THEN $2
          ELSE name
        END,
        last_order_at = $3,
        orders_count = COALESCE(orders_count, 0) + 1,
        total_spent = COALESCE(total_spent, 0) + $4,
        last_order_amount = $4,
        updated_at = $3
      WHERE id = $5
      RETURNING *
      `,
      [
        phone,
        String(name || "").trim(),
        now,
        Number(totalAmount || 0),
        customer.id,
      ]
    );

    return updatedResult.rows[0];
  }

  const insertResult = await pool.query(
    `
    INSERT INTO customers (
      phone,
      phone_normalized,
      name,
      first_order_at,
      last_order_at,
      orders_count,
      total_spent,
      last_order_amount,
      created_at,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $4, 1, $5, $5, $4, $4)
    RETURNING *
    `,
    [
      phone,
      phoneNormalized,
      String(name || "").trim(),
      now,
      Number(totalAmount || 0),
    ]
  );

  return insertResult.rows[0];
}

export async function saveOrderToCrm(pool, orderData) {
  const {
    phone,
    name,
    mode,
    address,
    resolvedAddress,
    entrance,
    comment,
    paymentMethod,
    needExactTime,
    exactTime,
    totalPrice,
    items,
    condiments,
    regularSticksCount,
    trainingSticksCount,
    sticksExtraPrice,
  } = orderData;

  const customer = await findOrCreateCustomer(pool, {
    phone,
    name,
    totalAmount: totalPrice,
  });

  const phoneNormalized = normalizeUaPhone(phone);
  const itemsSummary = buildItemsSummary(items);

  const result = await pool.query(
    `
    INSERT INTO orders (
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
      source
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
      $11, $12, $13, $14::jsonb, $15, $16::jsonb, $17, $18, $19, 'new', 'site'
    )
    RETURNING *
    `,
    [
      customer.id,
      phone,
      phoneNormalized,
      String(name || "").trim(),
      mode || "delivery",
      address || "",
      resolvedAddress || "",
      entrance || "",
      comment || "",
      paymentMethod || "cash",
      needExactTime === true,
      exactTime || "",
      Number(totalPrice || 0),
      JSON.stringify(items || []),
      itemsSummary,
      JSON.stringify(condiments || {}),
      Number(regularSticksCount || 0),
      Number(trainingSticksCount || 0),
      Number(sticksExtraPrice || 0),
    ]
  );

  return {
    customer,
    order: result.rows[0],
  };
}

export async function getActiveTelegramGiftByPhone(pool, phone) {
  const phoneNormalized = normalizeUaPhone(phone);

  if (!phoneNormalized) {
    return null;
  }

  const result = await pool.query(
    `
      SELECT
        tg.id,
        tg.customer_id,
        tg.phone_normalized,
        tg.gift_roll_id,
        tg.gift_roll_title,
        tg.status,
        tg.source,
        tg.comment,
        tg.issued_at,
        tg.used_at,
        tg.created_at,
        tg.updated_at
      FROM telegram_gifts tg
      WHERE tg.phone_normalized = $1
        AND tg.status IN ('issued', 'reserved')
      ORDER BY tg.created_at DESC, tg.id DESC
      LIMIT 1
    `,
    [phoneNormalized]
  );

  return result.rows[0] || null;
}

export async function issueTelegramGift(
  pool,
  { customerId = null, phone, giftRollId = "", giftRollTitle = "", comment = "" }
) {
  const phoneNormalized = normalizeUaPhone(phone);

  if (!phoneNormalized) {
    throw new Error("Некоректний номер телефону для telegram gift");
  }

  const existingGift = await getActiveTelegramGiftByPhone(pool, phoneNormalized);

  if (existingGift) {
    return {
      created: false,
      gift: existingGift,
      reason: "active_gift_exists",
    };
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
        comment
      )
      VALUES ($1, $2, $3, $4, 'issued', 'telegram', $5)
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
      customerId || null,
      phoneNormalized,
      giftRollId || "",
      giftRollTitle || "",
      comment || "",
    ]
  );

  return {
    created: true,
    gift: insertResult.rows[0],
    reason: "created",
  };
}

export async function markTelegramGiftUsed(pool, giftId) {
  const result = await pool.query(
    `
      UPDATE telegram_gifts
      SET
        status = 'used',
        used_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
        AND status IN ('issued', 'reserved')
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

  return result.rows[0] || null;
}

export async function linkTelegramToCustomerByPhone(
  pool,
  {
    phone,
    telegramUserId,
    telegramUsername = "",
    telegramFirstName = "",
  }
) {
  const phoneNormalized = normalizeUaPhone(phone);

  if (!phoneNormalized) {
    throw new Error("Некоректний номер телефону");
  }

  if (!telegramUserId) {
    throw new Error("Відсутній telegramUserId");
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
        last_order_amount,
        created_at,
        updated_at
      FROM customers
      WHERE phone_normalized = $1
      ORDER BY id DESC
      LIMIT 1
    `,
    [phoneNormalized]
  );

  const customer = customerResult.rows[0] || null;

  if (!customer) {
    return {
      linked: false,
      reason: "customer_not_found",
      customer: null,
    };
  }

  const updatedResult = await pool.query(
    `
      UPDATE customers
      SET
        telegram_user_id = $1,
        telegram_username = $2,
        telegram_first_name = $3,
        is_telegram_subscribed = TRUE,
        is_phone_confirmed = TRUE,
        updated_at = NOW()
      WHERE id = $4
      RETURNING
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
        updated_at
    `,
    [
      String(telegramUserId),
      telegramUsername || "",
      telegramFirstName || "",
      customer.id,
    ]
  );

  return {
    linked: true,
    reason: "linked",
    customer: updatedResult.rows[0] || customer,
  };
}