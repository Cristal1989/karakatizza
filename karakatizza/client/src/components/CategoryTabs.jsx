const categories = [
  { id: "all", label: "Усе" },
  { id: "rolls", label: "Роли" },
  { id: "baked", label: "Запечені" },
  { id: "sets", label: "Сети" },
  { id: "snacks", label: "Закуски" },
  { id: "drinks", label: "Напої" },
];

export default function CategoryTabs({ activeCategory, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
        marginBottom: "24px",
      }}
    >
      {categories.map((category) => {
        const isActive = activeCategory === category.id;

        return (
          <button
            key={category.id}
            onClick={() => onChange(category.id)}
            style={{
              border: "none",
              borderRadius: "999px",
              padding: "10px 16px",
              cursor: "pointer",
              fontWeight: "700",
              background: isActive ? "#e53935" : "#ffffff",
              color: isActive ? "#ffffff" : "#222222",
              boxShadow: isActive
                ? "0 8px 18px rgba(229,57,53,0.25)"
                : "0 4px 12px rgba(0,0,0,0.06)",
            }}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}
