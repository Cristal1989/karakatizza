import { useEffect, useMemo, useState } from "react";
import ProductCard from "./ProductCard";

export default function HitSlider({ products = [] }) {
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const itemsPerSlide = 1;

  const popularProducts = useMemo(() => {
    return products.filter((product) => product.popular).slice(0, 6);
  }, [products]);

  const slides = useMemo(() => {
    const result = [];

    for (let i = 0; i < popularProducts.length; i += itemsPerSlide) {
      result.push(popularProducts.slice(i, i + itemsPerSlide));
    }

    return result;
  }, [popularProducts, itemsPerSlide]);

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    if (current > slides.length - 1) {
      setCurrent(0);
    }
  }, [slides.length, current]);

  if (!slides.length) return null;

  return (
    <section
      style={{
        background: "#fff",
        borderRadius: "24px",
        padding: isMobile ? "10px" : "10px",
        boxShadow: "0 12px 32px rgba(0,0,0,0.06)",
        border: "1px solid #f0f0f0",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: isMobile ? "24px" : "24px",
              fontWeight: 800,
              color: "#1b1b1b",
              lineHeight: 1.05,
              marginBottom: "6px",
            }}
          >
            🔥 Хіти продажу
          </div>
        </div>

        {slides.length > 1 && (
          <div
            style={{
              display: "flex",
              gap: "6px",
              flex: "0 0 auto",
            }}
          >
            {slides.map((_, index) => (
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

      <div>
        {slides[current].map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
