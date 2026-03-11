import ProductCard from "./ProductCard";

export default function UpsellSection({ products }) {
  if (!products.length) return null;

  return (
    <section style={{ marginTop: "48px" }}>
      <div style={{ marginBottom: "22px" }}>
        <h2
          style={{
            fontSize: "30px",
            margin: "0 0 10px 0",
            color: "#222",
          }}
        >
          Додайте до замовлення
        </h2>

        <p
          style={{
            margin: 0,
            color: "#666",
            fontSize: "17px",
          }}
        >
          Те, що часто беруть разом із ролами та сетами
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "22px",
        }}
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
