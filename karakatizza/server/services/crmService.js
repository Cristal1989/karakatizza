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
    telegramBonusMeta,
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
        source,
        telegram_bonus_meta
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14::jsonb, $15, $16::jsonb, $17, $18, $19, 'new', 'site', $20::jsonb
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
      JSON.stringify(telegramBonusMeta || null),
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
        tg.updated_at,
        tg.available_after_orders_count
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
  {
    customerId = null,
    phone,
    giftRollId = "",
    giftRollTitle = "",
    comment = "",
  }
) {
  const phoneNormalized = normalizeUaPhone(phone);

  if (!phoneNormalized) {
    throw new Error("Некоректний номер телефону");
  }

  const existingAnyGiftResult = await pool.query(
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
        AND source = 'telegram'
      ORDER BY created_at DESC, id DESC
      LIMIT 1
    `,
    [phoneNormalized]
  );

  const existingAnyGift = existingAnyGiftResult.rows[0] || null;

  if (existingAnyGift) {
    return {
      success: true,
      created: false,
      reason: "welcome_gift_already_issued",
      gift: existingAnyGift,
    };
  }

  let availableAfterOrdersCount = null;

  const normalizedGiftRollId = String(giftRollId || "").trim();

  let currentOrdersCount = 0;

  if (customerId) {
    const customerOrdersResult = await pool.query(
      `
      SELECT orders_count
      FROM customers
      WHERE id = $1
      LIMIT 1
    `,
      [Number(customerId)]
    );

    const customerRow = customerOrdersResult.rows[0] || null;
    currentOrdersCount = Number(customerRow?.orders_count || 0);
  }

  if (normalizedGiftRollId === "telegram-welcome") {
    availableAfterOrdersCount = currentOrdersCount + 1;
  } else if (customerId) {
    availableAfterOrdersCount = currentOrdersCount;
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
      available_after_orders_count,
      issued_at,
      used_at,
      created_at,
      updated_at
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      'issued',
      'telegram',
      $5,
      $6,
      NOW(),
      NULL,
      NOW(),
      NOW()
    )
    RETURNING
      id,
      customer_id,
      phone_normalized,
      gift_roll_id,
      gift_roll_title,
      status,
      source,
      comment,
      available_after_orders_count,
      issued_at,
      used_at,
      created_at,
      updated_at
  `,
    [
      customerId ? Number(customerId) : null,
      phoneNormalized,
      giftRollId || "",
      giftRollTitle || "",
      comment || "",
      availableAfterOrdersCount,
    ]
  );

  return {
    success: true,
    created: true,
    reason: "created",
    gift: insertResult.rows[0],
  };
}

export async function markTelegramGiftUsed(pool, giftId) {
  console.log("MARK GIFT USED START", { giftId });
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
  console.log("MARK GIFT USED RESULT", {
    giftId,
    rows: result.rows.length,
    gift: result.rows[0] || null,
  });

  return result.rows[0] || null;
}

export async function linkTelegramToCustomerByPhone(
  pool,
  { phone, telegramUserId, telegramUsername = "", telegramFirstName = "" }
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

export async function getTelegramGiftsByPhone(pool, phone) {
  const phoneNormalized = normalizeUaPhone(phone);

  if (!phoneNormalized) {
    return [];
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

  return result.rows;
}

export async function getTelegramCheckoutStatusByPhone(pool, phone) {
  const phoneNormalized = normalizeUaPhone(phone);

  if (!phoneNormalized) {
    return {
      telegramLinked: false,
      customer: null,
      activeGift: null,
      ordersCount: 0,
      canUseGiftNow: false,
      ordersLeftUntilGift: null,
    };
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
        orders_count,
        total_spent,
        last_order_amount,
        first_order_at,
        last_order_at,
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
      telegramLinked: false,
      customer: null,
      activeGift: null,
      ordersCount: 0,
      canUseGiftNow: false,
      ordersLeftUntilGift: null,
    };
  }

  const activeGift = await getActiveTelegramGiftByPhone(pool, phoneNormalized);
  const ordersCount = Number(customer.orders_count || 0);

  const availableAfterOrdersCount = activeGift
    ? activeGift.available_after_orders_count == null
      ? null
      : Number(activeGift.available_after_orders_count)
    : null;

  const canUseGiftNow =
    Boolean(activeGift) &&
    (availableAfterOrdersCount === null ||
      ordersCount >= availableAfterOrdersCount);

  const ordersLeftUntilGift =
    activeGift && availableAfterOrdersCount !== null
      ? Math.max(0, availableAfterOrdersCount - ordersCount)
      : null;

  return {
    telegramLinked: Boolean(
      customer.telegram_user_id &&
        customer.is_telegram_subscribed &&
        customer.is_phone_confirmed
    ),
    customer,
    activeGift,
    ordersCount,
    canUseGiftNow,
    ordersLeftUntilGift,
  };
}

export async function getTelegramGiftsByTelegramUserId(pool, telegramUserId) {
  if (!telegramUserId) {
    return {
      customer: null,
      gifts: [],
    };
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
      WHERE telegram_user_id = $1
      ORDER BY id DESC
      LIMIT 1
    `,
    [String(telegramUserId)]
  );

  const customer = customerResult.rows[0] || null;

  if (!customer) {
    return {
      customer: null,
      gifts: [],
    };
  }

  const gifts = await getTelegramGiftsByPhone(pool, customer.phone);

  return {
    customer,
    gifts,
  };
}

export async function getTelegramCustomersForBroadcast(
  pool,
  {
    search = "",
    orderType = "all",
    telegram = "with",
    inactiveDays = "",
    minTotalSpent = "",
    minLastOrderAmount = "",
  } = {}
) {
  const conditions = [
    `telegram_user_id IS NOT NULL`,
    `is_telegram_subscribed = TRUE`,
  ];
  const values = [];
  let paramIndex = 1;

  if (search && search.trim()) {
    conditions.push(`(
      COALESCE(name, '') ILIKE $${paramIndex}
      OR COALESCE(phone, '') ILIKE $${paramIndex}
      OR COALESCE(phone_normalized, '') ILIKE $${paramIndex}
      OR COALESCE(telegram_username, '') ILIKE $${paramIndex}
    )`);
    values.push(`%${search.trim()}%`);
    paramIndex += 1;
  }

  if (orderType === "first") {
    conditions.push(`orders_count = 1`);
  }

  if (orderType === "repeat") {
    conditions.push(`orders_count > 1`);
  }

  if (inactiveDays !== "" && Number(inactiveDays) > 0) {
    conditions.push(
      `last_order_at <= NOW() - ($${paramIndex}::text || ' days')::interval`
    );
    values.push(String(Number(inactiveDays)));
    paramIndex += 1;
  }

  if (minTotalSpent !== "" && Number(minTotalSpent) > 0) {
    conditions.push(`total_spent >= $${paramIndex}`);
    values.push(Number(minTotalSpent));
    paramIndex += 1;
  }

  if (minLastOrderAmount !== "" && Number(minLastOrderAmount) > 0) {
    conditions.push(`last_order_amount >= $${paramIndex}`);
    values.push(Number(minLastOrderAmount));
    paramIndex += 1;
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

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
          WHEN orders_count > 0 THEN ROUND((total_spent / orders_count)::numeric, 2)
          ELSE 0
        END AS avg_check
      FROM customers
      ${whereSql}
      ORDER BY last_order_at DESC NULLS LAST, id DESC
    `,
    values
  );

  return result.rows;
}

export async function getTelegramBroadcastCount(
  pool,
  {
    search = "",
    orderType = "all",
    inactiveDays = "",
    minTotalSpent = "",
    minLastOrderAmount = "",
  } = {}
) {
  const conditions = [
    `telegram_user_id IS NOT NULL`,
    `is_telegram_subscribed = TRUE`,
  ];
  const values = [];
  let paramIndex = 1;

  if (search && search.trim()) {
    conditions.push(`(
      COALESCE(name, '') ILIKE $${paramIndex}
      OR COALESCE(phone, '') ILIKE $${paramIndex}
      OR COALESCE(phone_normalized, '') ILIKE $${paramIndex}
      OR COALESCE(telegram_username, '') ILIKE $${paramIndex}
    )`);
    values.push(`%${search.trim()}%`);
    paramIndex += 1;
  }

  if (orderType === "first") {
    conditions.push(`orders_count = 1`);
  }

  if (orderType === "repeat") {
    conditions.push(`orders_count > 1`);
  }

  if (inactiveDays !== "" && Number(inactiveDays) > 0) {
    conditions.push(
      `last_order_at <= NOW() - ($${paramIndex}::text || ' days')::interval`
    );
    values.push(String(Number(inactiveDays)));
    paramIndex += 1;
  }

  if (minTotalSpent !== "" && Number(minTotalSpent) > 0) {
    conditions.push(`total_spent >= $${paramIndex}`);
    values.push(Number(minTotalSpent));
    paramIndex += 1;
  }

  if (minLastOrderAmount !== "" && Number(minLastOrderAmount) > 0) {
    conditions.push(`last_order_amount >= $${paramIndex}`);
    values.push(Number(minLastOrderAmount));
    paramIndex += 1;
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await pool.query(
    `
      SELECT COUNT(*)::int AS count
      FROM customers
      ${whereSql}
    `,
    values
  );

  return Number(result.rows[0]?.count || 0);
}

export async function saveTelegramBroadcastHistory(
  pool,
  {
    text = "",
    filters = {},
    recipientsCount = 0,
    sentCount = 0,
    failedCount = 0,
    results = [],
  } = {}
) {
  const result = await pool.query(
    `
      INSERT INTO telegram_broadcasts (
        text,
        filters_json,
        recipients_count,
        sent_count,
        failed_count,
        results_json,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING
        id,
        text,
        filters_json,
        recipients_count,
        sent_count,
        failed_count,
        results_json,
        created_at
    `,
    [
      text || "",
      JSON.stringify(filters || {}),
      Number(recipientsCount || 0),
      Number(sentCount || 0),
      Number(failedCount || 0),
      JSON.stringify(results || []),
    ]
  );

  return result.rows[0];
}

export async function getTelegramBroadcastHistory(pool, limit = 20) {
  const result = await pool.query(
    `
      SELECT
        id,
        text,
        filters_json,
        recipients_count,
        sent_count,
        failed_count,
        results_json,
        created_at
      FROM telegram_broadcasts
      ORDER BY created_at DESC, id DESC
      LIMIT $1
    `,
    [Number(limit) || 20]
  );

  return result.rows.map((row) => ({
    ...row,
    filters: safeJsonParse(row.filters_json, {}),
    results: safeJsonParse(row.results_json, []),
  }));
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
