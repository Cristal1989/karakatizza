import React from "react";

export default function Header() {
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  return (
    <header
      style={{
        background: "#2f3136",
        color: "#fff",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 4px 18px rgba(0,0,0,0.10)",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: isMobile ? "14px 16px" : "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: isMobile ? "12px" : "24px",
          flexWrap: isMobile ? "wrap" : "nowrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? "12px" : "16px",
            minWidth: 0,
            flex: "1 1 auto",
          }}
        >
          <div
            style={{
              width: isMobile ? "56px" : "72px",
              height: isMobile ? "56px" : "72px",
              borderRadius: "16px",
              background: "rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              flex: "0 0 auto",
            }}
          >
            <img
              src="/images/logo-min.png"
              alt="Karakatizza"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: isMobile ? "32px" : "40px",
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: "-0.02em",
              }}
            >
              Karakatizza
            </div>

            <div
              style={{
                marginTop: isMobile ? "6px" : "8px",
                fontSize: isMobile ? "15px" : "17px",
                lineHeight: 1.35,
                color: "rgba(255,255,255,0.78)",
                maxWidth: isMobile ? "100%" : "420px",
              }}
            >
              Доставка ролів, сетів, закусок і напоїв
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: isMobile ? "flex-start" : "flex-end",
            gap: "6px",
            flex: isMobile ? "1 1 100%" : "0 0 auto",
            paddingLeft: isMobile ? 0 : "12px",
          }}
        >
          <a
            href="tel:0965881010"
            style={{
              color: "#ffd54a",
              textDecoration: "none",
              fontSize: isMobile ? "24px" : "28px",
              fontWeight: 800,
              lineHeight: 1,
            }}
          >
            096 588 10 10
          </a>

          <div
            style={{
              fontSize: isMobile ? "14px" : "15px",
              color: "rgba(255,255,255,0.82)",
              fontWeight: 600,
            }}
          >
            Щодня з 10:00 до 22:00
          </div>
        </div>
      </div>
    </header>
  );
}
