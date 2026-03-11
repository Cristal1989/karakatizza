import { useCart } from "../hooks/useCart";

export default function MobileCartBar() {
  const { totalItems, totalPrice, openCart, isCartOpen } = useCart();

  if (!totalItems || isCartOpen) return null;

  return (
    <div
      id='mobile-cart-bar'
      onClick={openCart}
      style={{
        position: "fixed",
        bottom: "16px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "420px",
        maxWidth: "calc(100% - 24px)",
        background: "#e53935",
        color: "#fff",
        borderRadius: "16px",
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        boxShadow: "0 12px 30px rgba(0,0,0,0.22)",
        zIndex: 100,
        cursor: "pointer",
        animation:
          "mobileCartSlideUp 0.35s ease-out, mobileCartPulse 0.45s ease-out 0.2s",
      }}
    >
      <div style={{ fontWeight: 700 }}>
        🛒 {totalItems} {getItemsLabel(totalItems)}
      </div>

      <div style={{ fontWeight: 800 }}>{totalPrice} грн</div>

      <div
        style={{
          background: "rgba(255,255,255,0.18)",
          padding: "8px 12px",
          borderRadius: "10px",
          fontWeight: 700,
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
