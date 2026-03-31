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