export default function MobileCallButton({ isCartOpen }) {
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  if (!isMobile || isCartOpen) return null;

  return (
    <a
      href="tel:0965881010"
      style={{
        position: "fixed",
        right: "16px",
        bottom: "96px",
        width: "64px",
        height: "64px",
        borderRadius: "50%",
        background: "#4fa3e3",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 10px 28px rgba(0,0,0,0.25)",
        zIndex: 120,
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
