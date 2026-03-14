import { useEffect, useMemo, useState } from "react";
import { useCart } from "../hooks/useCart";
import { getImageUrl } from "../api/productsApi";
import { flyToCart } from "../utils/flyToCart";

export default function HitSlider({ products = [] }) {
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const { addToCart } = useCart();

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
    crop: "fill",
  });

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
        height: isMobile ? "auto" : "420px",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "12px",
          flex: "0 0 auto",
        }}
      >
        <div
          style={{
            fontSize: isMobile ? "24px" : "22px",
            fontWeight: 800,
            color: "#1b1b1b",
            lineHeight: 1.05,
          }}
        >
          🔥 Хіти продажу
        </div>

        {popularProducts.length > 1 && (
          <div
            style={{
              display: "flex",
              gap: "6px",
              flex: "0 0 auto",
            }}
          >
            {popularProducts.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrent(index)}
                style={{
                  width: index === current ? "18px" : "8px",
                  height: "8px",
                  borderRadius: "999px",
                  border: "none",
                  background: index === current ? "#e85d3f" : "#e5e5e5",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          borderRadius: "18px",
          overflow: "hidden",
          border: "1px solid #f1f1f1",
          background: "#fff",
        }}
      >
        <div
          style={{
            height: isMobile ? "180px" : "220px",
            overflow: "hidden",
            background: "#fff",
            flex: "0 0 auto",
          }}
        >
          <img
            id={`hit-image-${product.id}`}
            src={imageSrc}
            alt={product.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "center",
              display: "block",
            }}
          />
        </div>

        <div
          style={{
            padding: "14px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
          }}
        >
          <div>
            <div
              style={{
                fontSize: isMobile ? "20px" : "18px",
                fontWeight: 800,
                marginBottom: "6px",
                color: "#111",
              }}
            >
              {product.name}
            </div>

            <div
              style={{
                fontSize: "15px",
                color: "#666",
                marginBottom: "14px",
              }}
            >
              {product.description}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                fontSize: isMobile ? "20px" : "18px",
                fontWeight: 800,
                color: "#111",
                whiteSpace: "nowrap",
              }}
            >
              {product.price} грн
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              style={{
                border: "none",
                background: "#e85d3f",
                color: "#fff",
                padding: "12px 16px",
                borderRadius: "12px",
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
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
