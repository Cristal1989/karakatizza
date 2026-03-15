import HeroSlider from "./HeroSlider";
import HitSlider from "./HitSlider";

export default function Hero({ banners = [], products = [] }) {
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  return (
    <section
      style={{
        padding: isMobile ? "20px 16px 8px" : "32px 20px 12px",
      }}
    >
      <div
        style={{
          maxWidth: isMobile ? "100%" : "1280px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1.55fr 1fr",
          gap: isMobile ? "16px" : "24px",
          alignItems: "stretch",
        }}
      >
        <div>
          <HeroSlider banners={banners} />
        </div>

        <div>
          <HitSlider products={products} />
        </div>
      </div>
    </section>
  );
}
