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
    Number(product.oldPrice) > 0 &&
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
        height: "420px",
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
          // justifyContent: "space-between",
          borderRadius: "18px",
          overflow: "hidden",
          border: "1px solid #f1f1f1",
          background: "#fff",
          // height: "380px",
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
            padding: "8px 14px 8px",
            display: "flex",
            flexDirection: "column",
            flex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "10px",
              marginBottom: "6px",
            }}
          >
            <div
              style={{
                fontSize: isMobile ? "20px" : "18px",
                fontWeight: 800,
                color: "#222",
                lineHeight: 1.2,
                flex: 1,
              }}
            >
              {product.name}
            </div>

            <div
              style={{
                fontSize: "13px",
                color: "#8c8c8c",
                whiteSpace: "nowrap",
                flexShrink: 0,
                marginTop: "2px",
              }}
            >
              {product.weight || ""}
            </div>
          </div>

          <div
            style={{
              fontSize: "15px",
              color: "#666",
              lineHeight: 1.35,
              height: "42px",
              overflow: "hidden",
              marginBottom: "10px",
            }}
          >
            {product.description || ""}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              marginTop: "auto",
              minHeight: "44px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "nowrap",
                minHeight: "28px",
                flex: 1,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontSize: isMobile ? "20px" : "20px",
                  fontWeight: 800,
                  color: showOldPrice ? "#d85a43" : "#111",
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {product.price} грн
              </div>

              {showOldPrice && (
                <div
                  style={{
                    fontSize: isMobile ? "13px" : "14px",
                    fontWeight: 600,
                    color: "#9b9b9b",
                    textDecoration: "line-through",
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {product.oldPrice} грн
                </div>
              )}
            </div>

            <div
              style={{
                width: isMobile ? "118px" : "132px",
                minWidth: isMobile ? "118px" : "132px",
                height: "40px",
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              {quantityInCart > 0 ? (
                <div
                  style={{
                    height: "40px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#f3f4f6",
                    borderRadius: "14px",
                    overflow: "hidden",
                  }}
                >
                  <button
                    onClick={() => decreaseCartItem(product.id)}
                    style={{
                      width: "40px",
                      height: "40px",
                      border: "none",
                      background: "transparent",
                      fontSize: "22px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    -
                  </button>

                  <div
                    style={{
                      minWidth: "34px",
                      textAlign: "center",
                      fontWeight: 800,
                      fontSize: "16px",
                    }}
                  >
                    {quantityInCart}
                  </div>

                  <button
                    onClick={handleAddToCart}
                    style={{
                      width: "40px",
                      height: "40px",
                      border: "none",
                      background: "#e85d3f",
                      color: "#fff",
                      fontSize: "22px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    +
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAddToCart}
                  style={{
                    // width: "100%",
                    height: "40px",
                    border: "none",
                    background: "#e85d3f",
                    color: "#fff",
                    padding: isMobile ? "10px 30px" : "12px 26px",
                    borderRadius: "12px",
                    fontWeight: 700,
                    fontSize: isMobile ? "13px" : "14px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  В кошик
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
