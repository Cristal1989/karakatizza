import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import Hero from "../components/Hero";
import ProductGrid from "../components/ProductGrid";
import ProductCard from "../components/ProductCard";
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
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "32px 20px 0",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <h2
            style={{
              fontSize: "30px",
              fontWeight: "800",
              marginBottom: "8px",
            }}
          >
            🔥 Хіти продажу
          </h2>

          <p
            style={{
              color: "#666",
              margin: 0,
            }}
          >
            Найпопулярніші позиції, які замовляють найчастіше
          </p>
        </div>

        {products.filter((product) => product.popular).length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "24px",
            }}
          >
            {products
              .filter((product) => product.popular)
              .slice(0, 4)
              .map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
          </div>
        ) : null}
      </section>
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "50px 20px",
        }}
      >
        <div style={{ marginBottom: "24px" }}>
          <h2
            style={{
              fontSize: "30px",
              fontWeight: "800",
              marginBottom: "8px",
            }}
          >
            🎁 Акції
          </h2>

          <p
            style={{
              color: "#666",
              margin: 0,
            }}
          >
            Спеціальні пропозиції для наших клієнтів
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "20px",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "20px",
              padding: "24px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ fontSize: "24px", marginBottom: "10px" }}>
              🍣 2+1 на рол Кокаин
            </div>

            <div style={{ color: "#666", marginBottom: "14px" }}>
              Купи два роли Кокаин — третій отримай безкоштовно
            </div>

            <div
              style={{
                fontWeight: "700",
                color: "#e53935",
              }}
            >
              Тільки сьогодні
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: "20px",
              padding: "24px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ fontSize: "24px", marginBottom: "10px" }}>
              🥤 Напій у подарунок
            </div>

            <div style={{ color: "#666", marginBottom: "14px" }}>
              При замовленні від 500 грн отримай Pepsi 0.5 у подарунок
            </div>

            <div
              style={{
                fontWeight: "700",
                color: "#e53935",
              }}
            >
              Щодня
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: "20px",
              padding: "24px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ fontSize: "24px", marginBottom: "10px" }}>
              🍱 Знижка на сет
            </div>

            <div style={{ color: "#666", marginBottom: "14px" }}>
              Щотижнева акція на популярний сет
            </div>

            <div
              style={{
                fontWeight: "700",
                color: "#e53935",
              }}
            >
              Дивись у меню
            </div>
          </div>
        </div>
      </section>
      <CartDrawer />
      <MobileCartBar />

      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "32px 20px 100px",
        }}
      >
        <section id="menu" style={{ marginBottom: "20px" }}>
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
              marginBottom: "0",
            }}
          >
            Обирайте роли, сети, закуски та напої
          </p>
        </section>

        <div
          style={{
            position: "sticky",
            top: "90px",
            zIndex: 30,
            background: "#fafafa",
            paddingTop: "10px",
            paddingBottom: "0px",
            marginBottom: "24px",
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
    </div>
  );
}
