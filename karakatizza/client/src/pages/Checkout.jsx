import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { createOrder } from "../api/ordersApi";
import {
  getRouteDistanceKm,
  getDeliveryInfo,
} from "../services/deliveryService";

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, clearCart, totalPrice } = useCart();
  const {
    checkoutMode,
    setCheckoutMode,
    confirmedAddress,
    regularSticksCount,
    setRegularSticksCount,
    trainingSticksCount,
    setTrainingSticksCount,
    sticksExtraPrice,
    checkoutTotalPrice,
  } = useCart();

  const [address, setAddress] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "+380",
    address: "",
    comment: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (confirmedAddress && checkoutMode === "delivery") {
      setForm((prev) => ({
        ...prev,
        address: confirmedAddress,
      }));
    }

    if (checkoutMode === "pickup") {
      setForm((prev) => ({
        ...prev,
        address: "",
      }));
      setError("");
    }
  }, [confirmedAddress, checkoutMode]);

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

    if (checkoutMode === "delivery" && !form.address.trim()) {
      return "Вкажіть адресу доставки";
    }

    if (checkoutMode === "delivery" && !addressRegex.test(trimmedAddress)) {
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
        mode: checkoutMode,
        address:
          checkoutMode === "pickup"
            ? "Самовивіз: Миколаїв, вул. Мала Морська 108 ТЦ Портал"
            : form.address.trim(),
        comment: form.comment.trim(),
        totalPrice: checkoutTotalPrice,
        regularSticksCount,
        trainingSticksCount,
        sticksExtraPrice,
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

  async function geocodeAddress(addressText) {
    const query = encodeURIComponent(`Миколаїв, ${addressText}`);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ua&q=${query}`
    );

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Адресу не знайдено");
    }

    return {
      lat: Number(data[0].lat),
      lng: Number(data[0].lon),
      displayName: data[0].display_name,
    };
  }

  async function handleCheckDelivery() {
    if (!address.trim()) {
      setDeliveryError("Введіть адресу доставки");
      setDeliveryInfo(null);
      return;
    }

    try {
      setDeliveryLoading(true);
      setDeliveryError("");
      setDeliveryInfo(null);

      const location = await geocodeAddress(address);
      const distanceKm = await getRouteDistanceKm(location.lat, location.lng);
      const info = getDeliveryInfo(distanceKm, totalPrice);

      setDeliveryInfo({
        ...info,
        resolvedAddress: location.displayName,
      });
    } catch (error) {
      setDeliveryError(error.message || "Не вдалося перевірити доставку");
      setDeliveryInfo(null);
    } finally {
      setDeliveryLoading(false);
    }
  }

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
          maxWidth: "1280px",
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

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            <button
              type="button"
              onClick={() => setCheckoutMode("delivery")}
              style={{
                border: "none",
                borderRadius: "12px",
                padding: "12px",
                fontWeight: "700",
                cursor: "pointer",
                background: checkoutMode === "delivery" ? "#e56a45" : "#f2f2f2",
                color: checkoutMode === "delivery" ? "#fff" : "#222",
              }}
            >
              Доставка
            </button>

            <button
              type="button"
              onClick={() => setCheckoutMode("pickup")}
              style={{
                border: "none",
                borderRadius: "12px",
                padding: "12px",
                fontWeight: "700",
                cursor: "pointer",
                background: checkoutMode === "pickup" ? "#e56a45" : "#f2f2f2",
                color: checkoutMode === "pickup" ? "#fff" : "#222",
              }}
            >
              Самовивіз
            </button>
          </div>

          <p style={{ color: "#666", marginBottom: "24px" }}>
            {checkoutMode === "delivery"
              ? "Заповніть дані для доставки"
              : "Заповніть дані для самовивозу"}
          </p>

          {checkoutMode === "pickup" && (
            <div
              style={{
                padding: "12px",
                background: "#f7f7f7",
                borderRadius: "12px",
                marginBottom: "16px",
                color: "#333",
                fontWeight: "600",
              }}
            >
              Самовивіз: Миколаїв, вул. Мала Морська 108 ТЦ Портал
            </div>
          )}

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

            {checkoutMode === "delivery" && (
              <input
                type="text"
                placeholder="Адреса доставки"
                value={form.address}
                onChange={handleAddressChange}
                required
                style={inputStyle}
              />
            )}

            <div
              style={{
                marginBottom: "16px",
                padding: "14px",
                borderRadius: "12px",
                border: "1px solid #e8e8e8",
                background: "#fff",
              }}
            >
              <div
                style={{
                  fontWeight: "700",
                  color: "#222",
                  marginBottom: "12px",
                }}
              >
                Палички
              </div>

              <div
                style={{
                  display: "grid",
                  gap: "12px",
                }}
              >
                <div>
                  <div
                    style={{
                      marginBottom: "8px",
                      fontWeight: "600",
                      color: "#333",
                    }}
                  >
                    Звичайні
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setRegularSticksCount((prev) => Math.max(0, prev - 1))
                      }
                      style={{
                        width: "38px",
                        height: "38px",
                        border: "none",
                        borderRadius: "10px",
                        background: "#f0f0f0",
                        cursor: "pointer",
                        fontSize: "20px",
                      }}
                    >
                      -
                    </button>

                    <div
                      style={{
                        minWidth: "30px",
                        textAlign: "center",
                        fontWeight: "700",
                        fontSize: "16px",
                      }}
                    >
                      {regularSticksCount}
                    </div>

                    <button
                      type="button"
                      onClick={() => setRegularSticksCount((prev) => prev + 1)}
                      style={{
                        width: "38px",
                        height: "38px",
                        border: "none",
                        borderRadius: "10px",
                        background: "#f0f0f0",
                        cursor: "pointer",
                        fontSize: "20px",
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      marginBottom: "8px",
                      fontWeight: "600",
                      color: "#333",
                    }}
                  >
                    Навчальні (+2 грн)
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setTrainingSticksCount((prev) => Math.max(0, prev - 1))
                      }
                      style={{
                        width: "38px",
                        height: "38px",
                        border: "none",
                        borderRadius: "10px",
                        background: "#f0f0f0",
                        cursor: "pointer",
                        fontSize: "20px",
                      }}
                    >
                      -
                    </button>

                    <div
                      style={{
                        minWidth: "30px",
                        textAlign: "center",
                        fontWeight: "700",
                        fontSize: "16px",
                      }}
                    >
                      {trainingSticksCount}
                    </div>

                    <button
                      type="button"
                      onClick={() => setTrainingSticksCount((prev) => prev + 1)}
                      style={{
                        width: "38px",
                        height: "38px",
                        border: "none",
                        borderRadius: "10px",
                        background: "#f0f0f0",
                        cursor: "pointer",
                        fontSize: "20px",
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {sticksExtraPrice > 0 && (
                <div
                  style={{
                    marginTop: "12px",
                    fontSize: "14px",
                    color: "#666",
                  }}
                >
                  Додатково за навчальні палички: {sticksExtraPrice} грн
                </div>
              )}
            </div>

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
            <span>{checkoutTotalPrice} грн</span>
          </div>
        </div>
      </div>
    </div>
  );
}
