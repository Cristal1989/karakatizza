import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import compression from "compression";
import cloudinary from "./cloudinary.js";
import { pool, initDb } from "./db.js";
import deliveryRoutes from "./routes/delivery.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const productsFilePath = path.join(__dirname, "data", "products.json");

const app = express();
app.use(compression());

await initDb();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());
app.use(express.json());
app.use("/api/delivery", deliveryRoutes);

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isBanner =
      file.fieldname === "image" || file.fieldname === "mobileImage";

    return {
      folder: isBanner ? "karakatizza/banners" : "karakatizza/products",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    };
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
        priority,
        discount_offer_eligible AS "discountOfferEligible"
      FROM products
      ORDER BY priority ASC, created_at ASC
    `);

    const products = result.rows.map((p) => ({
      ...p,
      price: Number(p.price),
      priority: Number(p.priority ?? 10),
      popular: !!p.popular,
      promoType: p.promoType || "none",
      discountOfferEligible: !!p.discountOfferEligible,
    }));

    res.set("Cache-Control", "public, max-age=120");

    return res.json(products);
  } catch (error) {
    return res.status(500).json({
      message: "Не вдалося отримати товари",
      error: error.message,
    });
  }
});

app.get("/banners", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        image,
        mobile_image AS "mobileImage",
        link,
        title,
        is_active AS "isActive",
        priority,
        click_count AS "clickCount",
        end_at AS "endAt"
      FROM banners
      ORDER BY priority ASC, created_at ASC
    `);

    const banners = result.rows.map((banner) => ({
      ...banner,
      isActive: !!banner.isActive,
      priority: Number(banner.priority ?? 10),
      clickCount: Number(banner.clickCount ?? 0),
      endAt: banner.endAt || null,
    }));

    res.set("Cache-Control", "public, max-age=120");

    return res.json(banners);
  } catch (error) {
    return res.status(500).json({
      message: "Не вдалося отримати банери",
      error: error.message,
    });
  }
});

app.post("/products", upload.single("image"), async (req, res) => {
  try {
    const {
      name,
      price,
      category,
      description,
      popular,
      promoType,
      priority,
      discountOfferEligible,
    } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({
        message: "Необхідні поля: name, price, category",
      });
    }

    const imageUrl = req.file?.path || "";

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
      discountOfferEligible: discountOfferEligible === "true",
    };

    await pool.query(
      `INSERT INTO products (
  id,
  name,
  price,
  category,
  description,
  image,
  popular,
  promo_type,
  priority,
  discount_offer_eligible
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
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
        newProduct.discountOfferEligible,
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

app.post(
  "/banners",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "mobileImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { link, title, isActive, priority, endAt } = req.body;

      const desktopFile = req.files?.image?.[0];
      const mobileFile = req.files?.mobileImage?.[0];

      if (!desktopFile) {
        return res.status(400).json({
          message: "Потрібно завантажити основний банер",
        });
      }

      const newBanner = {
        id: uuidv4(),
        image: desktopFile.path,
        mobileImage: mobileFile ? mobileFile.path : "",
        link: link || "#menu",
        title: title || "",
        isActive: isActive === "true",
        priority: Number(priority) || 10,
        endAt: endAt || null,
      };

      await pool.query(
        `INSERT INTO banners (
          id, image, mobile_image, link, title, is_active, priority, end_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          newBanner.id,
          newBanner.image,
          newBanner.mobileImage,
          newBanner.link,
          newBanner.title,
          newBanner.isActive,
          newBanner.priority,
          newBanner.endAt,
        ]
      );

      return res.status(201).json({
        success: true,
        banner: newBanner,
      });
    } catch (error) {
      console.error("POST BANNER ERROR:", error);

      return res.status(500).json({
        message: "Помилка створення банера",
        error: error.message,
      });
    }
  }
);

app.put("/products/:id", (req, res) => {
  upload.single("image")(req, res, async (uploadError) => {
    if (uploadError) {
      console.error("UPLOAD PRODUCT ERROR:", uploadError);

      return res.status(500).json({
        message: "Помилка завантаження фото",
        error: uploadError.message,
      });
    }

    try {
      const { id } = req.params;
      const {
        name,
        price,
        category,
        description,
        popular,
        promoType,
        priority,
        discountOfferEligible,
      } = req.body;

      console.log("PUT PRODUCT BODY:", req.body);
      console.log("PUT PRODUCT FILE:", req.file);

      if (!name || !price || !category) {
        return res.status(400).json({
          message: "Необхідні поля: name, price, category",
        });
      }

      const existing = await pool.query(
        `SELECT * FROM products WHERE id = $1`,
        [id]
      );
      req.file;
      if (existing.rows.length === 0) {
        return res.status(404).json({ message: "Товар не знайдено" });
      }

      const oldProduct = existing.rows[0];
      let imageUrl = oldProduct.image || "";

      if (req.file) {
        console.log("UPLOAD FILE:", req.file);

        imageUrl = req.file.path || req.file.secure_url || oldProduct.image;

        if (
          oldProduct.image &&
          oldProduct.image.includes("res.cloudinary.com")
        ) {
          try {
            const parts = oldProduct.image.split("/");
            const uploadIndex = parts.findIndex((part) => part === "upload");
            const publicIdWithExt = parts.slice(uploadIndex + 2).join("/");
            const publicId = publicIdWithExt.replace(/\.[^/.]+$/, "");

            try {
              await cloudinary.uploader.destroy(publicId);
            } catch (err) {
              console.log("Cloudinary delete error:", err.message);
            }
          } catch (deleteError) {
            console.error(
              "Помилка видалення старого фото:",
              deleteError.message
            );
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
        discountOfferEligible: discountOfferEligible === "true",
      };

      console.log("BODY:", req.body);

      await pool.query(
        `UPDATE products
   SET name = $1,
       price = $2,
       category = $3,
       description = $4,
       image = $5,
       popular = $6,
       promo_type = $7,
       priority = $8,
       discount_offer_eligible = $9
   WHERE id = $10`,
        [
          updatedProduct.name,
          updatedProduct.price,
          updatedProduct.category,
          updatedProduct.description,
          updatedProduct.image,
          updatedProduct.popular,
          updatedProduct.promoType,
          updatedProduct.priority,
          updatedProduct.discountOfferEligible,
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
});

app.put(
  "/banners/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "mobileImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { link, title, isActive, priority, endAt } = req.body;

      const existing = await pool.query(`SELECT * FROM banners WHERE id = $1`, [
        id,
      ]);

      if (existing.rows.length === 0) {
        return res.status(404).json({
          message: "Банер не знайдено",
        });
      }

      const oldBanner = existing.rows[0];

      const desktopFile = req.files?.image?.[0];
      const mobileFile = req.files?.mobileImage?.[0];

      let imageUrl = oldBanner.image || "";
      let mobileImageUrl = oldBanner.mobile_image || "";

      if (desktopFile) {
        imageUrl = desktopFile.path;

        if (oldBanner.image && oldBanner.image.includes("res.cloudinary.com")) {
          try {
            const parts = oldBanner.image.split("/");
            const uploadIndex = parts.findIndex((part) => part === "upload");
            const publicIdWithExt = parts.slice(uploadIndex + 2).join("/");
            const publicId = publicIdWithExt.replace(/\.[^/.]+$/, "");
            await cloudinary.uploader.destroy(publicId);
          } catch (fileError) {
            console.error(
              "Помилка видалення старого desktop-банера:",
              fileError.message
            );
          }
        }
      }

      if (mobileFile) {
        mobileImageUrl = mobileFile.path;

        if (
          oldBanner.mobile_image &&
          oldBanner.mobile_image.includes("res.cloudinary.com")
        ) {
          try {
            const parts = oldBanner.mobile_image.split("/");
            const uploadIndex = parts.findIndex((part) => part === "upload");
            const publicIdWithExt = parts.slice(uploadIndex + 2).join("/");
            const publicId = publicIdWithExt.replace(/\.[^/.]+$/, "");
            await cloudinary.uploader.destroy(publicId);
          } catch (fileError) {
            console.error(
              "Помилка видалення старого mobile-банера:",
              fileError.message
            );
          }
        }
      }

      const updatedBanner = {
        id,
        image: imageUrl,
        mobileImage: mobileImageUrl,
        link: link || "#menu",
        title: title || "",
        isActive: isActive === "true",
        priority: Number(priority) || 10,
        endAt: endAt || null,
      };

      await pool.query(
        `UPDATE banners
         SET image = $1,
             mobile_image = $2,
             link = $3,
             title = $4,
             is_active = $5,
             priority = $6,
             end_at = $7
         WHERE id = $8`,
        [
          updatedBanner.image,
          updatedBanner.mobileImage,
          updatedBanner.link,
          updatedBanner.title,
          updatedBanner.isActive,
          updatedBanner.priority,
          updatedBanner.endAt,
          updatedBanner.id,
        ]
      );

      return res.json({
        success: true,
        banner: updatedBanner,
      });
    } catch (error) {
      console.error("PUT BANNER ERROR:", error);

      return res.status(500).json({
        message: "Помилка оновлення банера",
        error: error.message,
      });
    }
  }
);

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
      productToDelete.image.includes("res.cloudinary.com")
    ) {
      try {
        const parts = productToDelete.image.split("/");
        const uploadIndex = parts.findIndex((part) => part === "upload");
        const publicIdWithExt = parts.slice(uploadIndex + 2).join("/");
        const publicId = publicIdWithExt.replace(/\.[^/.]+$/, "");

        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.error(
          "Помилка видалення фото з Cloudinary:",
          deleteError.message
        );
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

app.delete("/banners/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query(`SELECT * FROM banners WHERE id = $1`, [
      id,
    ]);

    if (existing.rows.length === 0) {
      return res.status(404).json({
        message: "Банер не знайдено",
      });
    }

    const bannerToDelete = existing.rows[0];

    for (const imageUrl of [
      bannerToDelete.image,
      bannerToDelete.mobile_image,
    ]) {
      if (imageUrl && imageUrl.includes("res.cloudinary.com")) {
        try {
          const parts = imageUrl.split("/");
          const uploadIndex = parts.findIndex((part) => part === "upload");
          const publicIdWithExt = parts.slice(uploadIndex + 2).join("/");
          const publicId = publicIdWithExt.replace(/\.[^/.]+$/, "");
          await cloudinary.uploader.destroy(publicId);
        } catch (fileError) {
          console.error(
            "Помилка видалення банера з Cloudinary:",
            fileError.message
          );
        }
      }
    }

    await pool.query(`DELETE FROM banners WHERE id = $1`, [id]);

    return res.json({
      success: true,
      message: "Банер видалено",
    });
  } catch (error) {
    console.error("DELETE BANNER ERROR:", error);

    return res.status(500).json({
      message: "Не вдалося видалити банер",
      error: error.message,
    });
  }
});

app.post("/banners/:id/click", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `UPDATE banners
       SET click_count = click_count + 1
       WHERE id = $1`,
      [id]
    );

    return res.json({
      success: true,
    });
  } catch (error) {
    console.error("BANNER CLICK ERROR:", error);

    return res.status(500).json({
      message: "Не вдалося зарахувати клік",
      error: error.message,
    });
  }
});

app.put("/banners/reorder", async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({
        message: "Некоректний список банерів",
      });
    }

    for (const item of items) {
      await pool.query(
        `UPDATE banners
         SET priority = $1
         WHERE id = $2`,
        [Number(item.priority) || 10, item.id]
      );
    }

    return res.json({
      success: true,
      message: "Порядок банерів оновлено",
    });
  } catch (error) {
    console.error("BANNER REORDER ERROR:", error);

    return res.status(500).json({
      message: "Не вдалося оновити порядок банерів",
      error: error.message,
    });
  }
});

app.post("/order", async (req, res) => {
  try {
    const {
      name,
      phone,
      address,
      comment,
      items,
      totalPrice,
      regularSticksCount,
      trainingSticksCount,
      sticksExtraPrice,
    } = req.body;

    let sticksText = "";
    const calculatedTotal =
      items.reduce((sum, item) => {
        const paidQuantity = item.paidQuantity ?? item.quantity ?? 0;
        return sum + item.price * paidQuantity;
      }, 0) + (sticksExtraPrice ?? 0);

    if ((regularSticksCount ?? 0) > 0 || (trainingSticksCount ?? 0) > 0) {
      sticksText = `🥢 Паличкu: звичайні: ${
        regularSticksCount ?? 0
      }, навчальні: ${trainingSticksCount ?? 0}`;
    }

    let message = `🆕 НОВЕ ЗАМОВЛЕННЯ\n\n`;

    message += `👤 Ім'я: ${name}\n`;
    message += `📞 Телефон: ${phone}\n`;
    message += `📍 Адреса: ${address}\n\n`;

    message += `🧾 Замовлення:\n`;

    items.forEach((item) => {
      const paidQuantity = item.paidQuantity ?? item.quantity ?? 0;
      const freeQuantity = item.freeQuantity ?? 0;
      const lineTotal = item.lineTotal ?? item.price * paidQuantity;

      let itemLine = `• ${item.name}`;

      if (item.isDiscountOffer || item.discountLabel) {
        const label =
          item.discountLabel && item.discountLabel !== ""
            ? item.discountLabel
            : "-25%"; // временный дефолт

        itemLine += `(знижка ${label})`;
      }

      itemLine += `— ${item.quantity} шт`;

      if (freeQuantity > 0) {
        itemLine += `(${paidQuantity} платно + ${freeQuantity} 🎁 подарок)`;
      }

      itemLine += `— ${lineTotal} грн\n`;

      message += itemLine;
    });

    if (sticksText) {
      message += `${sticksText}\n`;
    }

    message += `💰 Разом: ${calculatedTotal} грн`;

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
