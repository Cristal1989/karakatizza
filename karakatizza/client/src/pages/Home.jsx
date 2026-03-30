import { useEffect, useMemo, useState, useRef } from "react";
import Header from "../components/Header";
import Hero from "../components/Hero";
import Footer from "../components/Footer";
import ProductGrid from "../components/ProductGrid";
import ProductCard from "../components/ProductCard";
import CategoryTabs from "../components/CategoryTabs";
import CartDrawer from "../components/CartDrawer";
import MobileCartBar from "../components/MobileCartBar";
import CartToast from "../components/CartToast";
import UpsellSection from "../components/UpsellSection";
import DesktopCartBar from "../components/DesktopCartBar";
import MobileCallButton from "../components/MobileCallButton";
import Seo from "../components/Seo";
import { useCart } from "../context/CartContext";
import { getProducts } from "../api/productsApi";
import { getBanners } from "../api/bannersApi";
import { getRouteDistanceKm } from "../services/deliveryService";
import { getSiteSettings } from "../api/siteSettingsApi";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [banners, setBanners] = useState([]);
  const [rollFilter, setRollFilter] = useState("all");
  const sectionRefs = useRef({});
  const { isCartOpen } = useCart();
  const [showPopup, setShowPopup] = useState(false);
  const [popupText, setPopupText] = useState("");
  const [siteSettings, setSiteSettings] = useState(null);

  const categorySections = [
    { id: "rolls", title: "Роли" },
    { id: "maki", title: "Маки" },
    { id: "sets", title: "Сети" },
    { id: "sushi_burger", title: "Суші бургер" },
    { id: "sushi", title: "Суші" },
    { id: "snacks", title: "Закуски" },
    { id: "bowls", title: "Боули" },
    { id: "drinks", title: "Напої" },
    { id: "extras", title: "Додатково" },
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: "Каракатица",
    image: "https://karakatizza.com/og-image.jpg",
    url: "https://karakatizza.com",
    telephone: "+380965881010",
    servesCuisine: ["Sushi", "Japanese"],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Миколаїв",
      addressCountry: "UA",
    },
    areaServed: "Миколаїв",
  };

  useEffect(() => {
    loadProducts();
    loadBanners();
  }, []);

  useEffect(() => {
    async function testRoute() {
      try {
        const km = await getRouteDistanceKm(46.975, 31.994);
        console.log("TEST DISTANCE KM:", km);
      } catch (error) {
        console.error("TEST ROUTE ERROR:", error);
      }
    }

    testRoute();
  }, []);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch(
          (import.meta.env.VITE_API_URL || "http://localhost:5000") +
            "/site-settings"
        );

        if (!res.ok) return;

        const s = await res.json();

        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5);
        const today = now.toISOString().slice(0, 10);

        const isClosedToday =
          s.closedAllDay === true && s.closedAllDayDate === today;

        const isAfterHours =
          currentTime < s.openingTime || currentTime > s.closingTime;

        const LAST_POPUP_KEY = "last_popup_time";
        const POPUP_INTERVAL = 30 * 60 * 1000;

        const last = localStorage.getItem(LAST_POPUP_KEY);
        const canShow = !last || Date.now() - Number(last) > POPUP_INTERVAL;

        if (!canShow) return;

        if (isClosedToday) {
          setPopupText(s.closedAllDayMessage);
          setShowPopup(true);
          localStorage.setItem(LAST_POPUP_KEY, Date.now().toString());
          return;
        }

        if (s.enableAfterHoursPopup && isAfterHours) {
          setPopupText(s.popupMessage);
          setShowPopup(true);
          localStorage.setItem(LAST_POPUP_KEY, Date.now().toString());
        }
      } catch (error) {
        console.error("SETTINGS LOAD ERROR:", error);
      }
    }

    loadSettings();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Помилка завантаження товарів:", error);
      setError("Не вдалося завантажити меню");
    } finally {
      setLoading(false);
    }
  }

  async function loadBanners() {
    try {
      const data = await getBanners();
      console.log("HOME BANNERS:", data);
      setBanners(data);
    } catch (error) {
      console.error("Помилка завантаження банерів:", error);
    }
  }

  const visibleProducts = useMemo(() => {
    let filtered = [...products];

    if (activeCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category === activeCategory
      );
    }

    filtered.sort((a, b) => {
      const priorityA = Number(a.priority ?? 10);
      const priorityB = Number(b.priority ?? 10);
      return priorityA - priorityB;
    });

    return filtered;
  }, [products, activeCategory]);

  const upsellProducts = useMemo(() => {
    return products
      .filter(
        (product) =>
          product.category === "snacks" || product.category === "drinks"
      )
      .slice(0, 4);
  }, [products]);

  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  function handleCategoryChange(categoryId) {
    setActiveCategory(categoryId);

    const target = sectionRefs.current[categoryId];
    if (!target) return;

    const y = target.getBoundingClientRect().top + window.scrollY - 120;

    window.scrollTo({
      top: y,
      behavior: "smooth",
    });
  }

  function getFilteredSectionProducts(sectionId, sectionProducts) {
    const sorted = [...sectionProducts].sort((a, b) => {
      const priorityA = Number(a.priority ?? 10);
      const priorityB = Number(b.priority ?? 10);
      return priorityA - priorityB;
    });

    if (sectionId !== "rolls") {
      return sorted;
    }

    if (rollFilter === "all") {
      return sorted;
    }

    return sorted.filter((product) => product.rollType === rollFilter);
  }

  function isOutsideWorkingHours(openTime, closeTime) {
    if (!openTime || !closeTime) return false;
  
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
    const [openHours, openMinutes] = openTime.split(":").map(Number);
    const [closeHours, closeMinutes] = closeTime.split(":").map(Number);
  
    const openTotal = openHours * 60 + openMinutes;
    const closeTotal = closeHours * 60 + closeMinutes;
  
    return currentMinutes < openTotal || currentMinutes >= closeTotal;
  }

  useEffect(() => {
    const loadSiteSettings = async () => {
      try {
        const settings = await getSiteSettings();
        setSiteSettings(settings);
      } catch (error) {
        console.error("LOAD SITE SETTINGS ERROR:", error);
      }
    };
  
    loadSiteSettings();
  }, []);

  useEffect(() => {
    if (!siteSettings) return;
  
    const workingHours = siteSettings.workingHours;
    const popup = siteSettings.popup;
  
    if (workingHours?.closedToday) {
      setPopupText(
        popup?.closedTodayText ||
          "Сьогодні ми тимчасово не працюємо, але ви можете залишити замовлення."
      );
      setShowPopup(true);
      return;
    }
  
    const outsideHours = isOutsideWorkingHours(
      workingHours?.openTime,
      workingHours?.closeTime
    );
  
    if (outsideHours && popup?.showOutsideWorkingHours) {
      setPopupText(
        popup?.outsideHoursText ||
          "Ми зараз не працюємо, але ви можете оформити замовлення."
      );
      setShowPopup(true);
      return;
    }
  
    setShowPopup(false);
  }, [siteSettings]);

  return (
    
    <div
      style={{
        minHeight: "100vh",
        background: "#fafafa",
      }}
    >
      <Seo
        title="Доставка суші та ролів у Миколаєві — Каракатица"
        description="Замовляйте суші, роли та сети у Миколаєві. Свіжі інгредієнти, швидка доставка, самовивіз та вигідні акції від Каракатица."
        url="https://karakatizza.com/"
        jsonLd={jsonLd}
      />
      <Header />
      {/* <CartToast /> */}

      <main
        style={{
          width: "100%",
          maxWidth: "1280px",
          margin: "0 auto",
          padding: isMobile ? "0 16px 100px" : "0 20px 100px",
          boxSizing: "border-box",
        }}
      >
        <h1 style={{ display: "none" }}>
  Доставка суші та ролів у Миколаєві
</h1>
        <div
          id="menu"
          style={{
            position: "sticky",
            top: "-1px",
            zIndex: 40,
            background: "#fafafa",
            padding: isMobile ? "4px 0 4px" : "8px 0 8px",
            marginBottom: "0",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <CategoryTabs
            activeCategory={activeCategory}
            onChange={handleCategoryChange}
          />
        </div>

        <Hero banners={banners} products={products} />

        {loading && (
          <div
            style={{
              padding: "40px 0",
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            Завантаження меню...
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "16px",
              background: "#fff1f1",
              color: "#b42318",
              borderRadius: "12px",
              marginBottom: "20px",
              fontWeight: "600",
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {categorySections.map((section) => {
              const sectionProducts = products.filter(
                (product) =>
                  product.category === section.id && product.isVisible !== false
              );

              if (!sectionProducts.length) return null;

              const filteredSectionProducts = getFilteredSectionProducts(
                section.id,
                sectionProducts
              );

              return (
                <section
                  key={section.id}
                  id={section.id}
                  ref={(el) => {
                    if (el) {
                      sectionRefs.current[section.id] = el;
                    }
                  }}
                  style={{
                    marginTop: "36px",
                    scrollMarginTop: isMobile ? "110px" : "130px",
                  }}
                >
                  <h2
                    style={{
                      fontSize: isMobile ? "24px" : "28px",
                      fontWeight: "800",
                      color: "#1f2937",
                      margin: "0 0 18px",
                    }}
                  >
                    {section.title}
                  </h2>
                  {section.id === "rolls" && (
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        overflowX: "auto",
                        paddingBottom: "4px",
                        marginBottom: "6px",
                      }}
                    >
                      {[
                        { key: "all", label: "Усі" },
                        { key: "cold", label: "Холодні" },
                        { key: "fried", label: "Смажені" },
                        { key: "baked", label: "Запечені" },
                        { key: "rice_free", label: "Без рису" },
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setRollFilter(item.key)}
                          style={{
                            border: "none",
                            borderRadius: "999px",
                            padding: isMobile ? "10px 14px" : "10px 16px",
                            background:
                              rollFilter === item.key ? "#e85d3f" : "#f1f1f1",
                            color: rollFilter === item.key ? "#fff" : "#333",
                            fontWeight: 700,
                            fontSize: isMobile ? "14px" : "15px",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <ProductGrid products={filteredSectionProducts} />
                </section>
              );
            })}

            {/* {upsellProducts.length > 0 && (
              <div style={{ marginTop: "40px" }}>
                <UpsellSection products={upsellProducts} />
              </div>
            )} */}
            {showPopup && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 9999,
                  background: "rgba(10, 14, 24, 0.62)",
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "20px",
                  animation: "fadeInOverlay 0.25s ease",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    maxWidth: "420px",
                    borderRadius: "24px",
                    overflow: "hidden",
                    background:
                      "linear-gradient(180deg, rgba(26,33,54,0.98) 0%, rgba(20,26,42,0.98) 100%)",
                    boxShadow:
                      "0 24px 60px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.18)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#fff",
                    animation: "popupIn 0.28s ease",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      padding: "22px 22px 18px",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      background:
                        "radial-gradient(circle at top right, rgba(232,93,63,0.22), transparent 35%)",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setShowPopup(false)}
                      aria-label="Закрити"
                      style={{
                        position: "absolute",
                        top: "14px",
                        right: "16px",
                        border: "none",
                        background: "transparent",
                        color: "rgba(255,255,255,0.7)",
                        fontSize: "24px",
                        fontWeight: 300,
                        cursor: "pointer",
                        padding: 0,
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>

                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 12px",
                        borderRadius: "999px",
                        background: "rgba(232,93,63,0.14)",
                        color: "#ffb19d",
                        fontSize: "13px",
                        fontWeight: 700,
                        letterSpacing: "0.2px",
                        marginBottom: "14px",
                      }}
                    >
                      <span style={{ fontSize: "14px" }}>●</span>
                      Режим роботи
                    </div>

                    <div
                      style={{
                        fontSize: "28px",
                        fontWeight: 800,
                        lineHeight: 1.05,
                        marginBottom: "10px",
                        letterSpacing: "-0.6px",
                      }}
                    >
                      Ми зараз
                      <br />
                      не працюємо
                    </div>

                    <div
                      style={{
                        color: "rgba(255,255,255,0.82)",
                        fontSize: "16px",
                        lineHeight: 1.55,
                        maxWidth: "320px",
                      }}
                    >
                      {popupText}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "18px 22px 22px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        padding: "12px 14px",
                        borderRadius: "16px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <div
                        style={{
                          minWidth: "34px",
                          height: "34px",
                          borderRadius: "12px",
                          background: "rgba(232,93,63,0.14)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ff9c83",
                          fontWeight: 800,
                        }}
                      >
                        ⏰
                      </div>

                      <div>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: 700,
                            marginBottom: "4px",
                            color: "#fff",
                          }}
                        >
                          Замовлення можна оформити вже зараз
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            lineHeight: 1.5,
                            color: "rgba(255,255,255,0.72)",
                          }}
                        >
                          Ми побачимо його і зв’яжемося з вами, щойно будемо в
                          робочому режимі.
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowPopup(false)}
                      style={{
                        width: "100%",
                        border: "none",
                        borderRadius: "16px",
                        padding: "15px 18px",
                        background:
                          "linear-gradient(180deg, #f07a57 0%, #e85d3f 100%)",
                        color: "#fff",
                        fontSize: "16px",
                        fontWeight: 800,
                        letterSpacing: "0.2px",
                        cursor: "pointer",
                        boxShadow: "0 10px 24px rgba(232,93,63,0.28)",
                      }}
                    >
                      Зрозуміло
                    </button>
                  </div>
                </div>

                <style>
                  {`
        @keyframes popupIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}
                </style>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />

      <CartDrawer />
      <MobileCartBar />
      <DesktopCartBar />
      <MobileCallButton isCartOpen={isCartOpen} />
    </div>
  );
}
