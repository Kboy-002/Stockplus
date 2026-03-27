import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool, initDb } from "./db.js";

const PORT = Number(process.env.PORT) || 5000;
function readJwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) {
    console.error("FATAL: Set JWT_SECRET in server/.env");
    process.exit(1);
  }
  return s;
}
const JWT_SECRET = readJwtSecret();

const app = express();
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : ["http://localhost:5173", "http://127.0.0.1:5173"];

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
);
app.use(express.json());

// Root URL has no UI — API lives under /api (browsers hitting the host alone see this JSON)
app.get("/", (_req, res) => {
  res.json({ ok: true, service: "rvet-api", apiBase: "/api" });
});

interface VendorRow {
  id: string;
  name: string;
  email: string;
  shop_name: string;
}

function vendorJson(row: VendorRow) {
  return {
    _id: row.id,
    name: row.name,
    email: row.email,
    shop_name: row.shop_name,
  };
}

interface ProductJoinRow {
  id: string;
  vendor_id: string;
  category_id: number;
  name: string;
  price: string;
  quantity: number;
  expiry_date: Date | null;
  created_at: Date;
  updated_at: Date;
  v_id: string;
  v_name: string;
  v_email: string;
  v_shop_name: string;
  c_id: string;
  c_name: string;
}

function mapProduct(row: ProductJoinRow) {
  return {
    _id: row.id,
    vendor_id: {
      _id: row.v_id,
      name: row.v_name,
      email: row.v_email,
      shop_name: row.v_shop_name,
    },
    category_id: {
      _id: String(row.c_id),
      name: row.c_name,
    },
    name: row.name,
    price: Number(row.price),
    quantity: row.quantity,
    expiry_date: row.expiry_date
      ? new Date(row.expiry_date).toISOString()
      : null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

const productSelect = `
  SELECT
    p.id,
    p.vendor_id,
    p.category_id,
    p.name,
    p.price,
    p.quantity,
    p.expiry_date,
    p.created_at,
    p.updated_at,
    v.id AS v_id,
    v.name AS v_name,
    v.email AS v_email,
    v.shop_name AS v_shop_name,
    c.id::text AS c_id,
    c.name AS c_name
  FROM products p
  JOIN vendors v ON v.id = p.vendor_id
  JOIN categories c ON c.id = p.category_id
`;

function computeStats(products: ReturnType<typeof mapProduct>[]) {
  const today = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(today.getDate() + 7);

  return {
    totalProducts: products.length,
    outOfStockItems: products.filter((p) => p.quantity === 0).length,
    expiringItems: products.filter((p) => {
      if (!p.expiry_date) return false;
      const expiry = new Date(p.expiry_date);
      return expiry >= today && expiry <= sevenDaysFromNow;
    }).length,
  };
}

function parseExpiry(body: { expiry_date?: string | null }): Date | null {
  const raw = body.expiry_date;
  if (raw === undefined || raw === null || raw === "") return null;
  const d = new Date(String(raw));
  return Number.isNaN(d.getTime()) ? null : d;
}

declare global {
  namespace Express {
    interface Request {
      vendorId?: string;
    }
  }
}

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as { sub: string };
    req.vendorId = payload.sub;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

// --- Auth ---
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, shop_name } = req.body ?? {};
    if (!name || !email || !password || !shop_name) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }
    if (String(password).length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters" });
      return;
    }
    const password_hash = await bcrypt.hash(String(password), 10);
    const result = await pool.query<VendorRow>(
      `INSERT INTO vendors (name, email, password_hash, shop_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, shop_name`,
      [name, email.toLowerCase(), password_hash, shop_name],
    );
    const vendor = result.rows[0];
    const token = jwt.sign({ sub: vendor.id }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({ token, vendor: vendorJson(vendor) });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "23505") {
      res.status(409).json({ message: "Email already registered" });
      return;
    }
    console.error(e);
    res.status(500).json({ message: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      res.status(400).json({ message: "Missing email or password" });
      return;
    }
    const result = await pool.query<VendorRow & { password_hash: string }>(
      `SELECT id, name, email, shop_name, password_hash FROM vendors WHERE email = $1`,
      [String(email).toLowerCase()],
    );
    const row = result.rows[0];
    if (!row || !(await bcrypt.compare(String(password), row.password_hash))) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }
    const vendor = {
      id: row.id,
      name: row.name,
      email: row.email,
      shop_name: row.shop_name,
    };
    const token = jwt.sign({ sub: vendor.id }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({ token, vendor: vendorJson(vendor) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Login failed" });
  }
});

// --- Vendor (protected) ---
app.get("/api/vendor/products", authMiddleware, async (req, res) => {
  try {
    const vid = req.vendorId!;
    const result = await pool.query<ProductJoinRow>(
      `${productSelect} WHERE p.vendor_id = $1 ORDER BY p.created_at DESC`,
      [vid],
    );
    res.json(result.rows.map(mapProduct));
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to load products" });
  }
});

app.post("/api/vendor/products", authMiddleware, async (req, res) => {
  try {
    const vid = req.vendorId!;
    const { name, category_id, price, quantity, expiry_date } = req.body ?? {};
    if (!name || category_id === undefined || price === undefined || quantity === undefined) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }
    const catId = Number(category_id);
    if (Number.isNaN(catId)) {
      res.status(400).json({ message: "Invalid category" });
      return;
    }
    const expiry = parseExpiry({ expiry_date });
    const ins = await pool.query<{ id: string }>(
      `INSERT INTO products (vendor_id, category_id, name, price, quantity, expiry_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [vid, catId, String(name), Number(price), Number(quantity), expiry],
    );
    const newId = ins.rows[0].id;
    const full = await pool.query<ProductJoinRow>(
      `${productSelect} WHERE p.id = $1`,
      [newId],
    );
    res.status(201).json(mapProduct(full.rows[0]));
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "23503") {
      res.status(400).json({ message: "Invalid category" });
      return;
    }
    console.error(e);
    res.status(500).json({ message: "Failed to add product" });
  }
});

app.put("/api/vendor/products/:id", authMiddleware, async (req, res) => {
  try {
    const vid = req.vendorId!;
    const productId = req.params.id;
    const { name, category_id, price, quantity, expiry_date } = req.body ?? {};
    if (!name || category_id === undefined || price === undefined || quantity === undefined) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }
    const catId = Number(category_id);
    if (Number.isNaN(catId)) {
      res.status(400).json({ message: "Invalid category" });
      return;
    }
    const expiry = parseExpiry({ expiry_date });
    const upd = await pool.query<{ id: string }>(
      `UPDATE products
       SET name = $1, category_id = $2, price = $3, quantity = $4, expiry_date = $5, updated_at = now()
       WHERE id = $6 AND vendor_id = $7
       RETURNING id`,
      [String(name), catId, Number(price), Number(quantity), expiry, productId, vid],
    );
    if (upd.rows.length === 0) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    const full = await pool.query<ProductJoinRow>(
      `${productSelect} WHERE p.id = $1`,
      [productId],
    );
    res.json(mapProduct(full.rows[0]));
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "23503") {
      res.status(400).json({ message: "Invalid category" });
      return;
    }
    console.error(e);
    res.status(500).json({ message: "Failed to update product" });
  }
});

app.delete("/api/vendor/products/:id", authMiddleware, async (req, res) => {
  try {
    const vid = req.vendorId!;
    const productId = req.params.id;
    const del = await pool.query(
      `DELETE FROM products WHERE id = $1 AND vendor_id = $2 RETURNING id`,
      [productId, vid],
    );
    if (del.rows.length === 0) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    res.json({ message: "Product deleted" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to delete product" });
  }
});

app.patch("/api/vendor/products/:id/stock", authMiddleware, async (req, res) => {
  try {
    const vid = req.vendorId!;
    const productId = req.params.id;
    const { quantity } = req.body ?? {};
    if (quantity === undefined || Number.isNaN(Number(quantity))) {
      res.status(400).json({ message: "Invalid quantity" });
      return;
    }
    const upd = await pool.query<{ id: string }>(
      `UPDATE products SET quantity = $1, updated_at = now()
       WHERE id = $2 AND vendor_id = $3
       RETURNING id`,
      [Number(quantity), productId, vid],
    );
    if (upd.rows.length === 0) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    const full = await pool.query<ProductJoinRow>(
      `${productSelect} WHERE p.id = $1`,
      [productId],
    );
    res.json(mapProduct(full.rows[0]));
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to update stock" });
  }
});

app.get("/api/vendor/stats", authMiddleware, async (req, res) => {
  try {
    const vid = req.vendorId!;
    const result = await pool.query<ProductJoinRow>(
      `${productSelect} WHERE p.vendor_id = $1`,
      [vid],
    );
    const products = result.rows.map(mapProduct);
    res.json(computeStats(products));
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to load stats" });
  }
});

// --- Catalog (public) ---
app.get("/api/catalog/categories", async (_req, res) => {
  try {
    const result = await pool.query<{ id: number; name: string }>(
      `SELECT id, name FROM categories ORDER BY id`,
    );
    res.json(
      result.rows.map((r) => ({ _id: String(r.id), name: r.name })),
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to load categories" });
  }
});

app.get("/api/catalog/products", async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice } = req.query;
    const conditions: string[] = [
      "p.quantity > 0",
      "(p.expiry_date IS NULL OR p.expiry_date >= NOW())",
    ];
    const params: unknown[] = [];
    let n = 1;

    if (typeof category === "string" && category !== "") {
      conditions.push(`c.id::text = $${n++}`);
      params.push(category);
    }
    if (typeof search === "string" && search.trim() !== "") {
      conditions.push(`p.name ILIKE $${n++}`);
      params.push(`%${search.trim()}%`);
    }
    if (typeof minPrice === "string" && minPrice !== "") {
      conditions.push(`p.price >= $${n++}`);
      params.push(Number(minPrice));
    }
    if (typeof maxPrice === "string" && maxPrice !== "") {
      conditions.push(`p.price <= $${n++}`);
      params.push(Number(maxPrice));
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await pool.query<ProductJoinRow>(
      `${productSelect} ${where} ORDER BY p.created_at DESC`,
      params,
    );
    res.json(result.rows.map(mapProduct));
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to load catalog" });
  }
});

async function main() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
