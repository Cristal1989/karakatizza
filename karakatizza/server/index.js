import { pool, initDb } from "./db.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const productsFilePath = path.join(__dirname, "data", "products.json");
const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({ storage });

function readProducts() {
  try {
    const data = fs.readFileSync(productsFilePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function writeProducts(products) {
  fs.writeFileSync(
    productsFilePath,
    JSON.stringify(products, null, 2),
    "utf-8"
  );
}

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

const PORT = process.env.PORT || 5000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

app.get("/", (req, res) => {
  res.send("Server running");
});

app.get("/products", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        price,
        category,
        description,
        image,
        popular,
        promo_type AS "promoType",
        priority
      FROM products
      ORDER BY priority ASC, created_at ASC
    `);

    const products = result.rows.map((p) => ({
      ...p,
      price: Number(p.price),
      priority: Number(p.priority ?? 10),
      popular: !!p.popular,
      promoType: p.promoType || "none",
    }));

    return res.json(products);
  } catch (error) {
    return res.status(500).json({
      message: "Не вдалося отримати товари",
      error: error.message,
    });
  }
});

app.post("/products", upload.single("image"), async (req, res) => {
  try {
    const { name, price, category, description, popular, promoType, priority } =
      req.body;

    if (!name || !price || !category) {
      return res.status(400).json({
        message: "Необхідні поля: name, price, category",
      });
    }

    let imageUrl = "";
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const newProduct = {
      id: uuidv4(),
      name,
      price: Number(price),
      category,
      description: description || "",
      image: imageUrl,
      popular: popular === "true",
      promoType: promoType || "none",
      priority: Number(priority) || 10,
    };

    await pool.query(
      `INSERT INTO products (
        id, name, price, category, description, image, popular, promo_type, priority
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        newProduct.id,
        newProduct.name,
        newProduct.price,
        newProduct.category,
        newProduct.description,
        newProduct.image,
        newProduct.popular,
        newProduct.promoType,
        newProduct.priority,
      ]
    );

    return res.status(201).json({
      success: true,
      product: newProduct,
    });
  } catch (error) {
    console.error("POST PRODUCT ERROR:", error);
    return res.status(500).json({
      message: "Помилка створення товару",
      error: error.message,
    });
  }
});

app.put("/products/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, category, description, popular, promoType, priority } =
      req.body;

    if (!name || !price || !category) {
      return res.status(400).json({
        message: "Необхідні поля: name, price, category",
      });
    }

    const existing = await pool.query(`SELECT * FROM products WHERE id = $1`, [
      id,
    ]);

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Товар не знайдено" });
    }

    const oldProduct = existing.rows[0];
    let imageUrl = oldProduct.image || "";

    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;

      if (oldProduct.image && oldProduct.image.startsWith("/uploads/")) {
        try {
          const oldFileName = oldProduct.image.replace("/uploads/", "");
          const oldImagePath = path.join(uploadsDir, oldFileName);

          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        } catch (fileError) {
          console.error("Помилка видалення старого фото:", fileError.message);
        }
      }
    }

    const updatedProduct = {
      id,
      name,
      price: Number(price),
      category,
      description: description || "",
      image: imageUrl,
      popular: popular === "true",
      promoType: promoType || "none",
      priority: Number(priority) || 10,
    };

    await pool.query(
      `UPDATE products
       SET name = $1,
           price = $2,
           category = $3,
           description = $4,
           image = $5,
           popular = $6,
           promo_type = $7,
           priority = $8
       WHERE id = $9`,
      [
        updatedProduct.name,
        updatedProduct.price,
        updatedProduct.category,
        updatedProduct.description,
        updatedProduct.image,
        updatedProduct.popular,
        updatedProduct.promoType,
        updatedProduct.priority,
        updatedProduct.id,
      ]
    );

    return res.json({
      success: true,
      product: updatedProduct,
    });
  } catch (error) {
    console.error("PUT PRODUCT ERROR:", error);
    return res.status(500).json({
      message: "Помилка оновлення товару",
      error: error.message,
    });
  }
});

app.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query(`SELECT * FROM products WHERE id = $1`, [
      id,
    ]);

    if (existing.rows.length === 0) {
      return res.status(404).json({
        message: "Товар не знайдено",
      });
    }

    const productToDelete = existing.rows[0];

    if (
      productToDelete.image &&
      productToDelete.image.startsWith("/uploads/")
    ) {
      try {
        const fileName = productToDelete.image.replace("/uploads/", "");
        const imagePath = path.join(uploadsDir, fileName);

        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (fileError) {
        console.error("Помилка видалення файлу:", fileError.message);
      }
    }

    await pool.query(`DELETE FROM products WHERE id = $1`, [id]);

    return res.json({
      success: true,
      message: "Товар видалено",
    });
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);
    return res.status(500).json({
      message: "Не вдалося видалити товар",
      error: error.message,
    });
  }
});

app.post("/order", async (req, res) => {
  try {
    const { name, phone, address, comment, items, totalPrice } = req.body;

    let message = `🆕 НОВЕ ЗАМОВЛЕННЯ\n\n`;

    message += `👤 Ім'я: ${name}\n`;
    message += `📞 Телефон: ${phone}\n`;
    message += `📍 Адреса: ${address}\n\n`;

    message += `🧾 Замовлення:\n`;

    items.forEach((item) => {
      const paidQuantity = item.paidQuantity ?? item.quantity ?? 0;
      const freeQuantity = item.freeQuantity ?? 0;
      const lineTotal = item.lineTotal ?? item.price * paidQuantity;

      message += `• ${item.name} — ${item.quantity} шт`;

      if (freeQuantity > 0) {
        message += `(${paidQuantity} платно + ${freeQuantity} у подарунок)`;
      }

      message += `— ${lineTotal} грн\n`;
    });

    const telegramUrl = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`;

    try {
      await fetch(telegramUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: process.env.CHAT_ID,
          text: message,
        }),
      });
    } catch (telegramError) {
      console.log("⚠️ Telegram error:", telegramError.message);
    }

    res.json({
      success: true,
      message: "Замовлення прийнято",
    });
  } catch (error) {
    console.error("Order error:", error);

    res.json({
      success: true,
      message: "Замовлення прийнято",
    });
  }
});

app.use((err, req, res, next) => {
  console.error("GLOBAL SERVER ERROR:");
  console.error(err);

  return res.status(500).json({
    message: "Внутрішня помилка сервера",
    error: err?.message || "Unknown error",
  });
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("DB INIT ERROR:", error);
    process.exit(1);
  });
