import HeroSlider from "./HeroSlider";

const scrollToMenu = () => {
  const menu = document.getElementById("menu");
  if (menu) {
    menu.scrollIntoView({ behavior: "smooth" });
  }
};

export default function Hero({ banners = [] }) {
  return (
    <section
      style={{
        padding: "16px 20px 0px",
        background: "#ffffff",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "minmax(320px, 520px) minmax(320px, 620px)",
          justifyContent: "space-between",
          gap: "28px",
          alignItems: "center",
        }}
      >
        <div style={{ maxWidth: "520px" }}>
          <h1
            style={{
              fontSize: "clamp(32px, 9vw, 56px)",
              lineHeight: 1.05,
              fontWeight: 900,
              margin: "0 0 16px",
              color: "#1b1b1b",
            }}
          >
            Свіжі роли з доставкою
          </h1>

          <p
            style={{
              fontSize: "clamp(16px, 4.2vw, 18px)",
              lineHeight: 1.55,
              color: "#666",
              margin: "0 0 24px",
            }}
          >
            Готуємо тільки після замовлення. Швидка доставка по місту.
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={scrollToMenu}
              style={{
                border: "none",
                background: "#e85d3f",
                color: "#fff",
                padding: "14px 22px",
                borderRadius: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Перейти до меню
            </button>

            <button
              type="button"
              onClick={scrollToMenu}
              style={{
                border: "none",
                background: "#f2f2f2",
                color: "#333",
                padding: "14px 22px",
                borderRadius: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Акції
            </button>
          </div>
        </div>

        <div
          style={{
            width: "100%",
            maxWidth: "680px",
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
          }}
        >
          <HeroSlider banners={banners} />
        </div>
      </div>
    </section>
  );
}
