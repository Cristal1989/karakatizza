export default function Hero() {
  return (
    <section
      style={{
        padding: "60px 20px",
        background: "#ffffff",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "40px",
          alignItems: "center",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "44px",
              fontWeight: "800",
              marginBottom: "16px",
            }}
          >
            Свіжі роли з доставкою
          </h1>

          <p
            style={{
              fontSize: "18px",
              color: "#666",
              marginBottom: "24px",
            }}
          >
            Готуємо тільки після замовлення. Швидка доставка по місту.
          </p>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              style={{
                background: "#e53935",
                color: "#fff",
                border: "none",
                padding: "14px 22px",
                borderRadius: "10px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Перейти до меню
            </button>

            <button
              style={{
                background: "#eee",
                border: "none",
                padding: "14px 22px",
                borderRadius: "10px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Акції
            </button>
          </div>
        </div>

        <div>
          <img
            src="/images/fola.jpeg"
            alt="ролл"
            style={{
              width: "100%",
              borderRadius: "20px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
            }}
          />
        </div>
      </div>
    </section>
  );
}
