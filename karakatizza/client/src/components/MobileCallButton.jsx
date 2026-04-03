import { useSiteSettings } from "../context/SiteSettingsContext";

export default function MobileCallButton({ isCartOpen }) {
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  const { siteSettings } = useSiteSettings();
const contacts = siteSettings?.contacts;

const phonePrimary = contacts?.phonePrimary || "";

  if (!isMobile || isCartOpen) return null;

  return (
    <a
      href={`tel:${phonePrimary.replace(/\s+/g, "")}`}
    
      style={{
        position: "fixed",
        right: "14px",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 88px)",
        width: "58px",
        height: "58px",
        borderRadius: "50%",
        background: "#4fa3e3",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 10px 24px rgba(0,0,0,0.22)",
        zIndex: 90,
        overflow: "hidden",
        transition: "transform 0.2s ease",
        animation: "phonePulse 2.5s infinite",
      }}
      onTouchStart={(e) => {
        e.currentTarget.style.transform = "scale(0.95)";
      }}
      onTouchEnd={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <img
        src="/images/tel.png"
        alt="call— доставка суші Каракатица"
        loading="lazy"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    </a>
  );
}
