import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function ContactsPage() {
  const navigate = useNavigate();
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "20px 16px 32px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            background: "rgb(47, 49, 54)",
            color: "#fff",
            borderRadius: "24px",
            padding: "20px 18px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.08)",
              color: "#ffd54a",
              fontSize: "13px",
              fontWeight: 700,
              marginBottom: "14px",
            }}
          >
            Karakatizza • Миколаїв
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "34px",
              lineHeight: 1.05,
              fontWeight: 800,
              letterSpacing: "-0.5px",
            }}
          >
            Контакти
          </h1>

          <p
            style={{
              margin: "14px 0 0",
              fontSize: "18px",
              lineHeight: 1.55,
              color: "rgba(255,255,255,0.88)",
              maxWidth: "700px",
            }}
          >
            Зв’язатися з нами можна телефоном, через Instagram або під час
            оформлення замовлення на сайті.
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              marginTop: "18px",
            }}
          >
            <a
              href="tel:0965881010"
              style={{
                textDecoration: "none",
                background: "#e85d3f",
                color: "#fff",
                padding: "12px 18px",
                borderRadius: "14px",
                fontWeight: 700,
                fontSize: "15px",
              }}
            >
              Подзвонити
            </a>

            <Link
              to="/"
              style={{
                textDecoration: "none",
                background: "rgba(255,255,255,0.08)",
                color: "#fff",
                padding: "12px 18px",
                borderRadius: "14px",
                fontWeight: 700,
                fontSize: "15px",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              Перейти в меню
            </Link>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <Card title="Телефон">
            <a
              href="tel:0965881010"
              style={{
                color: "#e85d3f",
                textDecoration: "none",
                fontWeight: 800,
                fontSize: "24px",
              }}
            >
              096 588 10 10
            </a>
          </Card>

          <Card title="Графік роботи">Щодня з 10:00 до 22:00</Card>

          <Card title="Instagram">
            <a
              href="https://www.instagram.com/karakatizza_niko?igsh=aXA4Y3M1a3J6NDFn"
              target="_blank"
              rel="noreferrer"
              style={{
                color: "#e85d3f",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              @karakatizza_niko
            </a>
          </Card>

          <Card title="Адреса">
            Миколаїв, вул. Мала морська 108/5, ТЦ Портал 2 поверх
          </Card>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            padding: "16px",
            border: "1px solid #ececec",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              fontSize: "22px",
              fontWeight: 800,
              color: "#222",
              marginBottom: "12px",
            }}
          >
            Ми на карті
          </div>

          <a
            href="https://www.google.com/maps?q=46.953807,31.994199"
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
              background: "#e85d3f",
              color: "#fff",
              padding: "12px 18px",
              borderRadius: "14px",
              fontWeight: 700,
            }}
          >
            Відкрити карту
          </a>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            padding: "16px",
            border: "1px solid #ececec",
            color: "#666",
            fontSize: "15px",
            lineHeight: 1.55,
          }}
        >
          Якщо є питання по замовленню, доставці або акціях — зв’яжіться з нами
          будь-яким зручним способом.
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

function Card({ title, children }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "20px",
        padding: "18px 16px",
        border: "1px solid #ececec",
        boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          fontSize: "22px",
          fontWeight: 800,
          color: "#222",
          marginBottom: "8px",
          lineHeight: 1.15,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "16px",
          lineHeight: 1.55,
          color: "#666",
        }}
      >
        {children}
      </div>
    </div>
  );
}
