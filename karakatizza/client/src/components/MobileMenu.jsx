import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const menuItems = [
  {
    id: "menu",
    label: "Меню",
    icon: "/svg/menu3.svg",
    href: "#menu",
  },
  {
    id: "about",
    label: "Про нас",
    icon: "/svg/pro_nas.svg",
    href: "/about",
  },
  {
    id: "promotions",
    label: "Акції",
    icon: "/svg/acsia.svg",
    href: "/promotions",
  },
  {
    id: "delivery",
    label: "Оплата і доставка",
    icon: "/svg/dostavka.svg",
    href: "/delivery",
  },
  {
    id: "contacts",
    label: "Контакти",
    icon: "/svg/kontakt.svg",
    href: "/contacts",
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
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isOpen) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyPosition = document.body.style.position;
    const prevBodyWidth = document.body.style.width;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.position = prevBodyPosition;
      document.body.style.width = prevBodyWidth;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    const pendingTarget = sessionStorage.getItem("mobileMenuScrollTarget");
    if (!pendingTarget || location.pathname !== "/") return;

    const timer = setTimeout(() => {
      const el = document.getElementById(pendingTarget);
      if (el) {
        el.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
      sessionStorage.removeItem("mobileMenuScrollTarget");
    }, 250);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  function handleItemClick(item, e) {
    e.preventDefault();
    onClose?.();

    if (item.external) {
      window.open(item.href, "_blank", "noopener,noreferrer");
      return;
    }

    if (item.href.startsWith("/")) {
      navigate(item.href);
      return;
    }

    if (item.href.startsWith("#")) {
      const targetId = item.href.replace("#", "");

      if (location.pathname !== "/") {
        sessionStorage.setItem("mobileMenuScrollTarget", targetId);
        navigate("/");
        return;
      }

      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 260);
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100dvh",
          background: "rgb(47, 49, 54)",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
          zIndex: 9998,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.28s ease",
        }}
      />

      <div
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100dvh",
          background: "#f7f5f0",
          zIndex: 9999,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            flex: "0 0 92px",
            minHeight: "92px",
            background: "rgb(47, 49, 54)",
            padding: "18px 18px 16px",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              minWidth: 0,
            }}
          >
            <img
              src="/images/logo-min.png"
              alt="Karakatizza"
              style={{
                width: "52px",
                height: "52px",
                objectFit: "contain",
                flexShrink: 0,
              }}
            />
            <div
              style={{
                color: "#fff",
                fontSize: "28px",
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: "-0.4px",
              }}
            >
              Karakatizza
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: "40px",
              height: "40px",
              background: "transparent",
              border: "none",
              color: "#fff",
              fontSize: "38px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              transition: "transform 0.15s ease, opacity 0.15s ease",
            }}
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(0.9)")
            }
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            ×
          </button>
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              flex: 1,
              overflow: "hidden",
            }}
          >
            {menuItems.map((item) => {
              const isPressed = pressedItem === item.id;

              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => handleItemClick(item, e)}
                  onTouchStart={() => setPressedItem(item.id)}
                  onTouchEnd={() => setPressedItem(null)}
                  onTouchCancel={() => setPressedItem(null)}
                  onMouseDown={() => setPressedItem(item.id)}
                  onMouseUp={() => setPressedItem(null)}
                  onMouseLeave={() => setPressedItem(null)}
                  style={{
                    height: "72px",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "0 24px",
                    boxSizing: "border-box",
                    textDecoration: "none",
                    color: "#202020",
                    borderBottom: "1px solid #ebe6dc",
                    background: isPressed ? "#efebe2" : "transparent",
                    transform: isPressed ? "scale(1.015)" : "scale(1)",
                    transition:
                      "transform 0.16s ease, background 0.16s ease, box-shadow 0.16s ease",
                    boxShadow: isPressed
                      ? "0 6px 18px rgba(0,0,0,0.04)"
                      : "none",
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
                      filter: isPressed ? "saturate(1.08)" : "none",
                    }}
                  />

                  <span
                    style={{
                      fontSize: "18px",
                      fontWeight: 500,
                      letterSpacing: "-0.2px",
                      transform: isPressed
                        ? "translateX(2px)"
                        : "translateX(0)",
                      transition: "transform 0.16s ease",
                    }}
                  >
                    {item.label}
                  </span>
                </a>
              );
            })}
          </div>

          <div
            style={{
              flex: "0 0 70px",
              minHeight: "70px",
              borderTop: "1px solid #ebe6dc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#9c978f",
              fontSize: "14px",
              fontWeight: 700,
              letterSpacing: "1.2px",
              textTransform: "uppercase",
              background: "#f7f5f0",
              boxSizing: "border-box",
            }}
          >
            KARAKATIZZA MYKOLAIV
          </div>
        </div>
      </div>
    </>
  );
}
