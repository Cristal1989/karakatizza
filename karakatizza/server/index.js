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
import promotionsRoutes from "./routes/promotions.js";
import giftRollRoutes from "./routes/giftRoll.js";

dotenv.config();

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

// ===== LEGACY REDIRECTS =====
const legacyRedirects = {
  "/контакты": "/contacts",
  "/контакты/": "/contacts",

  "/обратный-звонок": "/contacts",
  "/обратный-звонок/": "/contacts",

  "/menu/roll": "/rolls",
  "/menu/roll/": "/rolls",

  "/menu/maki": "/rolls",
  "/menu/maki/": "/rolls",

  "/menu/set": "/sets",
  "/menu/set/": "/sets",

  "/menu/salad": "/snacks",
  "/menu/salad/": "/snacks",

  "/menu/sushi-burger": "/snacks",
  "/menu/sushi-burger/": "/snacks",

  "/menu/sushi-boli": "/bowls",
  "/menu/sushi-boli/": "/bowls",

  "/menu/додатково": "/extras",
  "/menu/додатково/": "/extras",

  "/menu/napoi": "/drinks",
  "/menu/napoi/": "/drinks",

  "/menu/напої": "/drinks",
  "/menu/напої/": "/drinks",
};

Object.entries(legacyRedirects).forEach(([oldPath, newPath]) => {
  app.get(oldPath, (req, res) => {
    console.log("REDIRECT HIT:", oldPath);
    return res.redirect(301, newPath);
  });
});

app.get("/", (req, res) => {
  res.send("Server running");
});

app.use("/api/delivery", deliveryRoutes);
app.use("/promotions", promotionsRoutes(pool));
app.use("/gift-roll", giftRollRoutes(pool));

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

const siteSettingsRoutes = require("./routes/siteSettings");
app.use("/api/settings", siteSettingsRoutes);

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


app.get("/products", async (req, res) => {
  try {
    const isAdmin = req.query.admin === "1";

    const result = await pool.query(`
      SELECT
        id,
        name,
        price,
        old_price AS "oldPrice",
        category,
        description,
        image,
        weight,
        popular,
        promo_type AS "promoType",
        priority,
        discount_offer_eligible AS "discountOfferEligible",
        free_soy_sauce AS "freeSoySauce",
        free_ginger AS "freeGinger",
        free_wasabi AS "freeWasabi",
        is_visible AS "isVisible",
        is_hit AS "isHit",
        is_new AS "isNew",
        is_weekly_offer AS "isWeeklyOffer",
        roll_type AS "rollType"
      FROM products
      ${isAdmin ? "" : "WHERE is_visible = true"}
      ORDER BY priority ASC, created_at ASC
    `);

    const products = result.rows.map((p) => ({
      ...p,
      price: Number(p.price),
      oldPrice: p.oldPrice != null ? Number(p.oldPrice) : null,
      priority: Number(p.priority ?? 10),
      popular: !!p.popular,
      promoType: p.promoType || "none",
      discountOfferEligible: !!p.discountOfferEligible,
      freeSoySauce: Number(p.freeSoySauce || 0),
      freeGinger: Number(p.freeGinger || 0),
      freeWasabi: Number(p.freeWasabi || 0),
      isVisible: p.isVisible === true,
      isHit: p.isHit === true,
      isNew: p.isNew === true,
      isWeeklyOffer: p.isWeeklyOffer === true,
      weight: p.weight || "",
    }));

    res.set("Cache-Control", "public, max-age=120");
    return res.json(products);
  } catch (error) {
    console.error("GET /products ERROR:", error);
    return res.status(500).json({
      message: "Не вдалося отримати товари",
    });
  }
});

app.get("/site-settings", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        opening_time AS "openingTime",
        closing_time AS "closingTime",
        enable_after_hours_popup AS "enableAfterHoursPopup",
        closed_all_day AS "closedAllDay",
        closed_all_day_date AS "closedAllDayDate",
        popup_message AS "popupMessage",
        closed_all_day_message AS "closedAllDayMessage"
      FROM site_settings
      WHERE id = 1
      LIMIT 1
    `);

    if (!result.rows.length) {
      return res.status(404).json({ message: "Налаштування не знайдено" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("GET /site-settings ERROR:", error);
    return res.status(500).json({
      message: "Не вдалося отримати налаштування сайту",
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
      freeSoySauce,
      freeGinger,
      freeWasabi,
      weight,
      isVisible,
      isHit,
      isNew,
      isWeeklyOffer,
      oldPrice,
      rollType,
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
      freeSoySauce: Number(freeSoySauce || 0),
      freeGinger: Number(freeGinger || 0),
      freeWasabi: Number(freeWasabi || 0),

      weight: weight || "",
      isVisible: isVisible === undefined ? true : isVisible === "true",
      isHit: isHit === "true",
      isNew: isNew === "true",
      isWeeklyOffer: isWeeklyOffer === "true",
      oldPrice:
        oldPrice !== undefined && oldPrice !== "" ? Number(oldPrice) : null,
      rollType: rollType || "",
    };

    await pool.query(
      `
      INSERT INTO products (
  id,
  name,
  price,
  category,
  description,
  image,
  popular,
  promo_type,
  priority,
  discount_offer_eligible,
  free_soy_sauce,
  free_ginger,
  free_wasabi,
  weight,
  is_visible,
  is_hit,
  is_new,
  is_weekly_offer,
  old_price,
  roll_type
)
VALUES (
  $1,$2,$3,$4,$5,$6,$7,$8,$9,
  $10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20
)
      `,
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
        newProduct.freeSoySauce,
        newProduct.freeGinger,
        newProduct.freeWasabi,
        newProduct.weight,
        newProduct.isVisible,
        newProduct.isHit,
        newProduct.isNew,
        newProduct.isWeeklyOffer,
        newProduct.oldPrice,
        rollType || "",
      ]
    );

    return res.status(201).json({
      success: true,
      product: newProduct,
    });
  } catch (error) {
    console.error("POST /products ERROR:", error);
    return res.status(500).json({
      message: "Не вдалося створити товар",
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
        freeSoySauce,
        freeGinger,
        freeWasabi,
        weight,
        isVisible,
        isHit,
        isNew,
        isWeeklyOffer,
        oldPrice,
        rollType,
      } = req.body;

      if (!name || !price || !category) {
        return res.status(400).json({
          message: "Необхідні поля: name, price, category",
        });
      }

      const existing = await pool.query(
        `SELECT * FROM products WHERE id = $1`,
        [id]
      );

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
        freeSoySauce: Number(freeSoySauce || 0),
        freeGinger: Number(freeGinger || 0),
        freeWasabi: Number(freeWasabi || 0),
        rollType: rollType || "",

        weight: weight || "",
        isVisible: isVisible === undefined ? true : isVisible === "true",
        isHit: isHit === "true",
        isNew: isNew === "true",
        isWeeklyOffer: isWeeklyOffer === "true",
        oldPrice:
          oldPrice !== undefined && oldPrice !== "" ? Number(oldPrice) : null,
      };

      await pool.query(
        `
        UPDATE products
        SET
          name = $1,
          price = $2,
          category = $3,
          description = $4,
          image = $5,
          popular = $6,
          promo_type = $7,
          priority = $8,
          discount_offer_eligible = $9,
          free_soy_sauce = $10,
          free_ginger = $11,
          free_wasabi = $12,
          weight = $13,
          is_visible = $14,
          is_hit = $15,
          is_new = $16,
          is_weekly_offer = $17,
          old_price = $18,
          roll_type = $19
        WHERE id = $20
        `,
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
          updatedProduct.freeSoySauce,
          updatedProduct.freeGinger,
          updatedProduct.freeWasabi,
          updatedProduct.weight,
          updatedProduct.isVisible,
          updatedProduct.isHit,
          updatedProduct.isNew,
          updatedProduct.isWeeklyOffer,
          updatedProduct.oldPrice,
          rollType || "",
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
        message: "Не вдалося оновити товар",
      });
    }
  });
});

app.put("/site-settings", async (req, res) => {
  try {
    const {
      openingTime,
      closingTime,
      enableAfterHoursPopup,
      closedAllDay,
      closedAllDayDate,
      popupMessage,
      closedAllDayMessage,
    } = req.body;

    await pool.query(
      `
      UPDATE site_settings
      SET
        opening_time = $1,
        closing_time = $2,
        enable_after_hours_popup = $3,
        closed_all_day = $4,
        closed_all_day_date = $5,
        popup_message = $6,
        closed_all_day_message = $7,
        updated_at = NOW()
      WHERE id = 1
      `,
      [
        openingTime || "10:00",
        closingTime || "22:00",
        enableAfterHoursPopup === true,
        closedAllDay === true,
        closedAllDayDate || "",
        popupMessage ||
          "Ми зараз не працюємо, але ви можете оформити замовлення, і ми зв’яжемося з вами в робочий час.",
        closedAllDayMessage ||
          "Сьогодні ми тимчасово не працюємо, але ви можете залишити замовлення і ми зв’яжемося з вами пізніше.",
      ]
    );

    return res.json({ success: true });
  } catch (error) {
    console.error("PUT /site-settings ERROR:", error);
    return res.status(500).json({
      message: "Не вдалося зберегти налаштування сайту",
    });
  }
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
      entrance,
      paymentMethod,
      needExactTime,
      exactTime,
      condiments,
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
    if (entrance) {
      message += `🏢 Під'їзд: ${entrance}\n`;
    }
    if (paymentMethod) {
      const paymentText = paymentMethod === "card" ? "Картка" : "Готівка";
      message += `💳 Оплата: ${paymentText}\n`;
    }
    if (needExactTime && exactTime) {
      message += `⏰ На час: ${exactTime}\n`;
    }
    if (comment && comment.trim()) {
      message += `💬 Коментар: ${comment.trim()}\n`;
    }
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

    if (condiments) {
      const {
        soySauceCount = 0,
        gingerCount = 0,
        wasabiCount = 0,
        extraSoyCount = 0,
        extraGingerCount = 0,
        extraWasabiCount = 0,
        extraPrice = 0,
      } = condiments;

      if (soySauceCount || gingerCount || wasabiCount) {
        message += `\n🍱 Додатки:\n`;

        if (soySauceCount) {
          message += `Соєвий соус: ${soySauceCount}`;
          if (extraSoyCount > 0) {
            message += `(+${extraSoyCount} платно)`;
          }
          message += `\n`;
        }

        if (gingerCount) {
          message += `Імбир: ${gingerCount}`;
          if (extraGingerCount > 0) {
            message += `(+${extraGingerCount} платно)`;
          }
          message += `\n`;
        }

        if (wasabiCount) {
          message += `Васабі: ${wasabiCount}`;
          if (extraWasabiCount > 0) {
            message += `(+${extraWasabiCount} платно)`;
          }
          message += `\n`;
        }

        if (extraPrice > 0) {
          message += `💰 Додатково за соуси: ${extraPrice} грн\n`;
        }
      }
    }

    message += `💰 Разом: ${totalPrice} грн`;

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// путь к фронту (ВАЖНО проверить!)
const clientDistPath = path.join(__dirname, "../client/dist");

// раздача статики
app.use(express.static(clientDistPath));

// fallback — самое важное
app.get("*", (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
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
