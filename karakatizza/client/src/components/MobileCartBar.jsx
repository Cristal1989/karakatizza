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
        bottom: "14px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(460px, calc(100% - 24px))",
        background: "#e85d3f",
        color: "#fff",
        borderRadius: "16px",
        padding: "12px 16px",
        display: "grid",
        gridTemplateColumns: "1fr auto auto",
        alignItems: "center",
        gap: "14px",
        boxShadow: "0 12px 30px rgba(232, 93, 63, 0.28)",
        zIndex: 100,
        cursor: "pointer",
        animation:
          "mobileCartSlideUp 0.35s ease-out, mobileCartPulse 0.45s ease-out 0.2s",
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
