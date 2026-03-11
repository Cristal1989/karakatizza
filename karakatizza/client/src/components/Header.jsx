import { useCart } from "../hooks/useCart";

export default function Header() {
  const { totalItems, openCart } = useCart();

  return (
    <header
      style={{
        backgroundColor: "#111111",
        color: "#ffffff",
        padding: "18px 20px",
        position: "sticky",
        top: 0,
        zIndex: 20,
        boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "800",
              lineHeight: 1.1,
            }}
          >
            🍣 Karakatizza
          </div>

          <div
            style={{
              marginTop: "4px",
              fontSize: "14px",
              color: "#cfcfcf",
            }}
          >
            Доставка ролів, сетів, закусок і напоїв
          </div>
        </div>

        <button
          id='cart-button'
          onClick={openCart}
          style={{
            backgroundColor: "#e53935",
            color: "#ffffff",
            border: "none",
            borderRadius: "12px",
            padding: "12px 18px",
            fontSize: "15px",
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
