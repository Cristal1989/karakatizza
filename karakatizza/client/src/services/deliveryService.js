import { SHOP_LOCATION, DELIVERY_ZONES } from "../config/deliveryConfig";

export function getResolvedShopLocation(siteSettings) {
  const delivery = siteSettings?.delivery;

  return {
    lat: delivery?.shopLat ?? SHOP_LOCATION.lat,
    lng: delivery?.shopLng ?? SHOP_LOCATION.lng,
    address: delivery?.shopAddress || SHOP_LOCATION.address,
  };
}

export function getResolvedDeliveryZones(siteSettings) {
  const delivery = siteSettings?.delivery;

  if (Array.isArray(delivery?.deliveryZones) && delivery.deliveryZones.length > 0) {
    return delivery.deliveryZones;
  }

  return DELIVERY_ZONES;
}

export function getDeliveryZone(distanceKm, zones = DELIVERY_ZONES) {
  const zone = zones.find((rule) => distanceKm <= Number(rule.maxKm));
  return zone || null;
}

export async function getRouteDistanceKm(
  customerLat,
  customerLng,
  shopLocation = SHOP_LOCATION
) {
  const API_URL = "https://karakatizza-production.up.railway.app";
  console.log("API URL:", API_URL);

  const response = await fetch(`${API_URL}/api/delivery/route-distance`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customerLat,
      customerLng,
      shopLat: shopLocation.lat,
      shopLng: shopLocation.lng,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Route request failed");
  }

  return data.distanceKm;
}

export function getDeliveryInfo(distanceKm, cartTotal, zones = DELIVERY_ZONES) {
  const zone = getDeliveryZone(distanceKm, zones);

  if (!zone) {
    return {
      type: "operator",
      minOrder: null,
      remaining: 0,
      freeDelivery: false,
    };
  }

  const remaining = Math.max(0, Number(zone.minOrder) - cartTotal);

  if (remaining <= 0) {
    return {
      type: "free",
      minOrder: Number(zone.minOrder),
      remaining: 0,
      freeDelivery: true,
    };
  }

  return {
    type: "paid",
    minOrder: Number(zone.minOrder),
    remaining,
    freeDelivery: false,
  };
}