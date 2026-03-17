import { SHOP_LOCATION, DELIVERY_ZONES } from "../config/deliveryConfig";

export function getDeliveryZone(distanceKm) {
  const zone = DELIVERY_ZONES.find((rule) => distanceKm <= rule.maxKm);
  return zone || null;
}

export async function getRouteDistanceKm(customerLat, customerLng) {
  const API_URL = "https://karakatizza-production.up.railway.app";
  console.log("API URL", API_URL);

  const response = await fetch(`${API_URL}/api/delivery/route-distance`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customerLat,
      customerLng,
      shopLat: SHOP_LOCATION.lat,
      shopLng: SHOP_LOCATION.lng,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Route request failed");
  }

  return data.distanceKm;
}

export function getDeliveryInfo(distanceKm, cartTotal) {
  const zone = getDeliveryZone(distanceKm);

  if (!zone) {
    return {
      type: "operator",
      minOrder: null,
      remaining: 0,
      freeDelivery: false,
    };
  }

  const remaining = Math.max(0, zone.minOrder - cartTotal);

  if (remaining <= 0) {
    return {
      type: "free",
      minOrder: zone.minOrder,
      remaining: 0,
      freeDelivery: true,
    };
  }

  return {
    type: "paid",
    minOrder: zone.minOrder,
    remaining,
    freeDelivery: false,
  };
}
