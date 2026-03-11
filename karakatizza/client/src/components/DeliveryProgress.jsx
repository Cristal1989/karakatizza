import { FREE_DELIVERY_FROM } from "../data/products";
import { hasFreeDelivery, getRemainingForFreeDelivery } from "../utils/delivery";
import { formatPrice } from "../utils/formatPrice";

export default function DeliveryProgress({ totalPrice }) {
  const progress = Math.min((totalPrice / FREE_DELIVERY_FROM) * 100, 100);
  const free = hasFreeDelivery(totalPrice);
  const remaining = getRemainingForFreeDelivery(totalPrice);

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-neutral-800">
          {free
            ? "🎉 У вас бесплатная доставка"
            : `Добавьте ещё ${formatPrice(remaining)} до бесплатной доставки`}
        </div>
        <div className="text-xs text-neutral-500">
          от {formatPrice(FREE_DELIVERY_FROM)}
        </div>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full rounded-full bg-red-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}