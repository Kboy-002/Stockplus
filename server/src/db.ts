import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn(
    "Warning: DATABASE_URL is not set. Set it in server/.env (see .env.example).",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const INIT_SQL = `
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  shop_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Idempotent column additions for existing databases
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_admin  BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS vendor_whitelist (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL UNIQUE,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  name VARCHAR(500) NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  expiry_date TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_vendor ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
`;

const SEED_CATEGORIES = `
INSERT INTO categories (name) VALUES
  ('Snacks'),
  ('Drinks'),
  ('Meals'),
  ('Stationery'),
  ('Personal Care')
ON CONFLICT (name) DO NOTHING;
`;

export async function initDb(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(INIT_SQL);
    await client.query(SEED_CATEGORIES);
  } finally {
    client.release();
  }
}
