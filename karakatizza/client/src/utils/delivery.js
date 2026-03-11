import { FREE_DELIVERY_FROM } from "../data/products";

export function getRemainingForFreeDelivery(total) {
  return Math.max(FREE_DELIVERY_FROM - total, 0);
}

export function hasFreeDelivery(total) {
  return total >= FREE_DELIVERY_FROM;
}
