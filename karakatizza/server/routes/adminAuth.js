import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/login", (req, res) => {
  try {
    const { login, password } = req.body || {};

    if (!login || !password) {
      return res.status(400).json({ message: "Введи логін і пароль" });
    }

    const validLogin = process.env.ADMIN_LOGIN;
    const validPassword = process.env.ADMIN_PASSWORD;
    const jwtSecret = process.env.JWT_SECRET;

    if (!validLogin || !validPassword || !jwtSecret) {
      return res.status(500).json({ message: "Не налаштовані ADMIN_LOGIN / ADMIN_PASSWORD / JWT_SECRET" });
    }

    if (login !== validLogin || password !== validPassword) {
      return res.status(401).json({ message: "Невірний логін або пароль" });
    }

    const token = jwt.sign(
      { role: "admin", login },
      jwtSecret,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      token,
      admin: {
        login,
        role: "admin",
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Помилка входу",
      error: error?.message || "Unknown error",
    });
  }
});

router.get("/me", (req, res) => {
  return res.json({ success: true });
});

router.get("/ping", (req, res) => {
  res.json({ ok: true, route: "admin-auth" });
});

export default router;