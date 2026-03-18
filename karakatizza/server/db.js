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
}
