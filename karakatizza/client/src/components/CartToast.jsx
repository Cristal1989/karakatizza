import { useEffect, useState } from "react";

export default function CartToast() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleCartToast = (event) => {
      setMessage(event.detail || "Товар додано");
    };

    window.addEventListener("cart:toast", handleCartToast);

    return () => {
      window.removeEventListener("cart:toast", handleCartToast);
    };
  }, []);

  useEffect(() => {
    if (!message) return;

    const timeout = setTimeout(() => {
      setMessage("");
    }, 2200);

    return () => clearTimeout(timeout);
  }, [message]);

  if (!message) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: "88px",
        transform: "translateX(-50%)",
        background: "#1f2937",
        color: "#fff",
        padding: "12px 16px",
        borderRadius: "14px",
        fontWeight: 700,
        fontSize: "14px",
        zIndex: 9999,
        boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
        whiteSpace: "nowrap",
      }}
    >
      ✅ {message}
    </div>
  );
}
