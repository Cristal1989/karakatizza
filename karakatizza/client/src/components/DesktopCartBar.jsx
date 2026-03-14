import { useCart } from "../hooks/useCart";

export default function DesktopCartBar() {
  const { totalItems, totalPrice, openCart, isCartOpen } = useCart();
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  if (isMobile || !totalItems || isCartOpen) return null;

  return (
    <div
      id="desktop-cart-bar"
      onClick={openCart}
      style={{
        position: "fixed",
        right: "24px",
        bottom: "24px",
        width: "240px",
        background: "#e56a45",
        color: "#fff",
        borderRadius: "18px",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "14px",
        boxShadow: "0 16px 40px rgba(0,0,0,0.22)",
        zIndex: 120,
        cursor: "pointer",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 20px 44px rgba(0,0,0,0.26)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,0.22)";
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 700,
            opacity: 0.92,
            marginBottom: "4px",
          }}
        >
          🛒 {totalItems} {getItemsLabel(totalItems)}
        </div>

        <div
          style={{
            fontSize: "24px",
            fontWeight: 900,
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          {totalPrice} грн
        </div>
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.18)",
          padding: "12px 16px",
          borderRadius: "12px",
          fontSize: "15px",
          fontWeight: 800,
          whiteSpace: "nowrap",
          flex: "0 0 auto",
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
