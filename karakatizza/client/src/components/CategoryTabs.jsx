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

  return (
    <div
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
            onClick={() => onChange(category.id)}
            className={`categoryButton ${
              activeCategory === category.id ? "active" : ""
            }`}
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
                background:
                  activeCategory === category.id ? "#fff3c4" : "#f5f5f5",
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
                fontWeight: activeCategory === category.id ? 700 : 600,
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
  );
}
