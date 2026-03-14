import { useCart } from "../hooks/useCart";

export default function MobileCartBar() {
  const { totalItems, totalPrice, openCart, isCartOpen } = useCart();

  if (!totalItems || isCartOpen) return null;

  return (
    <div
      id="mobile-cart-bar"
      onClick={openCart}
      style={{
        position: "fixed",
        bottom: "12px",
        left: "12px",
        right: "12px",
        width: "auto",
        transform: "none",
        background: "#e56a45",
        color: "#fff",
        borderRadius: "16px",
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        boxShadow: "0 12px 30px rgba(0,0,0,0.22)",
        zIndex: 100,
        cursor: "pointer",
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
