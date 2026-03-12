import { useState, useRef } from "react";
import { useCart } from "../hooks/useCart";
import { flyToCart } from "../utils/flyToCart";
import { getImageUrl } from "../api/productsApi";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const imageRef = useRef(null);

  const imageSrc = getImageUrl(product.image);

  function increase() {
    setQuantity((q) => q + 1);
  }

  function decrease() {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  }

  function handleAdd() {
    if (imageRef.current) {
      flyToCart(imageRef.current);
    }
    addToCart(product, quantity);
    setQuantity(1);
  }

  return (
    <div
      style={{
        position: "relative",
        background: "#fff",
        borderRadius: "20px",
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
      }}
    >
      {product.popular && (
        <div
          style={{
            position: "absolute",
            top: "12px",
            left: "12px",
            background: "#e53935",
            color: "#fff",
            padding: "6px 10px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: 800,
            zIndex: 2,
            letterSpacing: "0.4px",
          }}
        >
          ХІТ
        </div>
      )}

      <div
        style={{
          width: "100%",
          height: "220px",
          background: "#f6f6f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <img
          ref={imageRef}
          src={imageSrc}
          alt={product.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>

      <div
        style={{
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          flexGrow: 1,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "24px",
            fontWeight: 800,
            color: "#111",
          }}
        >
          {product.name}
        </h3>

        <p
          style={{
            margin: 0,
            color: "#666",
            fontSize: "16px",
            lineHeight: 1.4,
            minHeight: "44px",
          }}
        >
          {product.description || "Без опису"}
        </p>

        <div
          style={{
            fontSize: "28px",
            fontWeight: 800,
            color: "#111",
            marginTop: "4px",
          }}
        >
          {product.price} грн
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "auto",
          }}
        >
          <button
            type="button"
            onClick={decrease}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              border: "1px solid #ddd",
              background: "#fff",
              cursor: "pointer",
              fontSize: "20px",
            }}
          >
            -
          </button>

          <span
            style={{
              minWidth: "24px",
              textAlign: "center",
              fontWeight: 700,
              fontSize: "18px",
            }}
          >
            {quantity}
          </span>

          <button
            type="button"
            onClick={increase}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              border: "1px solid #ddd",
              background: "#fff",
              cursor: "pointer",
              fontSize: "20px",
            }}
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          style={{
            marginTop: "12px",
            width: "100%",
            border: "none",
            borderRadius: "14px",
            background: "#ef4444",
            color: "#fff",
            padding: "14px 16px",
            fontSize: "16px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Додати в кошик
        </button>
      </div>
    </div>
  );
}
