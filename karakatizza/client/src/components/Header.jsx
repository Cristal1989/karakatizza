import React from "react";
import { SHOP_LOCATION } from "../config/deliveryConfig";

export default function Header() {
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  const openMap = () => {
    window.open(
      `https://www.google.com/maps?q=${SHOP_LOCATION.lat},${SHOP_LOCATION.lng}`,
      "_blank"
    );
  };

  return (
    <header
      style={{
        background: "#2f3136",
        color: "#fff",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 4px 18px rgba(0,0,0,0.10)",
        padding: isMobile ? "14px 16px 18px" : "18px 32px",
        overflow: "visible",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: isMobile ? "10px" : "24px",
          overflow: "visible",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: isMobile ? "flex-start" : "center",
            gap: isMobile ? "12px" : "16px",
          }}
        >
          <a
            href="#menu"
            style={{
              width: isMobile ? "56px" : "72px",
              height: isMobile ? "56px" : "72px",
              display: "inline-flex",
              textDecoration: "none",
              alignItems: "center",
              justifyContent: "center",
              overflow: "visible",
              flex: "0 0 auto",
            }}
          >
            <img
              src="/images/logo-min.png"
              alt="Karakatizza"
              style={{
                width: isMobile ? "72px" : "130px",
                height: "auto",
                objectFit: "contain",
                transform: isMobile ? "translateY(6px)" : "translateY(24px)",
                flexShrink: 0,
              }}
            />
          </a>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: isMobile ? "34px" : "40px",
                fontWeight: 800,
                color: "#fff",
                lineHeight: 1,
                marginBottom: isMobile ? "6px" : "8px",
              }}
            >
              Karakatizza
            </div>

            <div
              style={{
                marginTop: isMobile ? "none" : "8px",
                fontSize: isMobile ? "15px" : "17px",
                lineHeight: 1.3,
                color: "rgba(255,255,255,0.78)",
                maxWidth: isMobile ? "230px" : "none",
              }}
            >
              Доставка ролів, сетів, закусок і напоїв
            </div>
          </div>
        </div>

        <div className="header-right">
          <button className="mobile-map-btn" onClick={openMap}>
            <img src="/images/geo.png" alt="Карта" />
          </button>
        </div>

        <div
          style={{
            display: isMobile ? "none" : "flex",
            flexDirection: "column",
            alignItems: isMobile ? "none" : "flex-end",
            gap: "6px",
            flex: isMobile ? "none" : "0 0 auto",
            paddingLeft: isMobile ? 0 : "12px",
            alignSelf: isMobile ? "stretch" : "none",
            textAlign: isMobile ? "left" : "none",
            marginLeft: isMobile ? "94px" : "none",
          }}
        >
          <a
            href="tel:0965881010"
            style={{
              color: "#ffd54a",
              textDecoration: "none",
              fontSize: isMobile ? "24px" : "28px",
              marginTop: isMobile ? "4px" : "none",
              fontWeight: 800,
              lineHeight: 1,
            }}
          >
            096 588 10 10
          </a>

          <div
            style={{
              fontSize: isMobile ? "13px" : "15px",
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
