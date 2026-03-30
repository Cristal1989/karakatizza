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
        closed_all_day_message
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