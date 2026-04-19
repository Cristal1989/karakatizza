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
ALTER TABLE gift_roll_settings
ADD COLUMN IF NOT EXISTS bonus_type TEXT NOT NULL DEFAULT 'gift_product'
`);

  await pool.query(`
ALTER TABLE gift_roll_settings
ADD COLUMN IF NOT EXISTS bonus_title TEXT NOT NULL DEFAULT ''
`);

  await pool.query(`
ALTER TABLE gift_roll_settings
ADD COLUMN IF NOT EXISTS bonus_description TEXT NOT NULL DEFAULT ''
`);

  await pool.query(`
ALTER TABLE gift_roll_settings
ADD COLUMN IF NOT EXISTS bonus_image TEXT NOT NULL DEFAULT ''
`);

  await pool.query(`
ALTER TABLE gift_roll_settings
ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT NULL
`);

  await pool.query(`
ALTER TABLE gift_roll_settings
ADD COLUMN IF NOT EXISTS custom_text TEXT NOT NULL DEFAULT ''
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
    pickup_selected_text TEXT NOT NULL DEFAULT 'Самовивіз обрано — адресу вводити не потрібно',
    delivery_address_hint TEXT NOT NULL DEFAULT 'Введіть адресу для уточнення безкоштовної доставки',
    delivery_address_not_found_text TEXT NOT NULL DEFAULT 'Уточніть адресу у оператора',
    order_disabled_text TEXT NOT NULL DEFAULT 'Наразі оформлення замовлення тимчасово недоступне',
    checkout_comment_placeholder TEXT NOT NULL DEFAULT 'Коментар до замовлення',
    checkout_exact_time_label TEXT NOT NULL DEFAULT 'Потрібно на певний час',
    checkout_success_hint TEXT NOT NULL DEFAULT 'Дякуємо за замовлення! Ми скоро зв’яжемося з вами.',
    telegram_template_come_back_30 TEXT NOT NULL DEFAULT 'Привіт, {{name}}!
    
Скучили за тобою 🙂
Повернись за улюбленими ролами — для тебе вже є привід оформити нове замовлення.',
telegram_template_week_promo TEXT NOT NULL DEFAULT 'Привіт, {{name}}!

У нас зараз діє вигідна пропозиція тижня.
Зазирни на сайт та обери щось смачне для себе 👌',
telegram_template_vip TEXT NOT NULL DEFAULT 'Привіт, {{name}}!

Дякуємо, що замовляєш у Karakatizza 🍣

Для наших постійних клієнтів ми готуємо особливі пропозиції.',
telegram_template_new_menu TEXT NOT NULL DEFAULT 'Привіт, {{name}}!

У меню з''явилися новинки.
Саме час спробувати щось нове до вечері 😉',
telegram_template_inactive_60 TEXT NOT NULL DEFAULT 'Привіт, {{name}}!

Давно тебе не бачили в Karakatizza.
Можливо, саме сьогодні час повернутися за улюбленими ролами 🍣',

    updated_at TIMESTAMP DEFAULT NOW()
  );
`);

  await pool.query(`
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS telegram_promo_title TEXT NOT NULL DEFAULT '🔥 Актуальні акції Karakatizza'
`);

  await pool.query(`
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS telegram_promo_text TEXT NOT NULL DEFAULT 'Слідкуй за нашими пропозиціями на сайті та в Telegram.'
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
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS pickup_selected_text TEXT NOT NULL DEFAULT 'Самовивіз обрано — адресу вводити не потрібно';
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS delivery_address_hint TEXT NOT NULL DEFAULT 'Введіть адресу для уточнення безкоштовної доставки';
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS delivery_address_not_found_text TEXT NOT NULL DEFAULT 'Уточніть адресу у оператора';
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS order_disabled_text TEXT NOT NULL DEFAULT 'Наразі оформлення замовлення тимчасово недоступне';
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS checkout_comment_placeholder TEXT NOT NULL DEFAULT 'Коментар до замовлення';
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS checkout_exact_time_label TEXT NOT NULL DEFAULT 'Потрібно на певний час';
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS checkout_success_hint TEXT NOT NULL DEFAULT 'Дякуємо за замовлення! Ми скоро зв’яжемося з вами.';
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS telegram_template_come_back_30 TEXT NOT NULL DEFAULT 'Привіт, {{name}}!

Скучили за тобою 🙂
Повернись за улюбленими ролами — для тебе вже є привід оформити нове замовлення.';
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS telegram_template_week_promo TEXT NOT NULL DEFAULT 'Привіт, {{name}}!

У нас зараз діє вигідна пропозиція тижня.
Зазирни на сайт та обери щось смачне для себе 👌';
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS telegram_template_vip TEXT NOT NULL DEFAULT 'Привіт, {{name}}!

Дякуємо, що замовляєш у Karakatizza 🍣

Для наших постійних клієнтів ми готуємо особливі пропозиції.';
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS telegram_template_new_menu TEXT NOT NULL DEFAULT 'Привіт, {{name}}!

У меню з''явилися новинки.
Саме час спробувати щось нове до вечері 😉';
`);

  await pool.query(`
  ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS telegram_template_inactive_60 TEXT NOT NULL DEFAULT 'Привіт, {{name}}!

Давно тебе не бачили в Karakatizza.
Можливо, саме сьогодні час повернутися за улюбленими ролами 🍣';
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
telegram_template_inactive_60
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
    '',
    'Самовивіз обрано — адресу вводити не потрібно',
'Введіть адресу для уточнення безкоштовної доставки',
'Уточніть адресу у оператора',
'Наразі оформлення замовлення тимчасово недоступне',
'Коментар до замовлення',
'Потрібно на певний час',
'Дякуємо за замовлення! Ми скоро зв’яжемося з вами.',
'Привіт, {{name}}!

Скучили за тобою 🙂
Повернись за улюбленими ролами — для тебе вже є привід оформити нове замовлення.',
'Привіт, {{name}}!

У нас зараз діє вигідна пропозиція тижня.
Зазирни на сайт та обери щось смачне для себе 👌',
'Привіт, {{name}}!

Дякуємо, що замовляєш у Karakatizza 🍣

Для наших постійних клієнтів ми готуємо особливі пропозиції.',
'Привіт, {{name}}!

У меню з''явилися новинки.
Саме час спробувати щось нове до вечері 😉',
'Привіт, {{name}}!

Давно тебе не бачили в Karakatizza.
Можливо, саме сьогодні час повернутися за улюбленими ролами 🍣'
  WHERE NOT EXISTS (
    SELECT 1 FROM site_settings WHERE id = 1
  );
`);

  await pool.query(`
  CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    phone TEXT NOT NULL,
    phone_normalized TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT '',
    telegram_user_id TEXT DEFAULT '',
    telegram_username TEXT DEFAULT '',
    telegram_first_name TEXT DEFAULT '',
    is_telegram_subscribed BOOLEAN NOT NULL DEFAULT false,
    is_phone_confirmed BOOLEAN NOT NULL DEFAULT false,
    first_order_at TIMESTAMP,
    last_order_at TIMESTAMP,
    orders_count INTEGER NOT NULL DEFAULT 0,
    total_spent NUMERIC NOT NULL DEFAULT 0,
    last_order_amount NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );
`);

  await pool.query(`
  CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    phone TEXT NOT NULL,
    phone_normalized TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    mode TEXT NOT NULL DEFAULT 'delivery',
    address TEXT DEFAULT '',
    resolved_address TEXT DEFAULT '',
    entrance TEXT DEFAULT '',
    comment TEXT DEFAULT '',
    payment_method TEXT NOT NULL DEFAULT 'cash',
    need_exact_time BOOLEAN NOT NULL DEFAULT false,
    exact_time TEXT DEFAULT '',
    total_amount NUMERIC NOT NULL DEFAULT 0,
    items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    items_summary TEXT NOT NULL DEFAULT '',
    condiments_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    regular_sticks_count INTEGER NOT NULL DEFAULT 0,
    training_sticks_count INTEGER NOT NULL DEFAULT 0,
    sticks_extra_price NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'new',
    source TEXT NOT NULL DEFAULT 'site',
    gift_roll_applied BOOLEAN NOT NULL DEFAULT false,
    gift_roll_id TEXT DEFAULT '',
    gift_roll_title TEXT DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );
`);
await pool.query(`
  ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS telegram_bonus_meta JSONB;
`);

  await pool.query(`
  CREATE TABLE IF NOT EXISTS customer_rewards (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    reward_code TEXT NOT NULL DEFAULT '',
    gift_roll_id TEXT DEFAULT '',
    gift_roll_title TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'available',
    issued_at TIMESTAMP NOT NULL DEFAULT NOW(),
    used_at TIMESTAMP,
    expires_at TIMESTAMP,
    issued_order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    used_order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    notes TEXT DEFAULT ''
  );
`);

  await pool.query(`
  CREATE INDEX IF NOT EXISTS idx_customers_phone_normalized
  ON customers(phone_normalized);
`);

  await pool.query(`
  CREATE INDEX IF NOT EXISTS idx_customers_last_order_at
  ON customers(last_order_at);
`);

  await pool.query(`
  CREATE INDEX IF NOT EXISTS idx_orders_customer_id
  ON orders(customer_id);
`);

  await pool.query(`
  CREATE INDEX IF NOT EXISTS idx_orders_phone_normalized
  ON orders(phone_normalized);
`);

  await pool.query(`
  CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON orders(created_at);
`);

  await pool.query(`
  CREATE INDEX IF NOT EXISTS idx_customer_rewards_customer_id
  ON customer_rewards(customer_id);
`);

  await pool.query(`
  CREATE INDEX IF NOT EXISTS idx_customer_rewards_status
  ON customer_rewards(status);
`);

  await pool.query(`
  CREATE TABLE IF NOT EXISTS telegram_gifts (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    phone_normalized VARCHAR(32) NOT NULL,
    gift_roll_id VARCHAR(128),
    gift_roll_title VARCHAR(255),
    status VARCHAR(32) NOT NULL DEFAULT 'issued',
    source VARCHAR(32) NOT NULL DEFAULT 'telegram',
    comment TEXT DEFAULT '',
    issued_at TIMESTAMP NOT NULL DEFAULT NOW(),
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );
`);

  await pool.query(`
  CREATE INDEX IF NOT EXISTS idx_telegram_gifts_customer_id
  ON telegram_gifts(customer_id);
`);

  await pool.query(`
  CREATE INDEX IF NOT EXISTS idx_telegram_gifts_phone_normalized
  ON telegram_gifts(phone_normalized);
`);

  await pool.query(`
  CREATE INDEX IF NOT EXISTS idx_telegram_gifts_status
  ON telegram_gifts(status);
`);

  await pool.query(`
  CREATE TABLE IF NOT EXISTS telegram_broadcasts (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL DEFAULT '',
    filters_json TEXT NOT NULL DEFAULT '{}',
    recipients_count INTEGER NOT NULL DEFAULT 0,
    sent_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    results_json TEXT NOT NULL DEFAULT '[]',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );
`);

  await pool.query(`
  CREATE INDEX IF NOT EXISTS idx_telegram_broadcasts_created_at
  ON telegram_broadcasts(created_at DESC);
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS checkout_drafts (
    id SERIAL PRIMARY KEY,
    token VARCHAR(128) NOT NULL UNIQUE,
    payload JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
  );
`);

await pool.query(`
  CREATE INDEX IF NOT EXISTS idx_checkout_drafts_token
  ON checkout_drafts(token);
`);

await pool.query(`
  CREATE INDEX IF NOT EXISTS idx_checkout_drafts_expires_at
  ON checkout_drafts(expires_at);
`);

await pool.query(`
  ALTER TABLE telegram_gifts
  ADD COLUMN IF NOT EXISTS available_after_orders_count INTEGER;
`);

await pool.query(`
  CREATE INDEX IF NOT EXISTS idx_telegram_gifts_available_after_orders_count
  ON telegram_gifts(available_after_orders_count);
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS telegram_pending_links (
    id SERIAL PRIMARY KEY,
    phone_normalized VARCHAR(32) NOT NULL UNIQUE,
    telegram_user_id VARCHAR(64) NOT NULL,
    telegram_username VARCHAR(255) NOT NULL DEFAULT '',
    telegram_first_name VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );
`);

await pool.query(`
  CREATE INDEX IF NOT EXISTS idx_telegram_pending_links_phone
  ON telegram_pending_links(phone_normalized);
`);

await pool.query(`
  CREATE INDEX IF NOT EXISTS idx_telegram_pending_links_created_at
  ON telegram_pending_links(created_at DESC);
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS site_events (
    id BIGSERIAL PRIMARY KEY,
    visitor_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    event_name TEXT NOT NULL,
    path TEXT DEFAULT '',
    page_url TEXT DEFAULT '',
    referrer TEXT DEFAULT '',
    user_agent TEXT DEFAULT '',
    device_type TEXT DEFAULT 'desktop',
    order_id BIGINT,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_internal BOOLEAN DEFAULT FALSE,
    is_test BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
  );
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS internal_visitors (
    id BIGSERIAL PRIMARY KEY,
    visitor_id TEXT UNIQUE NOT NULL,
    label TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
  );
`);

await pool.query(`
  CREATE INDEX IF NOT EXISTS idx_site_events_created_at
  ON site_events(created_at DESC);
`);

await pool.query(`
  CREATE INDEX IF NOT EXISTS idx_site_events_visitor_id
  ON site_events(visitor_id);
`);

await pool.query(`
  CREATE INDEX IF NOT EXISTS idx_site_events_session_id
  ON site_events(session_id);
`);

await pool.query(`
  CREATE INDEX IF NOT EXISTS idx_site_events_event_name
  ON site_events(event_name);
`);

await pool.query(`
  CREATE INDEX IF NOT EXISTS idx_site_events_is_internal
  ON site_events(is_internal);
`);

}
