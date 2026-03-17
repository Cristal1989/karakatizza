import { useCart } from "../hooks/useCart";
import { formatPrice } from "../utils/formatPrice";

export default function CartItem({ item }) {
  const { incrementItem, decrementItem, removeFromCart } = useCart();

  return (
    <div className="rounded-2xl border border-neutral-200 p-3">
      <div className="flex gap-3">
        <img
          src={item.image}
          alt={item.name}
          className="h-16 w-16 rounded-xl object-cover"
        />

        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-neutral-900">
            {item.name}
          </div>
          {item.isDiscountOffer && (
            <div
              style={{
                fontSize: "12px",
                fontWeight: "700",
                color: "#e56a45",
                marginTop: "4px",
              }}
            >
              Акція -25%
            </div>
          )}
          <div className="mt-1 text-sm text-neutral-500">
            {formatPrice(item.price)}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => decrementItem(item.id)}
                className="h-8 w-8 rounded-lg bg-neutral-100 text-lg"
              >
                -
              </button>
              <span className="w-6 text-center font-semibold">
                {item.quantity}
              </span>
              <button
                onClick={() => incrementItem(item.id)}
                className="h-8 w-8 rounded-lg bg-neutral-100 text-lg"
              >
                +
              </button>
            </div>

            <button
              onClick={() => removeFromCart(item.id)}
              className="text-sm text-red-500 transition hover:text-red-600"
            >
              Удалить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
