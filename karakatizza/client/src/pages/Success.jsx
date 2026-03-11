import { Link } from "react-router-dom";

export default function Success() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f6f6f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "24px",
          padding: "40px",
          maxWidth: "520px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ fontSize: "56px", marginBottom: "12px" }}>🎉</div>

        <h1
          style={{
            margin: "0 0 12px 0",
            fontSize: "32px",
            color: "#222",
          }}
        >
          Заказ принят
        </h1>

        <p
          style={{
            margin: "0 0 24px 0",
            color: "#666",
            fontSize: "17px",
            lineHeight: 1.6,
          }}
        >
          Спасибо за заказ. Мы уже получили его и скоро начнём готовить.
        </p>

        <Link
          to="/"
          style={{
            display: "inline-block",
            backgroundColor: "#e53935",
            color: "#fff",
            textDecoration: "none",
            padding: "14px 20px",
            borderRadius: "12px",
            fontWeight: "700",
          }}
        >
          Вернуться в меню
        </Link>
      </div>
    </div>
  );
}
