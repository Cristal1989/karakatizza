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
    delivery_zones,
    card_online_enabled,
bank_transfer_enabled,
bank_transfer_card_number,
bank_transfer_recipient,
bank_transfer_bank_name,
bank_transfer_hint,
pickup_selected_text,
delivery_address_hint,
delivery_address_not_found_text,
order_disabled_text,
checkout_comment_placeholder,
checkout_exact_time_label,
checkout_success_hint,
telegram_template_come_back_30,
telegram_template_week_promo,
telegram_template_vip,
telegram_template_new_menu,
telegram_template_inactive_60,
telegram_promo_title,
telegram_promo_text
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
        openingTime: row.opening_time || "10:00",
        closingTime: row.closing_time || "22:00",
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
      payment: {
        cardOnlineEnabled: row.card_online_enabled === true,
        bankTransferEnabled: row.bank_transfer_enabled === true,
        bankTransferCardNumber: row.bank_transfer_card_number || "",
        bankTransferRecipient: row.bank_transfer_recipient || "",
        bankTransferBankName: row.bank_transfer_bank_name || "",
        bankTransferHint: row.bank_transfer_hint || "",
      },
      texts: {
        pickupSelectedText: row.pickup_selected_text || "",
        deliveryAddressHint: row.delivery_address_hint || "",
        deliveryAddressNotFoundText: row.delivery_address_not_found_text || "",
        orderDisabledText: row.order_disabled_text || "",
        checkoutCommentPlaceholder: row.checkout_comment_placeholder || "",
        checkoutExactTimeLabel: row.checkout_exact_time_label || "",
        checkoutSuccessHint: row.checkout_success_hint || "",
      },
      telegramTemplates: {
        comeBack30: row.telegram_template_come_back_30 || "",
        weekPromo: row.telegram_template_week_promo || "",
        vip: row.telegram_template_vip || "",
        newMenu: row.telegram_template_new_menu || "",
        inactive60: row.telegram_template_inactive_60 || "",
      },
      telegramPromo: {
        title: row.telegram_promo_title || "🔥 Актуальні акції Karakatizza",
        text:
          row.telegram_promo_text ||
          "Слідкуй за нашими пропозиціями на сайті та в Telegram.",
      },
    });
  } catch (error) {
    console.error("GET SITE SETTINGS ERROR:", error);
    res.status(500).json({ message: "Помилка завантаження налаштувань" });
  }
});

router.put("/working-hours", async (req, res) => {
  try {
    const { openTime, closeTime, closedToday, allowOrdersAfterHours } =
      req.body;

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
        deliveryZones: Array.isArray(row.delivery_zones)
          ? row.delivery_zones
          : [],
      },
    });
  } catch (error) {
    console.error("UPDATE DELIVERY SETTINGS ERROR:", error);
    res
      .status(500)
      .json({ message: "Помилка збереження налаштувань доставки" });
  }
});

router.put("/payment", async (req, res) => {
  try {
    const {
      cardOnlineEnabled,
      bankTransferEnabled,
      bankTransferCardNumber,
      bankTransferRecipient,
      bankTransferBankName,
      bankTransferHint,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE site_settings
      SET
        card_online_enabled = $1,
        bank_transfer_enabled = $2,
        bank_transfer_card_number = $3,
        bank_transfer_recipient = $4,
        bank_transfer_bank_name = $5,
        bank_transfer_hint = $6,
        updated_at = NOW()
      WHERE id = 1
      RETURNING
        card_online_enabled,
        bank_transfer_enabled,
        bank_transfer_card_number,
        bank_transfer_recipient,
        bank_transfer_bank_name,
        bank_transfer_hint
      `,
      [
        cardOnlineEnabled === true,
        bankTransferEnabled === true,
        bankTransferCardNumber || "",
        bankTransferRecipient || "",
        bankTransferBankName || "",
        bankTransferHint || "",
      ]
    );

    const row = result.rows[0];

    res.json({
      success: true,
      message: "Налаштування оплати оновлено",
      payment: {
        cardOnlineEnabled: row.card_online_enabled === true,
        bankTransferEnabled: row.bank_transfer_enabled === true,
        bankTransferCardNumber: row.bank_transfer_card_number || "",
        bankTransferRecipient: row.bank_transfer_recipient || "",
        bankTransferBankName: row.bank_transfer_bank_name || "",
        bankTransferHint: row.bank_transfer_hint || "",
      },
    });
  } catch (error) {
    console.error("UPDATE PAYMENT SETTINGS ERROR:", error);
    res.status(500).json({ message: "Помилка збереження налаштувань оплати" });
  }
});

router.put("/texts", async (req, res) => {
  try {
    const {
      pickupSelectedText,
      deliveryAddressHint,
      deliveryAddressNotFoundText,
      orderDisabledText,
      checkoutCommentPlaceholder,
      checkoutExactTimeLabel,
      checkoutSuccessHint,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE site_settings
      SET
        pickup_selected_text = $1,
        delivery_address_hint = $2,
        delivery_address_not_found_text = $3,
        order_disabled_text = $4,
        checkout_comment_placeholder = $5,
        checkout_exact_time_label = $6,
        checkout_success_hint = $7,
        updated_at = NOW()
      WHERE id = 1
      RETURNING
        pickup_selected_text,
        delivery_address_hint,
        delivery_address_not_found_text,
        order_disabled_text,
        checkout_comment_placeholder,
        checkout_exact_time_label,
        checkout_success_hint
      `,
      [
        pickupSelectedText || "",
        deliveryAddressHint || "",
        deliveryAddressNotFoundText || "",
        orderDisabledText || "",
        checkoutCommentPlaceholder || "",
        checkoutExactTimeLabel || "",
        checkoutSuccessHint || "",
      ]
    );

    const row = result.rows[0];

    res.json({
      success: true,
      message: "Тексти сайту оновлено",
      texts: {
        pickupSelectedText: row.pickup_selected_text || "",
        deliveryAddressHint: row.delivery_address_hint || "",
        deliveryAddressNotFoundText: row.delivery_address_not_found_text || "",
        orderDisabledText: row.order_disabled_text || "",
        checkoutCommentPlaceholder: row.checkout_comment_placeholder || "",
        checkoutExactTimeLabel: row.checkout_exact_time_label || "",
        checkoutSuccessHint: row.checkout_success_hint || "",
      },
    });
  } catch (error) {
    console.error("UPDATE SITE TEXTS ERROR:", error);
    res.status(500).json({ message: "Помилка збереження текстів сайту" });
  }
});

router.put("/popup", async (req, res) => {
  try {
    const { showOutsideWorkingHours, outsideHoursText, closedTodayText } =
      req.body;

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

router.put("/telegram-templates", async (req, res) => {
  try {
    const { comeBack30, weekPromo, vip, newMenu, inactive60 } = req.body || {};

    const result = await pool.query(
      `
      UPDATE site_settings
      SET
        telegram_template_come_back_30 = $1,
        telegram_template_week_promo = $2,
        telegram_template_vip = $3,
        telegram_template_new_menu = $4,
        telegram_template_inactive_60 = $5,
        updated_at = NOW()
      WHERE id = 1
      RETURNING
        telegram_template_come_back_30,
        telegram_template_week_promo,
        telegram_template_vip,
        telegram_template_new_menu,
        telegram_template_inactive_60
      `,
      [
        comeBack30 || "",
        weekPromo || "",
        vip || "",
        newMenu || "",
        inactive60 || "",
      ]
    );

    const row = result.rows[0];

    return res.json({
      success: true,
      telegramTemplates: {
        comeBack30: row.telegram_template_come_back_30 || "",
        weekPromo: row.telegram_template_week_promo || "",
        vip: row.telegram_template_vip || "",
        newMenu: row.telegram_template_new_menu || "",
        inactive60: row.telegram_template_inactive_60 || "",
      },
    });
  } catch (error) {
    console.error("UPDATE TELEGRAM TEMPLATES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Не вдалося зберегти шаблони Telegram",
      error: error?.message || "Unknown error",
    });
  }
});

router.put("/telegram-promo", async (req, res) => {
  try {
    const {
      title = "🔥 Актуальні акції Karakatizza",
      text = "Слідкуй за нашими пропозиціями на сайті та в Telegram.",
    } = req.body || {};

    const result = await pool.query(
      `
        UPDATE site_settings
        SET
          telegram_promo_title = $1,
          telegram_promo_text = $2
        WHERE id = 1
        RETURNING
          telegram_promo_title,
          telegram_promo_text
      `,
      [title || "", text || ""]
    );

    const row = result.rows[0];

    return res.json({
      success: true,
      telegramPromo: {
        title: row?.telegram_promo_title || "",
        text: row?.telegram_promo_text || "",
      },
    });
  } catch (error) {
    console.error("UPDATE TELEGRAM PROMO ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Помилка оновлення Telegram-акції",
      error: error?.message || "Unknown error",
    });
  }
});

export default router;
