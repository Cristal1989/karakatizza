import jwt from "jsonwebtoken";

export default function requireAdminAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Немає токена доступу" });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({ message: "Порожній токен" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Недійсний або прострочений токен" });
  }
}