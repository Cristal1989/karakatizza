import ProductCard from "./ProductCard";
import { memo } from "react";

function ProductGrid({ products }) {
  if (!products || products.length === 0) {
    return (
      <div
        style={{
          padding: "24px",
          background: "#fff",
          borderRadius: "16px",
          color: "#666",
        }}
      >
        Наразі товарів немає
      </div>
    );
  }

  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  return (
    <div
      className="productGrid"
      style={{
        display: "grid",
        gridTemplateColumns: isMobile
          ? "1fr"
          : "repeat(auto-fill, minmax(260px, 1fr))",
        gap: isMobile ? "16px" : "20px",
        alignItems: "stretch",
      }}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export default memo(ProductGrid);
