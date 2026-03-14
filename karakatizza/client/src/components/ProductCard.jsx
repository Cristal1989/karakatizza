import { memo } from "react";
import { useCart } from "../hooks/useCart";
import { getImageUrl } from "../api/productsApi";

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

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
          height: isMobile ? "180px" : "220px",
          overflow: "hidden",
          background: "#fff",
        }}
      >
        <img
          src={imageSrc}
          alt={product.name}
          loading="lazy"
          decoding="async"
          style={{
            width: "100%",
            height: "100%",
            objectFit: shouldContainImage ? "contain" : "cover",
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

          <button
            onClick={() => addToCart(product)}
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
  );
}

export default memo(ProductCard);
