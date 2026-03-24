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
import { useCart } from "../context/CartContext";
import { getProducts } from "../api/productsApi";
import { getBanners } from "../api/bannersApi";
import { getRouteDistanceKm } from "../services/deliveryService";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [banners, setBanners] = useState([]);
  const [rollFilter, setRollFilter] = useState("all");
  const sectionRefs = useRef({});
  const { isCartOpen } = useCart();

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

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fafafa",
      }}
    >
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
