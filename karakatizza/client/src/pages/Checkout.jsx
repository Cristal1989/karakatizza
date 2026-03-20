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

  const isMobile = window.innerWidth <= 768;

  const compactGrid2Style = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr",
    gap: "12px",
  };

  const compactGrid3Style = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
    gap: "12px",
    maxWidth: "420px",
  };

  const compactGrid2EqualStyle = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
    gap: "12px",
    maxWidth: "360px",
  };
  const fieldStyle = {
    width: "100%",
    height: "46px",
    border: "1px solid #e5e0da",
    borderRadius: "14px",
    padding: "0 14px",
    fontSize: "15px",
    boxSizing: "border-box",
    outline: "none",
    background: "#fff",
    color: "#222",
  };

  const miniSelectStyle = {
    ...fieldStyle,
    width: "100%",
    minWidth: 0,
    paddingRight: "10px",
  };

  const compactOptionCardStyle = {
    border: "1px solid #eee7e1",
    borderRadius: "14px",
    padding: "12px",
    background: "#fff",
    margin: "0 auto",
  };

  const compactOptionTitleStyle = {
    fontSize: "15px",
    fontWeight: 800,
    color: "#222",
    marginBottom: "8px",
    textAlign: "center",
  };

  const compactFreeStyle = {
    fontSize: "13px",
    color: "#7a746e",
    marginTop: "8px",
  };

  const compactExtraStyle = {
    fontSize: "12px",
    color: "#d46b4d",
    fontWeight: 600,
    marginTop: "6px",
  };

  const compactQtyWrapStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    border: "1px solid #ebe4dd",
    borderRadius: "12px",
    padding: "4px 8px",
    background: "#faf8f6",
  };

  const compactQtyBtnStyle = {
    width: "26px",
    height: "26px",
    borderRadius: "8px",
    border: "1px solid #e5ddd6",
    background: "#f3efeb",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "15px",
    lineHeight: 1,
  };

  const compactQtyValueStyle = {
    minWidth: "18px",
    textAlign: "center",
    fontWeight: 700,
    fontSize: "15px",
  };

  const sectionCardStyle = {
    background: "#fff",
    border: "1px solid #ece7e2",
    borderRadius: "16px",
    padding: isMobile ? "12px" : "14px",
    marginTop: "10px",
    boxSizing: "border-box",
  };

  const sectionTitleStyle = {
    fontSize: isMobile ? "17px" : "19px",
    fontWeight: 800,
    marginBottom: "6px",
    color: "#222",
  };

  const sectionHintStyle = {
    fontSize: "12px",
    color: "#7a746e",
    marginBottom: "10px",
    lineHeight: 1.35,
  };

  const summaryRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "8px",
    fontSize: "15px",
    color: "#555",
  };

  const submitButtonStyle = {
    width: "100%",
    marginTop: "14px",
    height: "52px",
    border: "none",
    borderRadius: "14px",
    background: "#d96f55",
    color: "#fff",
    fontSize: "16px",
    fontWeight: 800,
    cursor: loading ? "default" : "pointer",
    opacity: loading ? 0.8 : 1,
  };

  const fieldLabelStyle = {
    fontSize: "14px",
    fontWeight: 700,
    color: "#333",
    marginBottom: "6px",
  };

  const tabsWrapStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginBottom: "14px",
  };

  const tabBaseStyle = {
    height: "44px",
    borderRadius: "14px",
    border: "1px solid #e8e1da",
    fontWeight: 700,
    fontSize: "15px",
    cursor: "pointer",
  };

  const activeTabStyle = {
    ...tabBaseStyle,
    background: "#d96f55",
    color: "#fff",
    border: "1px solid #d96f55",
  };

  const inactiveTabStyle = {
    ...tabBaseStyle,
    background: "#f7f4f1",
    color: "#444",
  };

  const checkboxRowStyle = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "4px",
    fontSize: "15px",
    color: "#333",
  };

  const exactTimeInputStyle = {
    ...fieldStyle,
    marginTop: "10px",
  };

  const addressStatusStyle = {
    marginTop: "10px",
    padding: "12px 14px",
    borderRadius: "14px",
    fontSize: "14px",
    lineHeight: 1.4,
    border: "1px solid #e8e1da",
  };

  const successStatusStyle = {
    ...addressStatusStyle,
    background: "#f3fbf4",
    border: "1px solid #cfe8d3",
    color: "#2f6b3d",
  };

  const warningStatusStyle = {
    ...addressStatusStyle,
    background: "#fff8ef",
    border: "1px solid #f1dfbf",
    color: "#8a5a1f",
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
        acc.soy += Number(item.freeSoySauce || 0) * paidQty;
        acc.ginger += Number(item.freeGinger || 0) * paidQty;
        acc.wasabi += Number(item.freeWasabi || 0) * paidQty;
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
    if (e?.preventDefault) e.preventDefault();

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
        const result = await handleCheckDelivery();

        if (result) {
          checkedDeliveryInfo = result;
        } else {
          // fallback если адрес не найден
          checkedDeliveryInfo = {
            type: "operator",
            addressFound: false,
            resolvedAddress: "",
            shortAddress: form.address.trim(),
            minOrder: null,
            remaining: 0,
            freeDelivery: false,
          };
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
      const fallbackInfo = {
        type: "operator",
        addressFound: false,
        resolvedAddress: "",
        shortAddress: rawAddress,
        minOrder: null,
        remaining: 0,
        freeDelivery: false,
      };

      setDeliveryInfo(fallbackInfo);
      setDeliveryError("");

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
      throw new Error("Адресу не знайдено. Оператор уточнить після оформлення");
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
        width: "100%",
        display: "flex",
        justifyContent: "center",
        padding: isMobile ? "12px" : "20px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "720px",
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

          <div style={sectionCardStyle}>
            <div
              style={{
                fontSize: isMobile ? "26px" : "32px",
                fontWeight: 900,
                lineHeight: 1.05,
                color: "#222",
                marginBottom: "12px",
              }}
            >
              Оформлення замовлення
            </div>

            <div style={tabsWrapStyle}>
              <button
                type="button"
                style={
                  checkoutMode === "delivery"
                    ? activeTabStyle
                    : inactiveTabStyle
                }
                onClick={() => setCheckoutMode("delivery")}
              >
                Доставка
              </button>

              <button
                type="button"
                style={
                  checkoutMode === "pickup" ? activeTabStyle : inactiveTabStyle
                }
                onClick={() => setCheckoutMode("pickup")}
              >
                Самовивіз
              </button>
            </div>

            <div style={sectionHintStyle}>
              {checkoutMode === "delivery"
                ? "Заповніть дані для доставки"
                : "Заповніть дані для самовивозу"}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "12px",
              }}
            >
              <div>
                <div style={fieldLabelStyle}>Ім'я</div>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Ваше ім'я"
                  style={fieldStyle}
                />
              </div>

              <div>
                <div style={fieldLabelStyle}>Телефон</div>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  placeholder="+380"
                  style={fieldStyle}
                />
              </div>

              {checkoutMode === "delivery" ? (
                <>
                  <div style={compactGrid2Style}>
                    <div>
                      <div style={fieldLabelStyle}>Адреса доставки</div>
                      <input
                        type="text"
                        value={form.address}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            address: e.target.value,
                          }))
                        }
                        placeholder="Вулиця та номер будинку"
                        style={fieldStyle}
                      />
                    </div>

                    <div>
                      <div style={fieldLabelStyle}>Під'їзд</div>
                      <select
                        value={form.entrance || ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            entrance: e.target.value,
                          }))
                        }
                        style={miniSelectStyle}
                      >
                        <option value="">Не обов'язково</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                        <option value="7">7</option>
                        <option value="8">8</option>
                      </select>
                    </div>
                  </div>

                  {deliveryInfo && (
                    <div
                      style={
                        deliveryInfo.addressFound === false
                          ? warningStatusStyle
                          : successStatusStyle
                      }
                    >
                      {deliveryInfo.addressFound === false ? (
                        <>
                          <div style={{ fontWeight: 800, marginBottom: "4px" }}>
                            Не можу знайти адресу
                          </div>
                          <div>Уточніть адресу у оператора.</div>
                          {deliveryInfo.minOrder && (
                            <div style={{ marginTop: "4px" }}>
                              Поріг безкоштовної доставки:{" "}
                              {deliveryInfo.minOrder} грн
                            </div>
                          )}
                        </>
                      ) : deliveryInfo.freeDelivery ? (
                        <>
                          <div style={{ fontWeight: 800, marginBottom: "4px" }}>
                            У вас безкоштовна доставка
                          </div>
                          {deliveryInfo.minOrder ? (
                            <div>
                              Поріг безкоштовної доставки:{" "}
                              {deliveryInfo.minOrder} грн
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <div style={{ fontWeight: 800, marginBottom: "4px" }}>
                            До безкоштовної доставки залишилось{" "}
                            {deliveryInfo.remaining} грн
                          </div>
                          {deliveryInfo.minOrder ? (
                            <div>
                              Поріг безкоштовної доставки:{" "}
                              {deliveryInfo.minOrder} грн
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>
                  )}

                  {deliveryError && (
                    <div style={warningStatusStyle}>{deliveryError}</div>
                  )}
                </>
              ) : (
                <div style={successStatusStyle}>
                  Самовивіз: Миколаїв, вул. Мала Морська 108 ТЦ Портал
                </div>
              )}
            </div>
          </div>

          <div style={sectionCardStyle}>
            <div style={sectionTitleStyle}>Оплата</div>

            <div style={tabsWrapStyle}>
              <button
                type="button"
                style={
                  form.paymentMethod === "cash"
                    ? activeTabStyle
                    : inactiveTabStyle
                }
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    paymentMethod: "cash",
                  }))
                }
              >
                Готівка
              </button>

              <button
                type="button"
                style={
                  form.paymentMethod === "card"
                    ? activeTabStyle
                    : inactiveTabStyle
                }
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    paymentMethod: "card",
                  }))
                }
              >
                Картка
              </button>
            </div>
          </div>

          <div style={sectionCardStyle}>
            <label style={checkboxRowStyle}>
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
                type="text"
                value={form.exactTime}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    exactTime: e.target.value,
                  }))
                }
                placeholder="Наприклад: 18:30"
                style={exactTimeInputStyle}
              />
            )}
          </div>
          {hasSushiItems && (
            <div style={sectionCardStyle}>
              <div style={sectionTitleStyle}>Додатки до ролів</div>
              <div style={sectionHintStyle}>
                Частина додається безкоштовно залежно від кількості ролів та
                сетів.
              </div>

              <div style={compactGrid3Style}>
                <div style={compactOptionCardStyle}>
                  <div style={compactOptionTitleStyle}>Соєвий соус</div>

                  <div style={compactQtyWrapStyle}>
                    <button
                      type="button"
                      style={compactQtyBtnStyle}
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          soySauceCount: Math.max(0, prev.soySauceCount - 1),
                        }))
                      }
                    >
                      -
                    </button>

                    <span style={compactQtyValueStyle}>
                      {form.soySauceCount}
                    </span>

                    <button
                      type="button"
                      style={compactQtyBtnStyle}
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          soySauceCount: prev.soySauceCount + 1,
                        }))
                      }
                    >
                      +
                    </button>
                  </div>

                  <div style={compactFreeStyle}>
                    Безкоштовно: {freeCondiments.soy}
                  </div>

                  {extraSoyCount > 0 && (
                    <div style={compactExtraStyle}>
                      + {extraSoyCount} × 15 грн
                    </div>
                  )}
                </div>

                <div style={compactOptionCardStyle}>
                  <div style={compactOptionTitleStyle}>Імбир</div>

                  <div style={compactQtyWrapStyle}>
                    <button
                      type="button"
                      style={compactQtyBtnStyle}
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          gingerCount: Math.max(0, prev.gingerCount - 1),
                        }))
                      }
                    >
                      -
                    </button>

                    <span style={compactQtyValueStyle}>{form.gingerCount}</span>

                    <button
                      type="button"
                      style={compactQtyBtnStyle}
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          gingerCount: prev.gingerCount + 1,
                        }))
                      }
                    >
                      +
                    </button>
                  </div>

                  <div style={compactFreeStyle}>
                    Безкоштовно: {freeCondiments.ginger}
                  </div>

                  {extraGingerCount > 0 && (
                    <div style={compactExtraStyle}>
                      + {extraGingerCount} × 15 грн
                    </div>
                  )}
                </div>

                <div style={compactOptionCardStyle}>
                  <div style={compactOptionTitleStyle}>Васабі</div>

                  <div style={compactQtyWrapStyle}>
                    <button
                      type="button"
                      style={compactQtyBtnStyle}
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          wasabiCount: Math.max(0, prev.wasabiCount - 1),
                        }))
                      }
                    >
                      -
                    </button>

                    <span style={compactQtyValueStyle}>{form.wasabiCount}</span>

                    <button
                      type="button"
                      style={compactQtyBtnStyle}
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          wasabiCount: prev.wasabiCount + 1,
                        }))
                      }
                    >
                      +
                    </button>
                  </div>

                  <div style={compactFreeStyle}>
                    Безкоштовно: {freeCondiments.wasabi}
                  </div>

                  {extraWasabiCount > 0 && (
                    <div style={compactExtraStyle}>
                      + {extraWasabiCount} × 10 грн
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div style={sectionCardStyle}>
            <div style={sectionTitleStyle}>Палички</div>

            <div style={compactGrid2EqualStyle}>
              <div style={compactOptionCardStyle}>
                <div style={compactOptionTitleStyle}>Звичайні</div>

                <div style={compactQtyWrapStyle}>
                  <button
                    type="button"
                    style={compactQtyBtnStyle}
                    onClick={() =>
                      setRegularSticksCount((prev) => Math.max(0, prev - 1))
                    }
                  >
                    -
                  </button>

                  <span style={compactQtyValueStyle}>{regularSticksCount}</span>

                  <button
                    type="button"
                    style={compactQtyBtnStyle}
                    onClick={() => setRegularSticksCount((prev) => prev + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div style={compactOptionCardStyle}>
                <div style={compactOptionTitleStyle}>Навчальні (+2 грн)</div>

                <div style={compactQtyWrapStyle}>
                  <button
                    type="button"
                    style={compactQtyBtnStyle}
                    onClick={() =>
                      setTrainingSticksCount((prev) => Math.max(0, prev - 1))
                    }
                  >
                    -
                  </button>

                  <span style={compactQtyValueStyle}>
                    {trainingSticksCount}
                  </span>

                  <button
                    type="button"
                    style={compactQtyBtnStyle}
                    onClick={() => setTrainingSticksCount((prev) => prev + 1)}
                  >
                    +
                  </button>
                </div>

                {sticksExtraPrice > 0 && (
                  <div style={compactExtraStyle}>
                    Додатково: {sticksExtraPrice} грн
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={sectionCardStyle}>
            <div style={sectionTitleStyle}>Коментар до замовлення</div>

            <textarea
              value={form.comment}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  comment: e.target.value,
                }))
              }
              placeholder="Наприклад: без дзвінка, залишити біля дверей"
              style={{
                width: "100%",
                minHeight: "96px",
                border: "1px solid #e5e5e5",
                borderRadius: "14px",
                padding: "14px",
                fontSize: "15px",
                resize: "vertical",
                boxSizing: "border-box",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>
          <div
            style={{
              background: "#fffaf7",
              border: "1px solid #f0ddd1",
              borderRadius: "16px",
              padding: isMobile ? "14px" : "16px",
              marginTop: "12px",
            }}
          >
            <div style={summaryRowStyle}>
              <span>Сума товарів</span>
              <span>{checkoutTotalPrice} грн</span>
            </div>

            {condimentsExtraPrice > 0 && (
              <div style={summaryRowStyle}>
                <span>Додаткові соуси / імбир / васабі</span>
                <span>{condimentsExtraPrice} грн</span>
              </div>
            )}

            {sticksExtraPrice > 0 && (
              <div style={summaryRowStyle}>
                <span>Навчальні палички</span>
                <span>{sticksExtraPrice} грн</span>
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                paddingTop: "12px",
                borderTop: "1px solid #ecd5c5",
                fontWeight: 800,
                fontSize: isMobile ? "18px" : "28px",
                color: "#222",
              }}
            >
              <span>До сплати</span>
              <span>{finalCheckoutTotal} грн</span>
            </div>
          </div>
          {error && (
            <div
              style={{
                marginTop: "12px",
                color: "#c65642",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}
          <button
            type="button"
            style={submitButtonStyle}
            onClick={() => {
              handleSubmit();
            }}
            disabled={loading}
          >
            {loading ? "Відправка..." : "Підтвердити замовлення"}
          </button>
        </div>
      </div>
    </div>
  );
}
