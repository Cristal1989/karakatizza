import { useRef, useState } from "react";

const categories = [
  { id: "rolls", label: "Роли", icon: "/svg/roll1.svg" },
  { id: "maki", label: "Макі", icon: "/svg/maki.svg" },
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
  const [hasScrolled, setHasScrolled] = useState(false);
  const tabsRef = useRef(null);

  const handleTabsScroll = () => {
    if (!tabsRef.current) return;

    if (tabsRef.current.scrollLeft > 10 && !hasScrolled) {
      setHasScrolled(true);
    }
  };

  return (
    <div
      style={{
        position: "relative",
      }}
    >
      <div
        ref={tabsRef}
        onScroll={handleTabsScroll}
        className="categoryTabs"
        style={{
          display: "flex",
          gap: isMobile ? "14px" : "18px",
          overflowX: "auto",
          overflowY: "hidden",
          paddingBottom: "8px",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {categories.map((category) => {
          const isActive = activeCategory === category.id;

          return (
            <button
              key={category.id}
              onClick={() => {
                onChange(category.id);
                if (isMobile && !hasScrolled) {
                  setHasScrolled(true);
                }
              }}
              className={`categoryButton ${isActive ? "active" : ""}`}
              style={{
                border: "none",
                background: "transparent",
                padding: "10px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: isMobile ? "8px" : "22px",
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
                  alt={category.label}
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

      {isMobile && !hasScrolled && (
        <>
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "54px",
              height: "100%",
              pointerEvents: "none",
              background:
                "linear-gradient(to right, rgba(247,247,247,0), rgba(247,247,247,0.96))",
            }}
          />

          <div
            style={{
              position: "absolute",
              right: "8px",
              top: "34%",
              transform: "translateY(-50%)",
              width: "28px",
              height: "28px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.92)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#555",
              fontSize: "20px",
              fontWeight: "700",
              pointerEvents: "none",
              zIndex: 2,
            }}
          >
            ›
          </div>
        </>
      )}
    </div>
  );
}
