import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { createOrder } from "../api/ordersApi";

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, clearCart, totalPrice } = useCart();

  const [form, setForm] = useState({
    name: "",
    phone: "+380",
    address: "",
    comment: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1px solid #ddd",
    fontSize: "16px",
    boxSizing: "border-box",
  };

  const nameRegex = /^[A-Za-zА-Яа-яІіЇїЄєҐґ\s'-]+$/;
  const phoneRegex = /^\+380\d{9}$/;
  const addressRegex = /^[A-Za-zА-Яа-яІіЇїЄєҐґ0-9\s./,\-]+$/;

  const handleNameChange = (e) => {
    const value = e.target.value;

    if (value === "" || nameRegex.test(value)) {
      setForm((prev) => ({
        ...prev,
        name: value,
      }));
    }
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/[^\d+]/g, "");

    if (!value.startsWith("+380")) {
      if (value.startsWith("380")) {
        value = `+${value}`;
      } else {
        value = "+380";
      }
    }

    if (value.length > 13) {
      value = value.slice(0, 13);
    }

    setForm((prev) => ({
      ...prev,
      phone: value,
    }));
  };

  const handlePhoneFocus = () => {
    if (!form.phone || !form.phone.startsWith("+380")) {
      setForm((prev) => ({
        ...prev,
        phone: "+380",
      }));
    }
  };

  const handleAddressChange = (e) => {
    const value = e.target.value;

    if (value === "" || addressRegex.test(value)) {
      setForm((prev) => ({
        ...prev,
        address: value,
      }));
    }
  };

  const validateForm = () => {
    const trimmedName = form.name.trim();
    const trimmedPhone = form.phone.trim();
    const trimmedAddress = form.address.trim();

    if (!trimmedName) {
      return "Вкажіть ім'я";
    }

    if (!nameRegex.test(trimmedName)) {
      return "Ім'я може містити лише літери, пробіли, апостроф і дефіс";
    }

    if (!phoneRegex.test(trimmedPhone)) {
      return "Номер телефону має бути у форматі +380XXXXXXXXX";
    }

    if (!trimmedAddress) {
      return "Вкажіть адресу доставки";
    }

    if (!addressRegex.test(trimmedAddress)) {
      return "Адреса може містити лише літери, цифри, пробіли, крапку, кому, дефіс і слеш";
    }

    if (cartItems.length === 0) {
      return "Кошик порожній";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const orderData = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        comment: form.comment.trim(),
        totalPrice,
        items: cartItems.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          paidQuantity: item.paidQuantity ?? item.quantity,
          freeQuantity: item.freeQuantity ?? 0,
          price: item.price,
          lineTotal: item.price * (item.paidQuantity ?? item.quantity),
        })),
      };

      await createOrder(orderData);

      clearCart();
      navigate("/success");
    } catch (err) {
      console.error(err);
      setError("Не вдалося відправити замовлення");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f7f7",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: "24px",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            padding: "24px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >
          <button
            onClick={() => navigate("/")}
            style={{
              border: "none",
              background: "none",
              color: "#ef4444",
              fontWeight: 700,
              cursor: "pointer",
              marginBottom: "16px",
            }}
          >
            ← Назад у меню
          </button>

          <h1
            style={{
              fontSize: "30px",
              fontWeight: 800,
              marginBottom: "10px",
            }}
          >
            Оформлення замовлення
          </h1>

          <p
            style={{
              color: "#666",
              marginBottom: "24px",
            }}
          >
            Заповніть дані для доставки
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ display: "grid", gap: "14px" }}
          >
            <input
              type="text"
              placeholder="Ім'я"
              value={form.name}
              onChange={handleNameChange}
              required
              style={inputStyle}
            />

            <input
              type="tel"
              placeholder="+380XXXXXXXXX"
              value={form.phone}
              onChange={handlePhoneChange}
              onFocus={handlePhoneFocus}
              required
              style={inputStyle}
            />

            <input
              type="text"
              placeholder="Адреса доставки"
              value={form.address}
              onChange={handleAddressChange}
              required
              style={inputStyle}
            />

            <textarea
              placeholder="Коментар до замовлення"
              rows="4"
              value={form.comment}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  comment: e.target.value,
                }))
              }
              style={inputStyle}
            />

            {error && (
              <div
                style={{
                  padding: "12px",
                  background: "#fff1f1",
                  color: "#b42318",
                  borderRadius: "10px",
                  fontWeight: "600",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: "14px",
                padding: "16px",
                fontSize: "16px",
                fontWeight: "700",
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Відправка..." : "Підтвердити замовлення"}
            </button>
          </form>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            padding: "24px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >
          <h2
            style={{
              fontSize: "22px",
              fontWeight: 800,
              marginBottom: "16px",
            }}
          >
            Ваше замовлення
          </h2>

          <div style={{ display: "grid", gap: "14px" }}>
            {cartItems.map((item) => (
              <div
                key={item.id}
                style={{
                  borderBottom: "1px solid #eee",
                  paddingBottom: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 700,
                  }}
                >
                  <span>{item.name}</span>
                  <span>
                    {item.price * (item.paidQuantity ?? item.quantity)} грн
                  </span>
                </div>

                <div
                  style={{
                    color: "#666",
                    fontSize: "14px",
                    marginTop: "4px",
                  }}
                >
                  {item.quantity} × {item.price} грн
                </div>

                {item.freeQuantity > 0 && (
                  <div
                    style={{
                      color: "#2e7d32",
                      fontSize: "13px",
                      fontWeight: "700",
                    }}
                  >
                    Акція: {item.freeQuantity} шт у подарунок
                  </div>
                )}
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: "20px",
              paddingTop: "14px",
              borderTop: "1px solid #eee",
              display: "flex",
              justifyContent: "space-between",
              fontSize: "22px",
              fontWeight: 800,
            }}
          >
            <span>Разом</span>
            <span>{totalPrice} грн</span>
          </div>
        </div>
      </div>
    </div>
  );
}
