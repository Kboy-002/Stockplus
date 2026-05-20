/**
 * Prepopulate demo stores and products. Safe to run multiple times: clears only
 * products for the demo vendor emails, then re-inserts.
 *
 * Same product name can appear in different stores — each store has its own row.
 *
 * Usage: DATABASE_URL=... npm run db:seed
 * Default login for all demo accounts: email below + password "demo12345"
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { initDb, pool } from "../db.js";

const DEMO_PASSWORD = "demo12345";

const DEMO_VENDORS = [
  // Existing 3 (kept emails + owner names, renamed shops)
  {
    email: "corner@demo.stockpulse",
    name: "Ada Okafor",
    shop_name: "Peter Hall",
  },
  {
    email: "campus@demo.stockpulse",
    name: "Emeka Nwosu",
    shop_name: "John Hall",
  },
  {
    email: "express@demo.stockpulse",
    name: "Chioma Eze",
    shop_name: "Joseph Hall",
  },
  // New 5 (empty until they add products)
  {
    email: "paul-hall@demo.stockpulse",
    name: "Tunde Adeleke",
    shop_name: "Paul Hall",
  },
  {
    email: "daniel-hall@demo.stockpulse",
    name: "Bukola Adekunle",
    shop_name: "Daniel Hall",
  },
  {
    email: "lydia-hall@demo.stockpulse",
    name: "Funmi Akinola",
    shop_name: "Lydia Hall",
  },
  {
    email: "esther-hall@demo.stockpulse",
    name: "Aisha Bello",
    shop_name: "Esther Hall",
  },
  {
    email: "mary-hall@demo.stockpulse",
    name: "Grace Eze",
    shop_name: "Mary Hall",
  },
] as const;

type ProductSeed = {
  vendorEmail: (typeof DEMO_VENDORS)[number]["email"];
  name: string;
  categoryName: string;
  price: number;
  quantity: number;
  /** days from now, or null for no expiry */
  expiryDays: number | null;
};

const DEMO_PRODUCTS: ProductSeed[] = [
  // Corner Shop
  {
    vendorEmail: "corner@demo.stockpulse",
    name: "Coca Cola 500ml",
    categoryName: "Drinks",
    price: 200,
    quantity: 50,
    expiryDays: 30,
  },
  {
    vendorEmail: "corner@demo.stockpulse",
    name: "Gala Sausage Roll",
    categoryName: "Snacks",
    price: 300,
    quantity: 25,
    expiryDays: 5,
  },
  // Campus Mart — same drink name as Corner, different price/stock (separate row)
  {
    vendorEmail: "campus@demo.stockpulse",
    name: "Coca Cola 500ml",
    categoryName: "Drinks",
    price: 250,
    quantity: 40,
    expiryDays: 45,
  },
  {
    vendorEmail: "campus@demo.stockpulse",
    name: "Indomie Noodles",
    categoryName: "Meals",
    price: 150,
    quantity: 80,
    expiryDays: 60,
  },
  {
    vendorEmail: "campus@demo.stockpulse",
    name: "Bic Pen (Blue)",
    categoryName: "Stationery",
    price: 100,
    quantity: 200,
    expiryDays: null,
  },
  // Express — another overlapping name on purpose
  {
    vendorEmail: "express@demo.stockpulse",
    name: "Indomie Noodles",
    categoryName: "Meals",
    price: 180,
    quantity: 120,
    expiryDays: 90,
  },
  {
    vendorEmail: "express@demo.stockpulse",
    name: "Pepsi 35cl",
    categoryName: "Drinks",
    price: 150,
    quantity: 8,
    expiryDays: 2,
  },
  {
    vendorEmail: "express@demo.stockpulse",
    name: "Dettol Soap",
    categoryName: "Personal Care",
    price: 400,
    quantity: 20,
    expiryDays: 180,
  },
];

function expiryDate(days: number | null): Date | null {
  if (days === null) return null;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("Set DATABASE_URL (e.g. in server/.env)");
    process.exit(1);
  }

  await initDb();
  const password_hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const vendorIds = new Map<string, string>();

    for (const v of DEMO_VENDORS) {
      const ins = await client.query<{ id: string }>(
        `INSERT INTO vendors (name, email, password_hash, shop_name)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE SET
           name = EXCLUDED.name,
           shop_name = EXCLUDED.shop_name,
           password_hash = EXCLUDED.password_hash
         RETURNING id`,
        [v.name, v.email, password_hash, v.shop_name],
      );
      vendorIds.set(v.email, ins.rows[0].id);
    }

    const ids = [...vendorIds.values()];
    await client.query(`DELETE FROM products WHERE vendor_id = ANY($1::uuid[])`, [
      ids,
    ]);

    const catCache = new Map<string, number>();
    async function categoryId(name: string): Promise<number> {
      const hit = catCache.get(name);
      if (hit !== undefined) return hit;
      const r = await client.query<{ id: number }>(
        `SELECT id FROM categories WHERE name = $1`,
        [name],
      );
      const row = r.rows[0];
      if (!row) throw new Error(`Unknown category: ${name}`);
      catCache.set(name, row.id);
      return row.id;
    }

    for (const p of DEMO_PRODUCTS) {
      const vid = vendorIds.get(p.vendorEmail);
      if (!vid) throw new Error(`Missing vendor ${p.vendorEmail}`);
      const cid = await categoryId(p.categoryName);
      const exp = expiryDate(p.expiryDays);
      await client.query(
        `INSERT INTO products (vendor_id, category_id, name, price, quantity, expiry_date)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [vid, cid, p.name, p.price, p.quantity, exp],
      );
    }

    await client.query("COMMIT");
    console.log(
      `Seeded ${DEMO_VENDORS.length} stores and ${DEMO_PRODUCTS.length} products.`,
    );
    console.log(`Demo password for all: ${DEMO_PASSWORD}`);
    console.log("Log in with:");
    for (const v of DEMO_VENDORS) {
      console.log(`  ${v.email}`);
    }
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
