import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
  SELECT
    opening_time,
    closing_time,
    closed_all_day,
    allow_orders_after_hours,
    enable_after_hours_popup,
    popup_message,
    closed_all_day_message,
    phone_primary,
    phone_secondary,
    pickup_address,
    map_link,
    instagram_link,
    telegram_link,
    viber_link,
    delivery_enabled,
    pickup_enabled,
    pickup_discount_percent,
    show_free_delivery_progress,
    delivery_text,
    pickup_text,
    shop_address,
    shop_lat,
    shop_lng,
    delivery_zones
  FROM site_settings
  WHERE id = 1
  LIMIT 1
`);

    if (!result.rows.length) {
      return res.status(404).json({ message: "Налаштування не знайдено" });
    }

    const row = result.rows[0];

    res.json({
      workingHours: {
        openTime: row.opening_time || "10:00",
        closeTime: row.closing_time || "22:00",
        closedToday: row.closed_all_day === true,
        allowOrdersAfterHours: row.allow_orders_after_hours === true,
      },
      popup: {
        showOutsideWorkingHours: row.enable_after_hours_popup === true,
        outsideHoursText: row.popup_message || "",
        closedTodayText: row.closed_all_day_message || "",
      },
      contacts: {
        phonePrimary: row.phone_primary || "",
        phoneSecondary: row.phone_secondary || "",
        pickupAddress: row.pickup_address || "",
        mapLink: row.map_link || "",
        instagramLink: row.instagram_link || "",
        telegramLink: row.telegram_link || "",
        viberLink: row.viber_link || "",
      },
      delivery: {
        deliveryEnabled: row.delivery_enabled === true,
        pickupEnabled: row.pickup_enabled === true,
        pickupDiscountPercent: Number(row.pickup_discount_percent ?? 5),
        showFreeDeliveryProgress: row.show_free_delivery_progress === true,
        deliveryText: row.delivery_text || "",
        pickupText: row.pickup_text || "",
        shopAddress: row.shop_address || "Мала Морська 108",
        shopLat: Number(row.shop_lat ?? 46.953807),
        shopLng: Number(row.shop_lng ?? 31.994199),
        deliveryZones: Array.isArray(row.delivery_zones) ? row.delivery_zones : [],
      },
    });
  } catch (error) {
    console.error("GET SITE SETTINGS ERROR:", error);
    res.status(500).json({ message: "Помилка завантаження налаштувань" });
  }
});

router.put("/working-hours", async (req, res) => {
  try {
    const {
      openTime,
      closeTime,
      closedToday,
      allowOrdersAfterHours,
    } = req.body;

    if (!openTime || !closeTime) {
      return res.status(400).json({
        message: "Час відкриття та закриття обов'язкові",
      });
    }

    const result = await pool.query(
      `
      UPDATE site_settings
      SET
        opening_time = $1,
        closing_time = $2,
        closed_all_day = $3,
        allow_orders_after_hours = $4,
        updated_at = NOW()
      WHERE id = 1
      RETURNING
        opening_time,
        closing_time,
        closed_all_day,
        allow_orders_after_hours
      `,
      [
        openTime,
        closeTime,
        closedToday === true,
        allowOrdersAfterHours === true,
      ]
    );

    const row = result.rows[0];

    res.json({
      success: true,
      message: "Робочі години оновлено",
      workingHours: {
        openTime: row.opening_time,
        closeTime: row.closing_time,
        closedToday: row.closed_all_day === true,
        allowOrdersAfterHours: row.allow_orders_after_hours === true,
      },
    });
  } catch (error) {
    console.error("UPDATE WORKING HOURS ERROR:", error);
    res.status(500).json({ message: "Помилка збереження робочих годин" });
  }
});

router.put("/contacts", async (req, res) => {
  try {
    const {
      phonePrimary,
      phoneSecondary,
      pickupAddress,
      mapLink,
      instagramLink,
      telegramLink,
      viberLink,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE site_settings
      SET
        phone_primary = $1,
        phone_secondary = $2,
        pickup_address = $3,
        map_link = $4,
        instagram_link = $5,
        telegram_link = $6,
        viber_link = $7,
        updated_at = NOW()
      WHERE id = 1
      RETURNING
        phone_primary,
        phone_secondary,
        pickup_address,
        map_link,
        instagram_link,
        telegram_link,
        viber_link
      `,
      [
        phonePrimary || "",
        phoneSecondary || "",
        pickupAddress || "",
        mapLink || "",
        instagramLink || "",
        telegramLink || "",
        viberLink || "",
      ]
    );

    const row = result.rows[0];

    res.json({
      success: true,
      message: "Контакти оновлено",
      contacts: {
        phonePrimary: row.phone_primary || "",
        phoneSecondary: row.phone_secondary || "",
        pickupAddress: row.pickup_address || "",
        mapLink: row.map_link || "",
        instagramLink: row.instagram_link || "",
        telegramLink: row.telegram_link || "",
        viberLink: row.viber_link || "",
      },
    });
  } catch (error) {
    console.error("UPDATE CONTACTS ERROR:", error);
    res.status(500).json({ message: "Помилка збереження контактів" });
  }
});

router.put("/delivery", async (req, res) => {
  try {
    const {
      deliveryEnabled,
      pickupEnabled,
      pickupDiscountPercent,
      showFreeDeliveryProgress,
      deliveryText,
      pickupText,
      shopAddress,
      shopLat,
      shopLng,
      deliveryZones,
    } = req.body;

    const safeZones = Array.isArray(deliveryZones)
      ? deliveryZones
          .map((zone) => ({
            maxKm: Number(zone.maxKm),
            minOrder: Number(zone.minOrder),
          }))
          .filter(
            (zone) =>
              Number.isFinite(zone.maxKm) &&
              zone.maxKm > 0 &&
              Number.isFinite(zone.minOrder) &&
              zone.minOrder >= 0
          )
      : [];

    const result = await pool.query(
      `
      UPDATE site_settings
      SET
        delivery_enabled = $1,
        pickup_enabled = $2,
        pickup_discount_percent = $3,
        show_free_delivery_progress = $4,
        delivery_text = $5,
        pickup_text = $6,
        shop_address = $7,
        shop_lat = $8,
        shop_lng = $9,
        delivery_zones = $10::jsonb,
        updated_at = NOW()
      WHERE id = 1
      RETURNING
        delivery_enabled,
        pickup_enabled,
        pickup_discount_percent,
        show_free_delivery_progress,
        delivery_text,
        pickup_text,
        shop_address,
        shop_lat,
        shop_lng,
        delivery_zones
      `,
      [
        deliveryEnabled === true,
        pickupEnabled === true,
        Number(pickupDiscountPercent ?? 5),
        showFreeDeliveryProgress === true,
        deliveryText || "",
        pickupText || "",
        shopAddress || "",
        Number(shopLat ?? 0),
        Number(shopLng ?? 0),
        JSON.stringify(safeZones),
      ]
    );

    const row = result.rows[0];

    res.json({
      success: true,
      message: "Налаштування доставки оновлено",
      delivery: {
        deliveryEnabled: row.delivery_enabled === true,
        pickupEnabled: row.pickup_enabled === true,
        pickupDiscountPercent: Number(row.pickup_discount_percent ?? 5),
        showFreeDeliveryProgress: row.show_free_delivery_progress === true,
        deliveryText: row.delivery_text || "",
        pickupText: row.pickup_text || "",
        shopAddress: row.shop_address || "",
        shopLat: Number(row.shop_lat ?? 0),
        shopLng: Number(row.shop_lng ?? 0),
        deliveryZones: Array.isArray(row.delivery_zones) ? row.delivery_zones : [],
      },
    });
  } catch (error) {
    console.error("UPDATE DELIVERY SETTINGS ERROR:", error);
    res.status(500).json({ message: "Помилка збереження налаштувань доставки" });
  }
});

router.put("/popup", async (req, res) => {
  try {
    const {
      showOutsideWorkingHours,
      outsideHoursText,
      closedTodayText,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE site_settings
      SET
        enable_after_hours_popup = $1,
        popup_message = $2,
        closed_all_day_message = $3,
        updated_at = NOW()
      WHERE id = 1
      RETURNING
        enable_after_hours_popup,
        popup_message,
        closed_all_day_message
      `,
      [
        showOutsideWorkingHours === true,
        outsideHoursText || "",
        closedTodayText || "",
      ]
    );

    const row = result.rows[0];

    res.json({
      success: true,
      message: "Налаштування попапа оновлено",
      popup: {
        showOutsideWorkingHours: row.enable_after_hours_popup === true,
        outsideHoursText: row.popup_message || "",
        closedTodayText: row.closed_all_day_message || "",
      },
    });
  } catch (error) {
    console.error("UPDATE POPUP SETTINGS ERROR:", error);
    res.status(500).json({ message: "Помилка збереження налаштувань попапа" });
  }
});

export default router;