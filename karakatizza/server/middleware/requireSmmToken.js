export default function requireSmmToken(req, res, next) {
  const configuredToken = process.env.SMM_CONTEXT_TOKEN;

  if (!configuredToken) {
    return res.status(500).json({
      message: "SMM_CONTEXT_TOKEN is not configured",
    });
  }

  const authHeader = req.headers.authorization || "";
  const expected = `Bearer ${configuredToken}`;

  if (authHeader !== expected) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  next();
}
