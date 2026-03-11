import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import Hero from "../components/Hero";
import ProductGrid from "../components/ProductGrid";
import CategoryTabs from "../components/CategoryTabs";
import CartDrawer from "../components/CartDrawer";
import MobileCartBar from "../components/MobileCartBar";
import CartToast from "../components/CartToast";
import UpsellSection from "../components/UpsellSection";
import { getProducts } from "../api/productsApi";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProducts();
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

  const visibleProducts = useMemo(() => {
    if (activeCategory === "all") return products;
    return products.filter((product) => product.category === activeCategory);
  }, [products, activeCategory]);

  const upsellProducts = useMemo(() => {
    return products
      .filter(
        (product) =>
          product.category === "snacks" || product.category === "drinks"
      )
      .slice(0, 4);
  }, [products]);

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa" }}>
      <Header />
      <CartToast />
      <Hero />
      <CartDrawer />
      <MobileCartBar />

      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "32px 20px 100px",
        }}
      >
        <section style={{ marginBottom: "28px" }}>
          <h2
            style={{
              fontSize: "34px",
              fontWeight: "800",
              marginBottom: "8px",
            }}
          >
            Меню
          </h2>

          <p
            style={{
              color: "#666",
              marginBottom: "20px",
            }}
          >
            Обирайте роли, сети, закуски та напої
          </p>

          <CategoryTabs
            activeCategory={activeCategory}
            onChange={setActiveCategory}
          />
        </section>

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
    </div>
  );
}
