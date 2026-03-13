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
      SELECT id, name, price, category, description, image,
      popular,
      promo_type AS "promoType"
      FROM products
      ORDER BY created_at ASC
    `);

    const products = result.rows.map((p) => ({
      ...p,
      price: Number(p.price),
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
    const products = readProducts();
    const { name, price, category, description, popular, promoType } = req.body;

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
    };

    products.push(newProduct);
    writeProducts(products);

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

app.put("/products/:id", upload.single("image"), (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, category, description, popular, promoType } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({
        message: "Необхідні поля: name, price, category",
      });
    }

    const products = readProducts();
    const productIndex = products.findIndex(
      (product) => String(product.id) === String(id)
    );

    if (productIndex === -1) {
      return res.status(404).json({ message: "Товар не знайдено" });
    }

    const oldProduct = products[productIndex];
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
      ...oldProduct,
      name,
      price: Number(price),
      category,
      description: description || "",
      image: imageUrl,
      popular: popular === "true",
      promoType: promoType || "none",
    };

    products[productIndex] = updatedProduct;
    writeProducts(products);

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

app.delete("/products/:id", (req, res) => {
  try {
    const { id } = req.params;
    const products = readProducts();

    const productToDelete = products.find(
      (product) => String(product.id) === String(id)
    );

    if (!productToDelete) {
      return res.status(404).json({
        message: "Товар не знайдено",
      });
    }

    const updatedProducts = products.filter(
      (product) => String(product.id) !== String(id)
    );

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

    writeProducts(updatedProducts);

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
    const { name, phone, address, comment, items, total } = req.body;

    let message = `🆕 НОВЕ ЗАМОВЛЕННЯ\n\n`;

    message`+= 👤 Ім'я: ${name}\n`;
    message`+= 📞 Телефон: ${phone}\n`;
    message`+= 📍 Адреса: ${address}\n\n`;

    message`+= 🧾 Замовлення:\n`;

    items.forEach((item) => {
      message += `• ${item.name} x${item.quantity}\n`;
    });

    message += `\n💰 Разом: ${total} грн\n`;

    if (comment) {
      message += `\n💬 Коментар: ${comment}`;
    }

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
