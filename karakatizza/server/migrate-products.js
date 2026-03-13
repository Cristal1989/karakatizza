import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool, initDb } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const productsFilePath = path.join(__dirname, "data", "products.json");

async function migrate() {
  await initDb();

  const raw = fs.readFileSync(productsFilePath, "utf-8");
  const products = JSON.parse(raw);

  for (const product of products) {
    await pool.query(
      `INSERT INTO products (
        id, name, price, category, description, image, popular, promo_type
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        price = EXCLUDED.price,
        category = EXCLUDED.category,
        description = EXCLUDED.description,
        image = EXCLUDED.image,
        popular = EXCLUDED.popular,
        promo_type = EXCLUDED.promo_type`,
      [
        product.id,
        product.name,
        Number(product.price),
        product.category,
        product.description || "",
        product.image || "",
        !!product.popular,
        product.promoType || "none",
      ]
    );
  }

  console.log("Products migrated successfully");
  await pool.end();
  process.exit(0);
}

migrate().catch(async (error) => {
  console.error("Migration error:", error);
  await pool.end();
  process.exit(1);
});
