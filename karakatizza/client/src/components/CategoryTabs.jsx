import { useEffect, useRef, useState } from "react";

const categories = [
  { id: "rolls", label: "Роли", icon: "/svg/roll1.svg" },
  { id: "maki", label: "Маки", icon: "/svg/maki.svg" },
  { id: "sets", label: "Сети", icon: "/svg/set2.svg" },
  { id: "sushi_burger", label: "Суші бургер", icon: "/svg/burger.svg" },
  { id: "sushi", label: "Суші", icon: "/svg/dabl_sushi.svg" },
  { id: "snacks", label: "Закуски", icon: "/svg/snack1.svg" },
  { id: "bowls", label: "Боули", icon: "/svg/boul.svg" },
  { id: "drinks", label: "Напої", icon: "/svg/drink2.svg" },
  { id: "extras", label: "Додатково", icon: "/svg/dop.svg" },
];

export default function CategoryTabs({ activeCategory, onChange }) {
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const tabsRef = useRef(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function updateScrollButtons() {
    const el = tabsRef.current;
    if (!el) return;

    const maxScrollLeft = el.scrollWidth - el.clientWidth;

    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(maxScrollLeft > 6 && el.scrollLeft < maxScrollLeft - 6);
  }

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;

    const raf1 = requestAnimationFrame(() => {
      updateScrollButtons();

      const raf2 = requestAnimationFrame(() => {
        updateScrollButtons();
      });

      return () => cancelAnimationFrame(raf2);
    });

    const resizeObserver = new ResizeObserver(() => {
      updateScrollButtons();
    });

    resizeObserver.observe(el);

    window.addEventListener("resize", updateScrollButtons);
    el.addEventListener("scroll", updateScrollButtons);

    return () => {
      cancelAnimationFrame(raf1);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScrollButtons);
      el.removeEventListener("scroll", updateScrollButtons);
    };
  }, []);

  function scrollTabs(direction) {
    const el = tabsRef.current;
    if (!el) return;

    const amount = isMobile ? 220 : 320;

    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });

    setTimeout(updateScrollButtons, 250);
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "100%",
      }}
    >
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollTabs("left")}
          aria-label="Прокрутити категорії вліво"
          style={{
            position: "absolute",
            left: "-20px",
            top: "37px",
            transform: "translateY(-50%)",
            width: "34px",
            height: "56px",
            border: "none",
            background: "transparent",
            boxShadow: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(34,34,34,0.62)",
            fontSize: "24px",
            fontWeight: "700",
            cursor: "pointer",
            zIndex: 8,
            padding: 0,
          }}
        >
          ‹
        </button>
      )}

      <div
        ref={tabsRef}
        className="categoryTabs"
        style={{
          display: "flex",
          gap: isMobile ? "12px" : "16px",
          overflowX: "auto",
          overflowY: "hidden",
          maxWidth: "100%",
          boxSizing: "border-box",
          paddingLeft: isMobile ? "12px" : "42px",
          paddingRight: isMobile ? "12px" : "42px",
          paddingBottom: "8px",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {categories.map((category) => {
          const isActive = activeCategory === category.id;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onChange(category.id)}
              className={`categoryButton ${isActive ? "active" : ""}`}
              style={{
                border: "none",
                background: "transparent",
                padding: "10px 6px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: isMobile ? "8px" : "10px",
                minWidth: isMobile ? "72px" : "90px",
                flex: "0 0 auto",
              }}
            >
              <div
                className="categoryIconWrapper"
                style={{
                  width: isMobile ? "56px" : "72px",
                  height: isMobile ? "56px" : "72px",
                  borderRadius: "999px",
                  background: isActive ? "#fff3c4" : "#d9d7d7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
              >
                <img
                  src={category.icon}
                  alt={`${category.label}— доставка суші Каракатица`}
                  loading="lazy"
                  className="categoryIcon"
                  style={{
                    width: isMobile ? "30px" : "38px",
                    height: isMobile ? "30px" : "38px",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>

              <span
                className="categoryLabel"
                style={{
                  fontSize: isMobile ? "12px" : "14px",
                  lineHeight: 1.2,
                  fontWeight: isActive ? 700 : 600,
                  color: "#222",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {category.label}
              </span>
            </button>
          );
        })}
      </div>

      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollTabs("right")}
          aria-label="Прокрутити категорії вправо"
          style={{
            position: "absolute",
            right: "-20px",
            top: "37px",
            transform: "translateY(-50%)",
            width: "34px",
            height: "56px",
            border: "none",
            background: "transparent",
            boxShadow: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(34,34,34,0.62)",
            fontSize: "24px",
            fontWeight: "700",
            cursor: "pointer",
            zIndex: 8,
            padding: 0,
          }}
        >
          ›
        </button>
      )}
    </div>
  );
}
