import React from "react";
import Seo from "../components/Seo";
import { Link, useNavigate } from "react-router-dom";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { getWorkingHoursLabel } from "../utils/workingHours";

export default function DeliveryPage() {
  const navigate = useNavigate();

  const { siteSettings } = useSiteSettings();
const workingHours = siteSettings?.workingHours;

const workingHoursLabel = getWorkingHoursLabel(workingHours);
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
      }}
    >
      <Seo
        title="Доставка та самовивіз — Каракатица Миколаїв"
        description="Умови доставки та самовивозу Каракатица у Миколаєві. Дізнайтесь поріг безкоштовної доставки, графік роботи та зони обслуговування."
        url="https://karakatizza.com/delivery"
      />
      <h1 style={{ display: "none" }}>
  Доставка суші та ролів у Миколаєві
</h1>
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "20px 16px 32px",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            background: "rgb(47, 49, 54)",
            color: "#fff",
            borderRadius: "24px",
            padding: "20px 18px",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "8px 12px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.08)",
              color: "#ffd54a",
              fontSize: "13px",
              fontWeight: 700,
              marginBottom: "12px",
            }}
          >
            Karakatizza • Миколаїв
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: "34px",
              fontWeight: 800,
            }}
          >
            Оплата і доставка
          </h2>

          <p
            style={{
              marginTop: "12px",
              fontSize: "18px",
              color: "rgba(255,255,255,0.85)",
            }}
          >
            Швидка доставка по Миколаєву та зручні способи оплати.
          </p>

          <div style={{ marginTop: "16px", marginBottom: "10px" }}>
            <Link
              to="/"
              style={{
                textDecoration: "none",
                background: "#e85d3f",
                color: "#fff",
                padding: "12px 18px",
                borderRadius: "14px",
                fontWeight: 700,
              }}
            >
              Перейти в меню
            </Link>
          </div>
        </div>

        {/* DELIVERY */}
        <Section title="Доставка">
          <Item title="Швидка доставка">
            Доставляємо замовлення максимально швидко після приготування.
          </Item>

          <Item title="Вартість доставки">
            Вартість залежить від району та відстані.
          </Item>

          <Item title="Безкоштовна доставка">
            При замовленні від певної суми доставка може бути безкоштовною.
          </Item>

          <Item title="Час роботи">Щодня з {workingHoursLabel}.</Item>
        </Section>

        {/* PAYMENT */}
        <Section title="Оплата">
          <Item title="Готівкою">Оплата кур’єру при отриманні замовлення.</Item>

          <Item title="Карткою онлайн">
            Оплата на сайті через банківську карту.
          </Item>

          <Item title="Карткою кур’єру">
            Можлива оплата карткою при отриманні (уточнюйте при замовленні).
          </Item>
        </Section>

        {/* CONDITIONS */}
        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            padding: "16px",
            border: "1px solid #ececec",
            color: "#666",
            fontSize: "15px",
          }}
        >
          Умови доставки можуть змінюватися залежно від завантаженості та
          району. Деталі уточнюйте під час оформлення замовлення.
        </div>
        <button
          onClick={() => navigate("/")}
          style={{
            width: "100%",
            marginTop: "16px",
            padding: "14px",
            borderRadius: "14px",
            border: "none",
            background: "linear-gradient(135deg, #ff7a3d, #e85d3f)",
            color: "#fff",
            fontSize: "16px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 8px 20px rgba(232,93,63,0.25)",
            transition: "all 0.2s ease",
          }}
        >
          ← На головну
        </button>
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <div
        style={{
          fontSize: "26px",
          fontWeight: 800,
          marginBottom: "12px",
          color: "#1e1e1e",
        }}
      >
        {title}
      </div>

      <div style={{ display: "grid", gap: "12px" }}>{children}</div>
    </div>
  );
}

function Item({ title, children }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "20px",
        padding: "18px 16px",
        border: "1px solid #ececec",
      }}
    >
      <div
        style={{
          fontSize: "20px",
          fontWeight: 800,
          marginBottom: "6px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "16px",
          color: "#666",
          lineHeight: 1.5,
        }}
      >
        {children}
      </div>
    </div>
  );
}
