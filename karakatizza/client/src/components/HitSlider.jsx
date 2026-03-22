import { useEffect, useMemo, useState } from "react";
import { useCart } from "../hooks/useCart";
import { getImageUrl } from "../api/productsApi";
import { flyToCart } from "../utils/flyToCart";

export default function HitSlider({ products = [] }) {
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  const { addToCart, cartItems = [], decreaseCartItem = () => {} } = useCart();

  const popularProducts = useMemo(() => {
    return products.filter((product) => product.popular).slice(0, 6);
  }, [products]);

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (popularProducts.length <= 1) return;

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % popularProducts.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [popularProducts.length]);

  if (!popularProducts.length) return null;

  const product = popularProducts[current];

  const imageSrc = getImageUrl(product.image, {
    width: 900,
    height: 540,
    crop: "fit",
  });

  const quantityInCart =
    cartItems.find((item) => item.id === product.id)?.quantity || 0;

  const showOldPrice =
    product.oldPrice !== null &&
    product.oldPrice !== undefined &&
    Number(product.oldPrice) > Number(product.price);

  function handleAddToCart() {
    addToCart(product);

    const imageElement = document.getElementById(`hit-image-${product.id}`);
    if (imageElement) {
      flyToCart(imageElement);
    }
  }

  return (
    <section
      style={{
        background: "#fff",
        borderRadius: "24px",
        padding: isMobile ? "14px" : "16px",
        boxShadow: "0 12px 32px rgba(0,0,0,0.06)",
        border: "1px solid #f0f0f0",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            fontSize: isMobile ? "22px" : "20px",
            fontWeight: 800,
          }}
        >
          🔥 Хіти продажу
        </div>

        {popularProducts.length > 1 && (
          <div style={{ display: "flex", gap: "6px" }}>
            {popularProducts.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                style={{
                  width: index === current ? "18px" : "8px",
                  height: "8px",
                  borderRadius: "999px",
                  border: "none",
                  background: index === current ? "#e85d3f" : "#e5e5e5",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* CARD */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          borderRadius: "18px",
          overflow: "hidden",
          border: "1px solid #f1f1f1",
          background: "#fff",
        }}
      >
        {/* IMAGE */}
        <div
          style={{
            position: "relative",
            height: isMobile ? "170px" : "200px",
            flexShrink: 0,
            borderBottom: "1px solid #f3f3f3",
          }}
        >
          {/* BADGES */}
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              display: "flex",
              gap: "6px",
              zIndex: 2,
            }}
          >
            {product.isHit && (
              <span
                style={{
                  background: "#f08a4b",
                  color: "#fff",
                  fontSize: "11px",
                  padding: "4px 8px",
                  borderRadius: "999px",
                  fontWeight: 700,
                }}
              >
                ХІТ
              </span>
            )}

            {product.promoType === "2plus1" && (
              <span
                style={{
                  background: "#2563eb",
                  color: "#fff",
                  fontSize: "11px",
                  padding: "4px 8px",
                  borderRadius: "999px",
                  fontWeight: 700,
                }}
              >
                2+1
              </span>
            )}
          </div>

          <img
            id={`hit-image-${product.id}`}
            src={imageSrc}
            alt={product.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </div>

        {/* CONTENT */}
        <div
          style={{
            padding: "12px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* TITLE */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "4px",
            }}
          >
            <div
              style={{
                fontSize: "18px",
                fontWeight: 800,
              }}
            >
              {product.name}
            </div>

            <div
              style={{
                fontSize: "13px",
                color: "#999",
              }}
            >
              {product.weight}
            </div>
          </div>

          {/* DESCRIPTION */}
          <div
            style={{
              fontSize: "14px",
              color: "#666",
              marginBottom: "10px",
            }}
          >
            {product.description}
          </div>

          {/* PRICE + BUTTON */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 800,
                }}
              >
                {product.price} грн
              </div>

              {product.oldPrice && (
                <div
                  style={{
                    fontSize: "13px",
                    color: "#999",
                    textDecoration: "line-through",
                  }}
                >
                  {product.oldPrice} грн
                </div>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              style={{
                background: "#e85d3f",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
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
    </section>
  );
}
