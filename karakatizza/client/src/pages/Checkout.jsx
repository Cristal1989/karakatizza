import { createOrder } from "../api/ordersApi";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { useState } from "react";

export default function Checkout() {
  const { cartItems, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    comment: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("1. handleSubmit запустився");

    try {
      console.log("2. cartItems:", cartItems);
      console.log("3. totalPrice:", totalPrice);
      console.log("4. form:", form);

      const payload = {
        items: cartItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        total: totalPrice,
        customer: {
          name: form.name,
          phone: form.phone,
          address: form.address,
          comment: form.comment,
        },
      };

      console.log("5. payload готовий:", payload);

      const result = await createOrder(payload);

      console.log("6. server result:", result);

      clearCart();
      navigate("/success");
    } catch (error) {
      console.error("7. ПОМИЛКА У HANDLESUBMIT:", error);
      alert("Помилка відправки замовлення");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f6f6f6",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
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
            backgroundColor: "#fff",
            borderRadius: "20px",
            padding: "24px",
            boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
          }}
        >
          <Link
            to="/"
            style={{
              color: "#e53935",
              textDecoration: "none",
              fontWeight: "700",
            }}
          >
            ← Назад в меню
          </Link>

          <h1
            style={{
              marginTop: "18px",
              marginBottom: "8px",
              fontSize: "34px",
              color: "#222",
            }}
          >
            Оформление заказа
          </h1>

          <p
            style={{
              marginTop: 0,
              color: "#666",
              marginBottom: "24px",
            }}
          >
            Заполни данные для доставки
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ display: "grid", gap: "16px" }}
          >
            <input
              type="text"
              name="name"
              placeholder="Имя"
              value={form.name}
              onChange={handleChange}
              style={{
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid #ddd",
                fontSize: "16px",
              }}
            />

            <input
              type="text"
              name="phone"
              placeholder="Телефон"
              value={form.phone}
              onChange={handleChange}
              style={{
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid #ddd",
                fontSize: "16px",
              }}
            />

            <input
              type="text"
              name="address"
              placeholder="Адрес"
              value={form.address}
              onChange={handleChange}
              style={{
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid #ddd",
                fontSize: "16px",
              }}
            />

            <textarea
              name="comment"
              placeholder="Комментарий к заказу"
              value={form.comment}
              onChange={handleChange}
              rows={4}
              style={{
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid #ddd",
                fontSize: "16px",
                resize: "vertical",
              }}
            />

            <button
              type="submit"
              style={{
                backgroundColor: "#e53935",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                padding: "16px",
                fontSize: "16px",

                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              Подтвердить заказ
            </button>
          </form>
        </div>

        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "20px",
            padding: "24px",
            boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
            height: "fit-content",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: "18px",
              fontSize: "26px",
              color: "#222",
            }}
          >
            Ваш заказ
          </h2>

          {cartItems.length === 0 ? (
            <p style={{ color: "#777" }}>Корзина пустая</p>
          ) : (
            <div style={{ display: "grid", gap: "14px" }}>
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    borderBottom: "1px solid #eee",
                    paddingBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: "700",
                          color: "#222",
                        }}
                      >
                        {item.name}
                      </div>

                      <div
                        style={{
                          fontSize: "14px",
                          color: "#666",
                          marginTop: "4px",
                        }}
                      >
                        {item.quantity} × {item.price} грн
                      </div>
                    </div>

                    <div
                      style={{
                        fontWeight: "700",
                        color: "#111",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.quantity * item.price} грн
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              marginTop: "20px",
              paddingTop: "16px",
              borderTop: "2px solid #f0f0f0",
              display: "flex",
              justifyContent: "space-between",
              fontSize: "24px",
              fontWeight: "800",
              color: "#111",
            }}
          >
            <span>Итого</span>
            <span>{totalPrice} грн</span>
          </div>
        </div>
      </div>
    </div>
  );
}
