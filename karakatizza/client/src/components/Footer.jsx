import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  return (
    <footer
      style={{
        background: "rgb(47, 49, 54)",
        color: "#fff",
        marginTop: "40px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "18px 16px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: isMobile ? "center" : "space-between",
          alignItems: "center",
          gap: "12px",
          fontSize: "14px",
        }}
      >
        {/* Левая часть */}
        <div style={{ opacity: 0.7 }}>
          Karakatizza © {new Date().getFullYear()}
        </div>

        {/* Центр — ссылки */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "18px",
            justifyContent: "center",
          }}
        >
          <FooterLink to="/delivery">Оплата і доставка</FooterLink>
          <FooterLink to="/return-policy">Умови повернення</FooterLink>
          <FooterLink to="/user-agreement">Користувацька угода</FooterLink>
        </div>

        {/* Правая часть */}
        <div style={{ opacity: 0.7 }}>вул. Мала Морська 108, ТЦ Портал</div>
      </div>
    </footer>
  );
}

function FooterLink({ to, children }) {
  return (
    <Link
      to={to}
      style={{
        color: "#fff",
        textDecoration: "none",
        opacity: 0.85,
        transition: "0.2s",
      }}
      onMouseEnter={(e) => (e.target.style.opacity = "1")}
      onMouseLeave={(e) => (e.target.style.opacity = "0.85")}
    >
      {children}
    </Link>
  );
}
