import { useCart } from "../hooks/useCart";
import { useState } from "react";
import { useRef } from "react";
import { flyToCart } from "../utils/flyToCart";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const imageRef = useRef(null);

  function increase() {
    setQuantity((q) => q + 1);
  }

  function decrease() {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  }

  function handleAdd() {
    flyToCart(imageRef.current);
    addToCart(product, quantity);
    setQuantity(1);
  }

  const imageSrc = product.image?.startsWith("/uploads")
    ? `https://karakatizza-production.up.railway.app/products${product.image}`
    : product.image;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "18px",
        overflow: "hidden",
        boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <img
        ref={imageRef}
        src={imageSrc}
        alt={product.name}
        style={{
          width: "100%",
          height: "200px",
          objectFit: "cover",
        }}
      />

      <div style={{ padding: "16px", flex: 1 }}>
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "700",
            marginBottom: "6px",
          }}
        >
          {product.name}
        </h3>

        <p
          style={{
            fontSize: "14px",
            color: "#777",
            marginBottom: "14px",
          }}
        >
          {product.description}
        </p>

        <div
          style={{
            fontSize: "20px",
            fontWeight: "800",
            marginBottom: "14px",
          }}
        >
          {product.price} грн
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              border: "1px solid #ddd",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <button
              onClick={decrease}
              style={{
                border: "none",
                background: "#f3f3f3",
                padding: "6px 10px",
                cursor: "pointer",
              }}
            >
              -
            </button>

            <div
              style={{
                padding: "6px 12px",
                minWidth: "30px",
                textAlign: "center",
              }}
            >
              {quantity}
            </div>

            <button
              onClick={increase}
              style={{
                border: "none",
                background: "#f3f3f3",
                padding: "6px 10px",
                cursor: "pointer",
              }}
            >
              +
            </button>
          </div>

          <button
            onClick={handleAdd}
            style={{
              flex: 1,
              background: "#e53935",
              color: "#fff",
              border: "none",
              padding: "10px",
              borderRadius: "8px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            Додати
          </button>
        </div>
      </div>
    </div>
  );
}
