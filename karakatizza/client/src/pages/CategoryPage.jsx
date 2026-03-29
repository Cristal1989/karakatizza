import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Seo from "../components/Seo";
import ProductGrid from "../components/ProductGrid";
import { getProducts } from "../api/productsApi";

const CONFIG = {
  "/rolls": {
    title: "Роли у Миколаєві — Karakatizza",
    h1: "Роли у Миколаєві",
    categories: ["rolls", "роли"],
  },
  "/sets": {
    title: "Сети суші у Миколаєві — Karakatizza",
    h1: "Сети суші у Миколаєві",
    categories: ["sets", "сети"],
  },
  "/baked-rolls": {
    title: "Запечені роли у Миколаєві — Karakatizza",
    h1: "Запечені роли у Миколаєві",
    categories: ["baked", "запечені"],
  },
  "/drinks": {
    title: "Напої до суші — Karakatizza",
    h1: "Напої",
    categories: ["drinks", "напої"],
  },
};

export default function CategoryPage() {
  const { pathname } = useLocation();
  const config = CONFIG[pathname];

  const [products, setProducts] = useState([]);

  useEffect(() => {
    getProducts().then((data) => {
      setProducts(data || []);
    });
  }, []);

  if (!config) return null;

  const filtered = products.filter((p) =>
    config.categories.includes(p.category?.toLowerCase())
  );

  return (
    <>
      <Seo title={config.title} />

      <div style={{ padding: "24px" }}>
      <div
            onClick={() => navigate("/")}
            style={{
              border: "none",
              background: "none",
              color: "#ef4444",
              fontWeight: 700,
              cursor: "pointer",
              marginBottom: "16px",
            }}
          >
           <div style={{ marginBottom: "12px", fontSize: "14px", color: "#6b7280" }}>
  <Link to="/">Головна</Link> / Роли
</div>
          </div>

        <h1 style={{ marginBottom: "20px" }}>{config.h1}</h1>
        <p style={{ maxWidth: "600px", marginBottom: "20px" }}>
        Преміальні роли з доставкою по Миколаєву — швидко, смачно, без компромісів
</p>
<p style={{ maxWidth: "600px", marginBottom: "24px", color: "#6b7280" }}>
  Філадельфія, Каліфорнія, авторські роли та запечені сети.
  Готуємо зі свіжих інгредієнтів і доставляємо по всьому Миколаєву.
</p>

        <ProductGrid products={filtered} />
        <section style={{ marginTop: "40px", maxWidth: "800px" }}>
  <h2>Доставка ролів у Миколаєві</h2>
  <p>
    Замовити роли у Миколаєві можна онлайн на сайті Karakatizza.
    У меню класичні роли, запечені та сети для компаній.
    Доставляємо швидко по всьому місту.
  </p>
</section>
      </div>
      
    </>
  );
}

