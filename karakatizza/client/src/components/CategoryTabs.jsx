const categories = [
  { id: "all", label: "Усе" },
  { id: "rolls", label: "Роли" },
  { id: "maki", label: "Маки" },
  { id: "sets", label: "Сети" },
  { id: "sushi", label: "Суші" },
  { id: "baked", label: "Запечені" },
  { id: "snacks", label: "Салати і закуски" },
  { id: "bowls", label: "Суші боули" },
  { id: "drinks", label: "Напої" },
  { id: "extras", label: "Додатково" },
];

export default function CategoryTabs({ activeCategory, onChange }) {
  return (
    <div
      className="categoryTabs"
      style={{
        display: "flex",
        gap: "10px",
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
            data-category-tab={category.id}
            onClick={() => onChange(category.id)}
            style={{
              border: "none",
              borderRadius: "999px",
              padding: "12px 18px",
              cursor: "pointer",
              flex: "0 0 auto",
              whiteSpace: "nowrap",
              fontWeight: 700,
              fontSize: "15px",
              transition: "0.2s ease",
              background: isActive ? "#ef4444" : "#fff",
              color: isActive ? "#fff" : "#111",
              boxShadow: isActive
                ? "0 8px 20px rgba(239,68,68,0.28)"
                : "0 4px 14px rgba(0,0,0,0.06)",
            }}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}
