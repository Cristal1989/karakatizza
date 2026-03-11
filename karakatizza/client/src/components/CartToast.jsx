import { useCart } from "../hooks/useCart";

export default function CartToast() {
  const { toastMessage } = useCart();

  if (!toastMessage) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "90px",
        right: "20px",
        background: "#111",
        color: "#fff",
        padding: "12px 16px",
        borderRadius: "12px",
        boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
        zIndex: 200,
        fontWeight: "600",
        animation: "toastFadeIn 0.25s ease-out",
      }}
    >
      {toastMessage}
    </div>
  );
}
