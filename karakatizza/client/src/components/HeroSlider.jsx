import { useEffect, useMemo, useState } from "react";
import { getImageUrl } from "../api/productsApi";

export default function HeroSlider({ banners = [] }) {
  const [current, setCurrent] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const activeBanners = useMemo(() => {
    return [...banners]
      .filter((banner) => banner?.image)
      .sort((a, b) => Number(a.priority || 10) - Number(b.priority || 10));
  }, [banners]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (activeBanners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % activeBanners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeBanners.length]);

  useEffect(() => {
    if (current >= activeBanners.length) {
      setCurrent(0);
    }
  }, [current, activeBanners.length]);

  const currentBanner = activeBanners[current];

  if (!currentBanner) return null;

  const selectedImage =
    isMobile && currentBanner.mobileImage
      ? currentBanner.mobileImage
      : currentBanner.image;

  const bannerImageUrl = getImageUrl(
    selectedImage,
    isMobile
      ? { width: 900, height: 420, crop: "fill" }
      : { width: 1600, height: 560, crop: "fill" }
  );

  const handlePrev = () => {
    setCurrent((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrent((prev) => (prev + 1) % activeBanners.length);
  };

  return (
    <section
      style={{
        width: "100%",
        marginBottom: "32px",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "1100px",
          margin: "0 auto",
          borderRadius: "24px",
          overflow: "hidden",
          background: "#111",
          minHeight: isMobile ? "220px" : "320px",
          boxShadow: "0 16px 40px rgba(0,0,0,0.08)",
        }}
      >
        <img
          src={bannerImageUrl}
          alt={currentBanner.title || "Банер"}
          loading="eager"
          decoding="async"
          style={{
            width: "100%",
            height: isMobile ? "220px" : "320px",
            objectFit: "cover",
            display: "block",
          }}
        />

        {activeBanners.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              style={{
                position: "absolute",
                top: "50%",
                left: "12px",
                transform: "translateY(-50%)",
                width: "40px",
                height: "40px",
                borderRadius: "999px",
                border: "none",
                background: "rgba(0,0,0,0.45)",
                color: "#fff",
                cursor: "pointer",
                fontSize: "18px",
              }}
            >
              ‹
            </button>

            <button
              type="button"
              onClick={handleNext}
              style={{
                position: "absolute",
                top: "50%",
                right: "12px",
                transform: "translateY(-50%)",
                width: "40px",
                height: "40px",
                borderRadius: "999px",
                border: "none",
                background: "rgba(0,0,0,0.45)",
                color: "#fff",
                cursor: "pointer",
                fontSize: "18px",
              }}
            >
              ›
            </button>

            <div
              style={{
                position: "absolute",
                left: "50%",
                bottom: "14px",
                transform: "translateX(-50%)",
                display: "flex",
                gap: "8px",
              }}
            >
              {activeBanners.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrent(index)}
                  style={{
                    width: index === current ? "18px" : "8px",
                    height: "8px",
                    borderRadius: "999px",
                    border: "none",
                    background:
                      index === current ? "#fff" : "rgba(255,255,255,0.55)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
