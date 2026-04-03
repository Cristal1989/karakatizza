import { useCart } from "../hooks/useCart";

export default function MobileCartBar() {
  const { totalItems, totalPrice, openCart, isCartOpen } = useCart();

  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  if (!isMobile || !totalItems || isCartOpen) return null;

  return (
    <div
  id="mobile-cart-bar"
  onClick={openCart}
  style={{
    position: "fixed",
    bottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)",
    left: "12px",
    right: "12px",
    maxWidth: "100%",
    transform: "none",
    background: "#e56a45",
    color: "#fff",
    borderRadius: "18px",
    padding: "12px 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    zIndex: 100,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(0,0,0,0.16)",
  }}
>
      <div
        style={{
          fontWeight: 700,
          fontSize: "15px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        🛒 {totalItems} {getItemsLabel(totalItems)}
      </div>

      <div
        style={{
          fontWeight: 800,
          fontSize: "16px",
          whiteSpace: "nowrap",
        }}
      >
        {totalPrice} грн
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.18)",
          padding: "10px 16px",
          borderRadius: "12px",
          fontWeight: 700,
          fontSize: "14px",
          whiteSpace: "nowrap",
        }}
      >
        Відкрити
      </div>
    </div>
  );
}

function getItemsLabel(count) {
  if (count % 10 === 1 && count % 100 !== 11) return "товар";
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
    return "товари";
  }
  return "товарів";
}
