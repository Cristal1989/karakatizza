import { useCart } from "../hooks/useCart";
import { getImageUrl } from "../api/productsApi";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();

  const imageSrc = getImageUrl(product.image);

  return (
    <div
      data-product-id={product.id}
      style={{
        background: "#ffffff",
        borderRadius: "18px",
        overflow: "hidden",
        border: "1px solid #eee",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* IMAGE */}
      <div
        style={{
          position: "relative",
        }}
      >
        <img
          src={imageSrc}
          alt={product.name}
          style={{
            width: "100%",
            height: "200px",
            objectFit: "cover",
          }}
        />

        {/* BADGES */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
          }}
        >
          {product.popular && (
            <span
              style={{
                background: "#fff7ed",
                color: "#ea580c",
                padding: "4px 8px",
                borderRadius: "999px",
                fontSize: "11px",
                fontWeight: 800,
              }}
            >
              ХІТ
            </span>
          )}

          {product.promoType === "2plus1" && (
            <span
              style={{
                background: "#eff6ff",
                color: "#2563eb",
                padding: "4px 8px",
                borderRadius: "999px",
                fontSize: "11px",
                fontWeight: 800,
              }}
            >
              1+1=3
            </span>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div
        style={{
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
        }}
      >
        {/* NAME */}
        <div
          style={{
            fontWeight: 800,
            fontSize: "18px",
            marginBottom: "6px",
          }}
        >
          {product.name}
        </div>

        {/* DESCRIPTION */}
        <div
          style={{
            fontSize: "14px",
            color: "#666",
            marginBottom: "14px",
            flexGrow: 1,
          }}
        >
          {product.description || "Без опису"}
        </div>

        {/* FOOTER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontWeight: 800,
              fontSize: "18px",
            }}
          >
            {product.price} грн
          </div>

          <button
            onClick={() => addToCart(product, 1)}
            style={{
              background: "#e53935",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "10px 14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            В кошик
          </button>
        </div>
      </div>
    </div>
  );
}
