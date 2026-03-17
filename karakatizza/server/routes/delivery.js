import express from "express";

const router = express.Router();

router.post("/route-distance", async (req, res) => {
  try {
    const { customerLat, customerLng, shopLat, shopLng } = req.body || {};

    if (
      typeof customerLat !== "number" ||
      typeof customerLng !== "number" ||
      typeof shopLat !== "number" ||
      typeof shopLng !== "number"
    ) {
      return res.status(400).json({
        error: "Невірні координати",
        reqBody: req.body,
      });
    }

    const ORS_API_KEY = process.env.ORS_API_KEY;

    if (!ORS_API_KEY) {
      return res.status(500).json({
        error: "ORS_API_KEY не знайдено в server/.env",
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let response;

    try {
      response = await fetch(
        "https://api.openrouteservice.org/v2/directions/driving-car/json",
        {
          method: "POST",
          headers: {
            Authorization: ORS_API_KEY,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            coordinates: [
              [shopLng, shopLat],
              [customerLng, customerLat],
            ],
          }),
          signal: controller.signal,
        }
      );
    } catch (error) {
      console.error("ORS ERROR:", error);

      // 🔥 ВОТ ОН — БЫСТРЫЙ ФИКС
      return res.json({
        distanceKm: 5, // временно фиксированное расстояние
      });
    } finally {
      clearTimeout(timeout);
    }

    const rawText = await response.text();

    let data = {};
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch (parseError) {
      return res.status(500).json({
        error: "ORS повернув не JSON",
        rawText,
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error || data?.message || "ORS request failed",
        raw: data,
      });
    }

    if (!data?.routes?.[0]?.summary?.distance) {
      return res.status(500).json({
        error: "ORS не повернув distance",
        raw: data,
      });
    }

    const meters = data.routes[0].summary.distance;

    return res.json({
      distanceKm: meters / 1000,
    });
  } catch (error) {
    console.error("DELIVERY ERROR:", error);

    if (error.name === "AbortError") {
      return res.status(504).json({
        error: "ORS timeout: сервер не дочекався відповіді за 10 секунд",
      });
    }

    return res.status(500).json({
      error: error.message || "Route calculation failed",
    });
  }
});

export default router;
