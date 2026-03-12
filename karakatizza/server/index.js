import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import cloudinary from "./cloudinary.js";

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

app.get("/products", (req, res) => {
  try {
    const products = readProducts();
    return res.json(products);
  } catch (error) {
    return res.status(500).json({
      message: "Не вдалося отримати товари",
      error: error.message,
    });
  }
});

app.get("/", (req, res) => {
  res.send("Server running");
});

app.post("/products", upload.single("image"), async (req, res) => {
  try {
    const products = readProducts();
    const { name, price, category, description } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({
        message: "Необхідні поля: name, price, category",
      });
    }

    let imageUrl = "";

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      imageUrl = result.secure_url;

      // удаляем временный файл после загрузки в Cloudinary
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }

    const newProduct = {
      id: uuidv4(),
      name,
      price: Number(price),
      category,
      description: description || "",
      image: imageUrl,
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

app.post("/order", async (req, res) => {
  try {
    console.log("1. /order викликався");
    console.log("2. req.body:", req.body);

    const order = req.body;

    if (!order || !order.items || !order.customer) {
      console.log("3. Некоректний payload");
      return res.status(400).json({
        message: "Некоректні дані замовлення",
      });
    }

    let text = `🛒 Нове замовлення\n\n`;

    order.items.forEach((item) => {
      text += `• ${item.name} x ${item.quantity} — ${
        item.price * item.quantity
      } грн\n`;
    });

    text += `\n💰 Сума: ${order.total} грн`;
    text += `\n👤 ${order.customer.name}`;
    text += `\n📞 ${order.customer.phone}`;
    text += `\n📍 ${order.customer.address}`;

    if (order.customer.comment) {
      text += `\n📝 ${order.customer.comment}`;
    }

    console.log("4. Сформований текст:");
    console.log(text);

    console.log("5. BOT_TOKEN:", BOT_TOKEN ? "є" : "нема");
    console.log("6. CHAT_ID:", CHAT_ID);

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text,
        }),
      }
    );

    console.log("7. telegramResponse.status:", telegramResponse.status);

    const telegramData = await telegramResponse.json();

    console.log("8. telegramData:", telegramData);

    if (!telegramData.ok) {
      return res.status(500).json({
        message: "Помилка при відправці в Telegram",
        telegramData,
      });
    }

    return res.json({
      success: true,
      message: "Замовлення успішно відправлено",
    });
  } catch (error) {
    console.error("9. SERVER ERROR:", error);

    return res.status(500).json({
      message: "Помилка сервера",
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

app.put("/products/:id", upload.single("image"), (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, category, description } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({
        message: "Заповни назву, ціну і категорію",
      });
    }

    const products = readProducts();
    const productIndex = products.findIndex(
      (product) => String(product.id) === String(id)
    );

    if (productIndex === -1) {
      return res.status(404).json({
        message: "Товар не знайдено",
      });
    }

    const oldProduct = products[productIndex];

    let imagePath = oldProduct.image || "";

    if (req.file) {
      if (oldProduct.image && oldProduct.image.startsWith("/uploads/")) {
        try {
          const oldFileName = oldProduct.image.replace("/uploads/", "");
          const oldImageFullPath = path.join(uploadsDir, oldFileName);

          if (fs.existsSync(oldImageFullPath)) {
            fs.unlinkSync(oldImageFullPath);
          }
        } catch (fileError) {
          console.error("Помилка видалення старого фото:", fileError.message);
        }
      }

      imagePath = `/uploads/${req.file.filename}`;
    }

    const updatedProduct = {
      ...oldProduct,
      name,
      price: Number(price),
      category,
      description: description || "",
      image: imagePath,
    };

    products[productIndex] = updatedProduct;
    writeProducts(products);

    return res.json({
      success: true,
      product: updatedProduct,
    });
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);
    return res.status(500).json({
      message: "Не вдалося оновити товар",
      error: error.message,
    });
  }
});

app.use((err, req, res, next) => {
  console.error("GLOBAL SERVER ERROR:", err);

  if (err instanceof multer.MulterError) {
    return res.status(500).json({
      message: "Помилка завантаження файлу",
      error: err.message,
    });
  }

  return res.status(500).json({
    message: "Внутрішня помилка сервера",
    error: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
