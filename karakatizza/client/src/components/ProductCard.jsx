import { memo, useRef } from "react";
import { useCart } from "../hooks/useCart";
import { getImageUrl } from "../api/productsApi";
import { flyToCart } from "../utils/flyToCart";

function ProductCard({ product }) {
  const { addToCart, decreaseCartItem, getItemQuantity } = useCart();
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const quantityInCart = getItemQuantity(product.id);

  const shouldContainImage =
    product.category === "drinks" ||
    product.category === "snacks" ||
    product.category === "extras";

  const imageSrc = getImageUrl(
    product.image,
    shouldContainImage
      ? { width: 900, height: 540, crop: "fit" }
      : { width: 900, height: 540, crop: "fill" }
  );

  const imageRef = useRef(null);

  function handleAddToCart() {
    addToCart(product);
    flyToCart(imageRef.current);
  }

  return (
    <div
      data-product-id={product.id}
      style={{
        background: "#fff",
        borderRadius: "18px",
        overflow: "hidden",
        border: "1px solid #eee",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: isMobile ? "170px" : "220px",
          overflow: "hidden",
          background: "#fff",
        }}
      >
        <img
          ref={imageRef}
          src={imageSrc}
          alt={product.name}
          loading="lazy"
          decoding="async"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
          }}
        />
      </div>

      <div style={{ padding: "16px" }}>
        <div
          style={{
            fontSize: isMobile ? "18px" : "20px",
            fontWeight: 800,
            marginBottom: "8px",
            color: "#111",
          }}
        >
          {product.name}
        </div>

        <div
          style={{
            fontSize: "15px",
            color: "#666",
            marginBottom: "16px",
          }}
        >
          {product.description}
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
              fontSize: isMobile ? "18px" : "20px",
              fontWeight: 800,
              color: "#111",
            }}
          >
            {product.price} грн
          </div>

          {quantityInCart > 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
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
                −
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
                border: "none",
                background: "#e85d3f",
                color: "#fff",
                padding: "10px 16px",
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              В кошик
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(ProductCard);
