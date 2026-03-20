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

  const [form, setForm] = useState({
    name: "",
    phone: "+380",
    address: "",
    entrance: "",
    comment: "",
    paymentMethod: "cash",
    needExactTime: false,
    exactTime: "",
    soySauceCount: 1,
    gingerCount: 1,
    wasabiCount: 1,
  });
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState("");

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

  const cardStyle = {
    background: "#fff",
    border: "1px solid #f0e3dc",
    borderRadius: "18px",
    padding: "18px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
  };

  const sectionTitleStyle = {
    fontSize: "18px",
    fontWeight: 800,
    color: "#222",
    marginBottom: "12px",
  };

  const tabStyle = {
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #e2e2e2",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  };

  const activeTabStyle = {
    ...tabStyle,
    border: "none",
    background: "linear-gradient(135deg, #f06a4d, #e85a43)",
    color: "#fff",
  };

  const qtyBtnStyle = {
    width: "32px",
    height: "32px",
    borderRadius: "10px",
    border: "none",
    background: "#f2f2f2",
    cursor: "pointer",
    fontSize: "18px",
  };

  const nameRegex = /^[A-Za-zА-Яа-яІіЇїЄєҐґ\s'-]+$/;
  const phoneRegex = /^\+380\d{9}$/;
  const addressRegex = /^[A-Za-zА-Яа-яІіЇїЄєҐґ0-9\s./,\-]+$/;

  const hasSushiItems = cartItems.some((item) => {
    const category = item.category?.toLowerCase?.() || "";
    return (
      category === "роллы" ||
      category === "rolls" ||
      category === "маки" ||
      category === "maki" ||
      category === "сеты" ||
      category === "sets"
    );
  });

  const freeCondiments = cartItems.reduce(
    (acc, item) => {
      const category = item.category?.toLowerCase?.() || "";
      const paidQty = item.paidQuantity ?? item.quantity ?? 0;

      const isRoll = category === "роллы" || category === "rolls";
      const isMaki = category === "маки" || category === "maki";
      const isSet = category === "сеты" || category === "sets";

      if (isRoll || isMaki) {
        acc.soy += paidQty;
        acc.ginger += paidQty;
        acc.wasabi += paidQty;
      }

      if (isSet) {
        acc.soy += Number(item.freeSoySauce ?? 0) * paidQty;
        acc.ginger += Number(item.freeGinger ?? 0) * paidQty;
        acc.wasabi += Number(item.freeWasabi ?? 0) * paidQty;
      }

      return acc;
    },
    { soy: 0, ginger: 0, wasabi: 0 }
  );

  const extraSoyCount = Math.max(0, form.soySauceCount - freeCondiments.soy);
  const extraGingerCount = Math.max(
    0,
    form.gingerCount - freeCondiments.ginger
  );
  const extraWasabiCount = Math.max(
    0,
    form.wasabiCount - freeCondiments.wasabi
  );

  const condimentsExtraPrice =
    extraSoyCount * 15 + extraGingerCount * 15 + extraWasabiCount * 10;
  const finalCheckoutTotal = checkoutTotalPrice + condimentsExtraPrice;

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

  useEffect(() => {
    if (!hasSushiItems) {
      setForm((prev) => ({
        ...prev,
        soySauceCount: 0,
        gingerCount: 0,
        wasabiCount: 0,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      soySauceCount:
        prev.soySauceCount === 0 && freeCondiments.soy > 0
          ? 1
          : prev.soySauceCount,
      gingerCount:
        prev.gingerCount === 0 && freeCondiments.ginger > 0
          ? 1
          : prev.gingerCount,
      wasabiCount:
        prev.wasabiCount === 0 && freeCondiments.wasabi > 0
          ? 1
          : prev.wasabiCount,
    }));
  }, [
    hasSushiItems,
    freeCondiments.soy,
    freeCondiments.ginger,
    freeCondiments.wasabi,
  ]);

  useEffect(() => {
    if (checkoutMode === "pickup") {
      setForm((prev) => ({
        ...prev,
        address: "",
      }));
      setDeliveryInfo(null);
      setDeliveryError("");
    }
  }, [checkoutMode]);

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

    if (form.needExactTime && !form.exactTime.trim()) {
      return "Вкажіть час замовлення";
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

      let checkedDeliveryInfo = deliveryInfo;

      if (checkoutMode === "delivery") {
        const ok = await handleCheckDelivery();
        if (!ok) {
          setLoading(false);
          return;
        }

        checkedDeliveryInfo = {
          ...deliveryInfo,
          shortAddress: form.address.trim(),
        };
      }

      const orderData = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        mode: checkoutMode,
        address:
          checkoutMode === "pickup"
            ? "Самовивіз: Миколаїв, вул. Мала Морська 108 ТЦ Портал"
            : form.address.trim(),
        resolvedAddress:
          checkoutMode === "delivery"
            ? checkedDeliveryInfo?.resolvedAddress || ""
            : "",
        comment: form.comment.trim(),
        totalPrice: finalCheckoutTotal,
        entrance: form.entrance.trim(),
        paymentMethod: form.paymentMethod,
        needExactTime: form.needExactTime,
        exactTime: form.needExactTime ? form.exactTime.trim() : "",
        condiments: {
          soySauceCount: form.soySauceCount,
          gingerCount: form.gingerCount,
          wasabiCount: form.wasabiCount,
          freeSoySauce: freeCondiments.soy,
          freeGinger: freeCondiments.ginger,
          freeWasabi: freeCondiments.wasabi,
          extraSoyCount,
          extraGingerCount,
          extraWasabiCount,
          extraPrice: condimentsExtraPrice,
        },
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
          isDiscountOffer: item.isDiscountOffer ?? false,
          discountLabel: item.discountLabel,
        })),
      };

      await createOrder(orderData);

      clearCart();
      navigate("/success");
    } catch (err) {
      console.error(err);
      setError(err.message || "Не вдалося відправити замовлення");
    } finally {
      setLoading(false);
    }
  };

  async function handleCheckDelivery() {
    if (checkoutMode !== "delivery") return null;

    const rawAddress = form.address.trim();

    if (!rawAddress) {
      setDeliveryError("Введіть адресу доставки");
      setDeliveryInfo(null);
      return null;
    }

    try {
      setDeliveryLoading(true);
      setDeliveryError("");

      const location = await geocodeAddress(rawAddress);
      const distanceKm = await getRouteDistanceKm(location.lat, location.lng);
      const info = getDeliveryInfo(distanceKm, finalCheckoutTotal);

      const nextDeliveryInfo = {
        ...info,
        lat: location.lat,
        lng: location.lng,
        resolvedAddress: location.displayName || rawAddress,
        shortAddress: rawAddress,
      };

      setDeliveryInfo(nextDeliveryInfo);
      return nextDeliveryInfo;
    } catch (error) {
      setDeliveryInfo(null);
      setDeliveryError(error.message || "Не вдалося перевірити доставку");
      return null;
    } finally {
      setDeliveryLoading(false);
    }
  }

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
              <div>
                <input
                  type="text"
                  placeholder="Адреса доставки"
                  value={form.address}
                  onChange={handleAddressChange}
                  required
                  style={inputStyle}
                />

                <input
                  type="text"
                  placeholder="Під’їзд (не обов’язково)"
                  value={form.entrance}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, entrance: e.target.value }))
                  }
                  style={inputStyle}
                />
              </div>
            )}
            <div style={cardStyle}>
              <div style={sectionTitleStyle}>Оплата</div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, paymentMethod: "cash" }))
                  }
                  style={
                    form.paymentMethod === "cash" ? activeTabStyle : tabStyle
                  }
                >
                  Готівка
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, paymentMethod: "card" }))
                  }
                  style={
                    form.paymentMethod === "card" ? activeTabStyle : tabStyle
                  }
                >
                  Картка
                </button>
              </div>
            </div>

            <div style={cardStyle}>
              <label
                style={{ display: "flex", gap: "10px", alignItems: "center" }}
              >
                <input
                  type="checkbox"
                  checked={form.needExactTime}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      needExactTime: e.target.checked,
                      exactTime: e.target.checked ? prev.exactTime : "",
                    }))
                  }
                />
                Потрібно на певний час
              </label>

              {form.needExactTime && (
                <input
                  type="time"
                  value={form.exactTime}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, exactTime: e.target.value }))
                  }
                  style={{ ...inputStyle, marginTop: "12px" }}
                />
              )}
            </div>

            {hasSushiItems && (
              <div style={cardStyle}>
                <div style={sectionTitleStyle}>Додатки до ролів</div>
                <div
                  style={{
                    color: "#666",
                    fontSize: "14px",
                    marginBottom: "14px",
                  }}
                >
                  Частина додається безкоштовно залежно від кількості ролів,
                  макі та сетів.
                </div>

                {[
                  {
                    key: "soySauceCount",
                    label: "Соєвий соус",
                    freeCount: freeCondiments.soy,
                    extraPrice: 15,
                  },
                  {
                    key: "gingerCount",
                    label: "Імбир",
                    freeCount: freeCondiments.ginger,
                    extraPrice: 15,
                  },
                  {
                    key: "wasabiCount",
                    label: "Васабі",
                    freeCount: freeCondiments.wasabi,
                    extraPrice: 10,
                  },
                ].map((item) => {
                  const value = form[item.key];
                  const extraCount = Math.max(0, value - item.freeCount);

                  return (
                    <div
                      key={item.key}
                      style={{
                        padding: "14px",
                        border: "1px solid #eee",
                        borderRadius: "14px",
                        marginBottom: "10px",
                        background: "#fffaf8",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "8px",
                        }}
                      >
                        <strong>{item.label}</strong>
                        <span style={{ color: "#666" }}>
                          Безкоштовно: {item.freeCount}
                        </span>
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
                            setForm((prev) => ({
                              ...prev,
                              [item.key]: Math.max(0, prev[item.key] - 1),
                            }))
                          }
                          style={qtyBtnStyle}
                        >
                          -
                        </button>

                        <span
                          style={{
                            minWidth: "28px",
                            textAlign: "center",
                            fontWeight: 700,
                          }}
                        >
                          {value}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              [item.key]: prev[item.key] + 1,
                            }))
                          }
                          style={qtyBtnStyle}
                        >
                          +
                        </button>
                      </div>

                      {extraCount > 0 && (
                        <div
                          style={{
                            marginTop: "8px",
                            color: "#d32f2f",
                            fontSize: "13px",
                          }}
                        >
                          Додатково: {extraCount} × {item.extraPrice} грн
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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

            <div
              style={{
                marginTop: "18px",
                padding: "18px",
                borderRadius: "18px",
                background: "#fff7f3",
                border: "1px solid #f3d8cb",
                display: "grid",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Сума товарів</span>
                <strong>{checkoutTotalPrice} грн</strong>
              </div>

              {condimentsExtraPrice > 0 && (
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>Додаткові соус / імбир / васабі</span>
                  <strong>{condimentsExtraPrice} грн</strong>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "22px",
                  fontWeight: 800,
                  color: "#222",
                  paddingTop: "10px",
                  borderTop: "1px solid #ead7ce",
                }}
              >
                <span>До сплати</span>
                <span>{finalCheckoutTotal} грн</span>
              </div>
            </div>

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
      </div>
    </div>
  );
}
