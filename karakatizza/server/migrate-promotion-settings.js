import pool from "./db.js";

async function migratePromotionSettings() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS promotion_settings (
        id SERIAL PRIMARY KEY,
        discount_percent INTEGER NOT NULL DEFAULT 25,
        trigger_sum INTEGER NOT NULL DEFAULT 600,
        is_active BOOLEAN NOT NULL DEFAULT true,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      INSERT INTO promotion_settings (discount_percent, trigger_sum, is_active)
      SELECT 25, 600, true
      WHERE NOT EXISTS (
        SELECT 1 FROM promotion_settings
      );
    `);

    process.exit(0);
  } catch (error) {
    console.error("Ошибка миграции promotion_settings:", error);
    process.exit(1);
  }
}

migratePromotionSettings();
