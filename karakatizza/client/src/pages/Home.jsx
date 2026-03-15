import { useEffect, useMemo, useState, useRef } from "react";
import Header from "../components/Header";
import Hero from "../components/Hero";
import ProductGrid from "../components/ProductGrid";
import ProductCard from "../components/ProductCard";
import CategoryTabs from "../components/CategoryTabs";
import CartDrawer from "../components/CartDrawer";
import MobileCartBar from "../components/MobileCartBar";
import CartToast from "../components/CartToast";
import UpsellSection from "../components/UpsellSection";
import DesktopCartBar from "../components/DesktopCartBar";
import MobileCallButton from "../components/MobileCallButton";
import { getProducts } from "../api/productsApi";
import { getBanners } from "../api/bannersApi";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [banners, setBanners] = useState([]);
  const sectionsRef = useRef({});

  useEffect(() => {
    loadProducts();
    loadBanners();
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

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fafafa",
      }}
    >
      <Header />
      <CartToast />

      <main
        style={{
          width: "100%",
          maxWidth: "1280px",
          margin: "0 auto",
          padding: isMobile ? "0 16px 100px" : "0 20px 100px",
          boxSizing: "border-box",
        }}
      >
        <Hero banners={banners} products={products} />

        {/* <section
          id="menu"
          style={{
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              marginBottom: "16px",
            }}
          >
            <h2
              style={{
                fontSize: "34px",
                fontWeight: "800",
                margin: "0 0 8px 0",
              }}
            >
              Меню
            </h2>

            <p
              style={{
                color: "#666",
                margin: 0,
              }}
            >
              Обирайте роли, сети, закуски та напої
            </p>
          </div>
        </section> */}

        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 40,
            background: "#fafafa",
            padding: isMobile ? "6px 0 8px" : "8px 0 10px",
            marginBottom: "0",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <CategoryTabs
            activeCategory={activeCategory}
            onChange={setActiveCategory}
          />
        </div>

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
            <ProductGrid products={visibleProducts} />

            {upsellProducts.length > 0 && (
              <div style={{ marginTop: "40px" }}>
                <UpsellSection products={upsellProducts} />
              </div>
            )}
          </>
        )}
      </main>

      <CartDrawer />
      <MobileCartBar />
      <DesktopCartBar />
      <MobileCallButton isCartOpen={isCartOpen} />
    </div>
  );
}
