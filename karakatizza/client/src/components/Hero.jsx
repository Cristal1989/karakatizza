import HeroSlider from "./HeroSlider";

const scrollToMenu = () => {
  const menu = document.getElementById("menu");
  if (menu) {
    menu.scrollIntoView({ behavior: "smooth" });
  }
};
const isMobile = window.matchMedia("(max-width: 768px)").matches;

export default function Hero({ banners = [] }) {
  return (
    <section
      style={{
        padding: isMobile ? "16px 16px 0 0" : "32px 20px 0 0",
        background: "#fff",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1.05fr 1fr",
          gap: isMobile ? "16px" : "32px",
          alignItems: "center",
        }}
      >
        <div style={{ maxWidth: isMobile ? "100%" : "520px" }}>
          <h1
            style={{
              fontSize: isMobile ? "56px" : "56px",
              lineHeight: isMobile ? "0.95" : "1.02",
              fontWeight: 900,
              margin: "0 0 16px",
              color: "#1b1b1b",
            }}
            className="heroTitle"
          >
            Свіжі роли з доставкою
          </h1>

          <p
            style={{
              fontSize: isMobile ? "16px" : "18px",
              lineHeight: 1.5,
              color: "#666",
              margin: "0 0 20px",
            }}
          >
            Готуємо тільки після замовлення. Швидка доставка по місту.
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: isMobile ? "0" : "0",
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
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            marginTop: isMobile ? "0" : "0",
          }}
        >
          <HeroSlider banners={banners} />
        </div>
      </div>
    </section>
  );
}
