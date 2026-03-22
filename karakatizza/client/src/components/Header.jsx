import React, { useState } from "react";
import { SHOP_LOCATION } from "../config/deliveryConfig";
import MobileMenu from "./MobileMenu";

export default function Header() {
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
        position: "relative",
        color: "#fff",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 4px 18px rgba(0,0,0,0.10)",
        padding: isMobile ? "12px 16px 14px" : "18px 32px",
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
          gap: isMobile ? "8px" : "24px",
          overflow: "visible",
          paddingRight: isMobile ? "96px" : "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: isMobile ? "center" : "center",
            gap: isMobile ? "10px" : "16px",
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
              paddingLeft: "10px",
            }}
          >
            <img
              src="/images/logo-min.png"
              alt="Karakatizza"
              style={{
                width: isMobile ? "72px" : "130px",
                height: "auto",
                objectFit: "contain",
                transform: isMobile ? "translateY(8px)" : "translateY(24px)",
                flexShrink: 0,
                zIndex: "999",
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
                marginBottom: isMobile ? "0" : "8px",
                display: "flex",
                alignItems: "center",
                minHeight: isMobile ? "44px" : "auto",
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
                display: isMobile ? "none" : "block",
              }}
            >
              Доставка ролів, сетів, закусок і напоїв
            </div>
          </div>
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
            marginLeft: isMobile ? "0" : "none",
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
        {isMobile && (
          <div
            style={{
              position: "absolute",
              top: "22px",
              right: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              zIndex: 20,
            }}
          >
            <button
              onClick={openMap}
              style={{
                width: "44px",
                height: "44px",
                border: "none",
                background: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                cursor: "pointer",
              }}
            >
              <img
                src="/images/geo1.png"
                alt="Карта"
                style={{
                  width: "38px",
                  height: "38px",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </button>

            <button
              onClick={() => setIsMenuOpen(true)}
              style={{
                width: "40px",
                height: "40px",
                border: "none",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                cursor: "pointer",
              }}
              aria-label="Відкрити меню"
            >
              <div
                style={{
                  width: "18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <span
                  style={{
                    display: "block",
                    height: "2px",
                    borderRadius: "999px",
                    background: "#fff",
                    width: "100%",
                  }}
                />
                <span
                  style={{
                    display: "block",
                    height: "2px",
                    borderRadius: "999px",
                    background: "#fff",
                    width: "100%",
                  }}
                />
                <span
                  style={{
                    display: "block",
                    height: "2px",
                    borderRadius: "999px",
                    background: "#fff",
                    width: "100%",
                  }}
                />
              </div>
            </button>
          </div>
        )}
      </div>
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </header>
  );
}
