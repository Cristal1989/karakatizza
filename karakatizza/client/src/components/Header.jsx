import { useCart } from "../hooks/useCart";

export default function Header() {
  const { totalItems, openCart } = useCart();
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  return (
    <header
      style={{
        background: "#111827",
        color: "#fff",
        padding: isMobile ? "12px 16px" : "18px 20px",
        position: "static",
        boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: isMobile ? "18px" : "28px",
              lineHeight: 1.1,
            }}
          >
            🍣 Karakatizza
          </div>

          <div
            style={{
              fontSize: isMobile ? "11px" : "14px",
              lineHeight: 1.3,
            }}
          >
            Доставка ролів, сетів, закусок і напоїв
          </div>
        </div>

        <button
          id="cart-button"
          onClick={openCart}
          style={{
            backgroundColor: "#e53935",
            color: "#ffffff",
            border: "none",
            borderRadius: "12px",
            padding: isMobile ? "10px 14px" : "12px 18px",
            marginRight: isMobile ? 0 : "20px",
            fontSize: isMobile ? "14px" : "15px",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          🛒 Кошик ({totalItems})
        </button>
      </div>
    </header>
  );
}
