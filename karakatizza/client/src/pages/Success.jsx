import { Link } from "react-router-dom";
import { useSiteSettings } from "../context/SiteSettingsContext";

export default function Success() {
  const { siteSettings } = useSiteSettings();

  const checkoutSuccessHint =
    siteSettings?.texts?.checkoutSuccessHint ||
    "Дякуємо за замовлення! Ми вже отримали його і незабаром почнемо готувати. Зателефонуйте нам будь ласка якщо з вами не звʼяжуться протягом 15 хвилин.";

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
      <h1 style={{ display: "none" }}>
        Доставка суші та ролів у Миколаєві
      </h1>

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

        <h2
          style={{
            margin: "0 0 12px 0",
            fontSize: "32px",
            color: "#222",
          }}
        >
          Замовлення прийнято
        </h2>

        <p
          style={{
            margin: "0 0 24px 0",
            color: "#666",
            fontSize: "17px",
            lineHeight: 1.6,
          }}
        >
          {checkoutSuccessHint}
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
          Повернутися в меню
        </Link>
      </div>
    </div>
  );
}