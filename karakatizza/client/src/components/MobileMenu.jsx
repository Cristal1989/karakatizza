import React, { useEffect, useState } from "react";

const menuItems = [
  { id: "menu", label: "Меню", icon: "/svg/menu3.svg", href: "#menu" },
  { id: "about", label: "Про нас", icon: "/svg/pro_nas.svg", href: "#about" },
  { id: "promo", label: "Акції", icon: "/svg/acsia.svg", href: "#promo" },
  {
    id: "delivery",
    label: "Оплата і доставка",
    icon: "/svg/dostavka.svg",
    href: "#delivery",
  },
  {
    id: "contacts",
    label: "Контакти",
    icon: "/svg/kontakt.svg",
    href: "#contacts",
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: "/svg/Instagram.svg",
    href: "https://www.instagram.com/karakatizza_niko?igsh=aXA4Y3M1a3J6NDFn",
    external: true,
  },
];

export default function MobileMenu({ isOpen, onClose }) {
  const [pressedItem, setPressedItem] = useState(null);
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [isOpen]);

  function handleClick(item) {
    onClose();

    if (item.external) {
      window.open(item.href, "_blank");
      return;
    }

    const el = document.querySelector(item.href);
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth" });
      }, 150);
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
          zIndex: 9998,
          opacity: isOpen ? 1 : 0,
          transition: "0.3s",
          pointerEvents: isOpen ? "auto" : "none",
          width: "100vw",
          height: "100vh",
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "100%",
          height: "100vh",
          background: "#f7f7f5",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s cubic-bezier(.4,0,.2,1)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "18px",
            background: "#2f3136",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <a
              href="#menu"
              style={{
                width: "56px",
                height: "56px",
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
                  width: "72px",
                  height: "auto",
                  objectFit: "contain",
                  transform: "translateY(8px)",
                  flexShrink: 0,
                  zIndex: "999",
                }}
              />
            </a>
            <div
              style={{
                fontSize: "34px",
                fontWeight: 800,
                color: "#fff",
                lineHeight: 1,
                display: "flex",
                alignItems: "center",
                minHeight: "44px",
              }}
            >
              Karakatizza
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              border: "none",
              background: "#2f3136",
              fontSize: "22px",
              cursor: "pointer",
              color: "#fff",
            }}
          >
            ✕
          </button>
        </div>
        {/* Menu */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
          }}
        >
          {menuItems.map((item) => {
            const isPressed = pressedItem === item.id;

            return (
              <a
                key={item.id}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noreferrer" : undefined}
                onTouchStart={() => setPressedItem(item.id)}
                onTouchEnd={() => setPressedItem(null)}
                onTouchCancel={() => setPressedItem(null)}
                onMouseDown={() => setPressedItem(item.id)}
                onMouseUp={() => setPressedItem(null)}
                onMouseLeave={() => setPressedItem(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "18px 24px",
                  textDecoration: "none",
                  color: "#202020",
                  borderBottom: "1px solid #eceae4",
                  background: isPressed ? "#f3f1eb" : "transparent",
                  transform: isPressed ? "scale(1.02)" : "scale(1)",
                  transition:
                    "transform 0.16s ease, background 0.16s ease, box-shadow 0.16s ease",
                  boxShadow: isPressed ? "0 6px 18px rgba(0,0,0,0.06)" : "none",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <img
                  src={item.icon}
                  alt={item.label}
                  style={{
                    width: "28px",
                    height: "28px",
                    objectFit: "contain",
                    flexShrink: 0,
                    transform: isPressed ? "scale(1.08)" : "scale(1)",
                    transition: "transform 0.16s ease, filter 0.16s ease",
                    filter: isPressed ? "saturate(1.1)" : "none",
                  }}
                />

                <span
                  style={{
                    fontSize: "18px",
                    fontWeight: 500,
                    letterSpacing: "-0.2px",
                    transform: isPressed ? "translateX(2px)" : "translateX(0)",
                    transition: "transform 0.16s ease",
                  }}
                >
                  {item.label}
                </span>
              </a>
            );
          })}
        </div>
        {/* Bottom */}
        <div
          style={{
            padding: "18px 20px 24px",
            borderTop: "1px solid #e3e3df",
            textAlign: "center",
            fontSize: "13px",
            color: "#999",
            letterSpacing: "0.5px",
            fontWeight: 500,
            marginBottom: "20px",
          }}
        >
          KARAKATIZZA MYKOLAIV
        </div>
      </div>
    </>
  );
}
