import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price NUMERIC NOT NULL,
      category TEXT NOT NULL,
      description TEXT DEFAULT '',
      image TEXT DEFAULT '',
      popular BOOLEAN DEFAULT FALSE,
      promo_type TEXT DEFAULT 'none',
      priority INTEGER DEFAULT 10,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 10;
  `);

  await pool.query(`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS popular BOOLEAN DEFAULT FALSE;
  `);

  await pool.query(`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS promo_type TEXT DEFAULT 'none';
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS banners (
      id TEXT PRIMARY KEY,
      image TEXT NOT NULL,
      mobile_image TEXT DEFAULT '',
      link TEXT DEFAULT '#menu',
      title TEXT DEFAULT '',
      is_active BOOLEAN DEFAULT TRUE,
      priority INTEGER DEFAULT 10,
      click_count INTEGER DEFAULT 0,
      end_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE banners
    ADD COLUMN IF NOT EXISTS mobile_image TEXT DEFAULT '';
  `);

  await pool.query(`
    ALTER TABLE banners
    ADD COLUMN IF NOT EXISTS link TEXT DEFAULT '#menu';
  `);

  await pool.query(`
    ALTER TABLE banners
    ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '';
  `);

  await pool.query(`
    ALTER TABLE banners
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
  `);

  await pool.query(`
    ALTER TABLE banners
    ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 10;
  `);

  await pool.query(`
    ALTER TABLE banners
    ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;
  `);

  await pool.query(`
    ALTER TABLE banners
    ADD COLUMN IF NOT EXISTS end_at TIMESTAMP NULL;
  `);

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

  await pool.query(`
  CREATE TABLE IF NOT EXISTS gift_roll_settings (
    id SERIAL PRIMARY KEY,
    trigger_sum INTEGER NOT NULL DEFAULT 1000,
    gift_product_id TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    weekdays_only BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );
`);

  await pool.query(`
  INSERT INTO gift_roll_settings (trigger_sum, is_active, weekdays_only)
  SELECT 1000, true, true
  WHERE NOT EXISTS (
    SELECT 1 FROM gift_roll_settings
  );
`);

  await pool.query(`
  ALTER TABLE products
  ADD COLUMN IF NOT EXISTS free_soy_sauce INTEGER DEFAULT 0;
`);

  await pool.query(`
  ALTER TABLE products
  ADD COLUMN IF NOT EXISTS free_ginger INTEGER DEFAULT 0;
`);

  await pool.query(`
  ALTER TABLE products
  ADD COLUMN IF NOT EXISTS free_wasabi INTEGER DEFAULT 0;
`);

  await pool.query(`
  ALTER TABLE products
  ADD COLUMN IF NOT EXISTS weight TEXT;
`);

  await pool.query(`
  ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true;
`);

  await pool.query(`
  ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_hit BOOLEAN NOT NULL DEFAULT false;
`);

  await pool.query(`
  ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_new BOOLEAN NOT NULL DEFAULT false;
`);

  await pool.query(`
  ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_weekly_offer BOOLEAN NOT NULL DEFAULT false;
`);

  await pool.query(`
  ALTER TABLE products
  ADD COLUMN IF NOT EXISTS old_price NUMERIC;
`);

  await pool.query(`
  CREATE TABLE IF NOT EXISTS site_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,

    opening_time TEXT NOT NULL DEFAULT '10:00',
    closing_time TEXT NOT NULL DEFAULT '22:00',
    allow_orders_after_hours BOOLEAN NOT NULL DEFAULT true,

    enable_after_hours_popup BOOLEAN NOT NULL DEFAULT true,
    closed_all_day BOOLEAN NOT NULL DEFAULT false,
    closed_all_day_date TEXT NOT NULL DEFAULT '',
    popup_message TEXT NOT NULL DEFAULT '',
    closed_all_day_message TEXT NOT NULL DEFAULT '',

    phone_primary TEXT NOT NULL DEFAULT '',
    phone_secondary TEXT NOT NULL DEFAULT '',
    pickup_address TEXT NOT NULL DEFAULT '',
    map_link TEXT NOT NULL DEFAULT '',
    instagram_link TEXT NOT NULL DEFAULT '',
    telegram_link TEXT NOT NULL DEFAULT '',
    viber_link TEXT NOT NULL DEFAULT '',

    delivery_enabled BOOLEAN NOT NULL DEFAULT true,
    pickup_enabled BOOLEAN NOT NULL DEFAULT true,
    pickup_discount_percent INTEGER NOT NULL DEFAULT 5,
    show_free_delivery_progress BOOLEAN NOT NULL DEFAULT true,
    delivery_text TEXT NOT NULL DEFAULT '',
    pickup_text TEXT NOT NULL DEFAULT '',
    shop_address TEXT NOT NULL DEFAULT 'Мала Морська 108',
    shop_lat DOUBLE PRECISION NOT NULL DEFAULT 46.953807,
    shop_lng DOUBLE PRECISION NOT NULL DEFAULT 31.994199,
    delivery_zones JSONB NOT NULL DEFAULT '[
      {"maxKm":2.5,"minOrder":400},
      {"maxKm":4,"minOrder":500},
      {"maxKm":5,"minOrder":600},
      {"maxKm":6,"minOrder":700},
      {"maxKm":8,"minOrder":800},
      {"maxKm":10,"minOrder":1100},
      {"maxKm":14,"minOrder":1300}
    ]'::jsonb,
    card_online_enabled BOOLEAN NOT NULL DEFAULT true,
    bank_transfer_enabled BOOLEAN NOT NULL DEFAULT false,
    bank_transfer_card_number TEXT NOT NULL DEFAULT '',
    bank_transfer_recipient TEXT NOT NULL DEFAULT '',
    bank_transfer_bank_name TEXT NOT NULL DEFAULT '',
    bank_transfer_hint TEXT NOT NULL DEFAULT '',

    updated_at TIMESTAMP DEFAULT NOW()
  );
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS allow_orders_after_hours BOOLEAN NOT NULL DEFAULT true;
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS phone_primary TEXT NOT NULL DEFAULT '';
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS phone_secondary TEXT NOT NULL DEFAULT '';
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS pickup_address TEXT NOT NULL DEFAULT '';
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS map_link TEXT NOT NULL DEFAULT '';
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS instagram_link TEXT NOT NULL DEFAULT '';
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS telegram_link TEXT NOT NULL DEFAULT '';
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS viber_link TEXT NOT NULL DEFAULT '';
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS delivery_enabled BOOLEAN NOT NULL DEFAULT true;
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS pickup_enabled BOOLEAN NOT NULL DEFAULT true;
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS pickup_discount_percent INTEGER NOT NULL DEFAULT 5;
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS show_free_delivery_progress BOOLEAN NOT NULL DEFAULT true;
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS delivery_text TEXT NOT NULL DEFAULT '';
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS pickup_text TEXT NOT NULL DEFAULT '';
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS shop_address TEXT NOT NULL DEFAULT 'Мала Морська 108';
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS shop_lat DOUBLE PRECISION NOT NULL DEFAULT 46.953807;
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS shop_lng DOUBLE PRECISION NOT NULL DEFAULT 31.994199;
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS delivery_zones JSONB NOT NULL DEFAULT '[
    {"maxKm":2.5,"minOrder":400},
    {"maxKm":4,"minOrder":500},
    {"maxKm":5,"minOrder":600},
    {"maxKm":6,"minOrder":700},
    {"maxKm":8,"minOrder":800},
    {"maxKm":10,"minOrder":1100},
    {"maxKm":14,"minOrder":1300}
  ]'::jsonb;
`);
  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS card_online_enabled BOOLEAN NOT NULL DEFAULT true;
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS bank_transfer_enabled BOOLEAN NOT NULL DEFAULT false;
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS bank_transfer_card_number TEXT NOT NULL DEFAULT '';
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS bank_transfer_recipient TEXT NOT NULL DEFAULT '';
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS bank_transfer_bank_name TEXT NOT NULL DEFAULT '';
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS bank_transfer_hint TEXT NOT NULL DEFAULT '';
`);

  await pool.query(`
  INSERT INTO site_settings (
    id,
    opening_time,
    closing_time,
    allow_orders_after_hours,
    enable_after_hours_popup,
    closed_all_day,
    closed_all_day_date,
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
bank_transfer_hint
  )
  SELECT
    1,
    '10:00',
    '22:00',
    true,
    true,
    false,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    true,
    true,
    5,
    true,
    '',
    '',
    'Мала Морська 108',
    46.953807,
    31.994199,
    '[
      {"maxKm":2.5,"minOrder":400},
      {"maxKm":4,"minOrder":500},
      {"maxKm":5,"minOrder":600},
      {"maxKm":6,"minOrder":700},
      {"maxKm":8,"minOrder":800},
      {"maxKm":10,"minOrder":1100},
      {"maxKm":14,"minOrder":1300}
    ]'::jsonb,
    true,
    false,
    '',
    '',
    '',
    ''
  WHERE NOT EXISTS (
    SELECT 1 FROM site_settings WHERE id = 1
  );
`);
}
