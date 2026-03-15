import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCart } from "../hooks/useCart";
import { FREE_DELIVERY_THRESHOLD } from "../data/products";
import { getProducts, getImageUrl } from "../api/productsApi";
import {
  getRouteDistanceKm,
  getDeliveryInfo,
} from "../services/deliveryService";

export default function CartDrawer() {
  const {
    cartItems,
    isCartOpen,
    closeCart,
    totalPrice,
    clearCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    addToCart,
    checkoutMode,
    setCheckoutMode,
    confirmedAddress,
    setConfirmedAddress,
    deliveryDistanceKm,
    setDeliveryDistanceKm,
    deliverySummary,
    setDeliverySummary,
  } = useCart();

  const [upsellProducts, setUpsellProducts] = useState([]);

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryError, setDeliveryError] = useState("");
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState(null);

  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  useEffect(() => {
    loadUpsell();
  }, []);

  useEffect(() => {
    if (!isCartOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isCartOpen]);

  async function geocodeAddress(addressText) {
    const normalized = normalizeAddress(addressText);

    const queries = [Миколаїв`${normalized}`, Николаев`${normalized}`];

    for (const q of queries) {
      const query = encodeURIComponent(q);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ua&q=${query}`
      );

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        return {
          lat: Number(data[0].lat),
          lng: Number(data[0].lon),
          label: data[0].display_name,
        };
      }
    }

    throw new Error("ADDRESS_NOT_FOUND");
  }

  async function handleApplyAddress() {
    if (!deliveryAddress.trim()) return;

    try {
      setDeliveryLoading(true);

      const location = await geocodeAddress(deliveryAddress);

      const distanceKm = await getRouteDistanceKm(location.lat, location.lng);

      setDeliveryInfo({
        distanceKm,
        resolvedAddress: location.label,
        addressFound: true,
      });

      setConfirmedAddress(location.label);
      setDeliveryDistanceKm(distanceKm);
      setDeliverySummary({
        distanceKm,
        resolvedAddress: location.label,
        addressFound: true,
      });
    } catch (error) {
      setDeliveryInfo({
        type: "operator",
        minOrder: null,
        remaining: 0,
        freeDelivery: false,
        addressFound: false,
      });

      setConfirmedAddress("");
      setDeliveryDistanceKm(null);
      setDeliverySummary({
        addressFound: false,
      });
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
      throw new Error("ADDRESS_NOT_FOUND");
    }

    return {
      lat: Number(data[0].lat),
      lng: Number(data[0].lon),
      label: data[0].display_name,
    };
  }

  async function loadUpsell() {
    try {
      const products = await getProducts();

      const filtered = products.filter(
        (p) =>
          p.category === "drinks" ||
          p.category === "snacks" ||
          p.category === "extras"
      );

      setUpsellProducts(filtered);
    } catch (error) {
      console.error("Upsell load error:", error);
    }
  }

  const defaultMinOrder = 400;

  const calculatedDeliveryInfo =
    deliveryInfo?.distanceKm != null
      ? getDeliveryInfo(deliveryInfo.distanceKm, totalPrice)
      : null;

  const currentMinOrder = calculatedDeliveryInfo?.minOrder ?? defaultMinOrder;
  const progressPercent = Math.min((totalPrice / currentMinOrder) * 100, 100);
  const isFreeReached = progressPercent >= 100;

  let deliveryTitle = `До безкоштовної доставки залишилось ${Math.max(
    0,
    currentMinOrder - totalPrice
  )} грн`;

  let deliveryHint = "Введіть адресу для уточнення безкоштовної доставки";

  if (isFreeReached) {
    deliveryTitle = "У вас безкоштовна доставка";
    deliveryHint = deliveryInfo
      ? ""
      : "Введіть адресу для уточнення безкоштовної доставки";
  }

  if (deliveryInfo && deliveryInfo.addressFound === false) {
    deliveryTitle = "Не можу знайти адресу";
    deliveryHint = "Уточніть адресу у оператора";
  }

  if (
    calculatedDeliveryInfo?.type === "operator" &&
    deliveryInfo?.addressFound !== false
  ) {
    deliveryTitle = "Доставка платна, уточнюйте у оператора";
    deliveryHint = "";
  }

  function normalizeAddress(input) {
    let value = input.toLowerCase().trim();

    const replacements = {
      ё: "е",
      й: "и",
      ъ: "",
      ы: "и",
      э: "е",
    };

    Object.entries(replacements).forEach(([from, to]) => {
      value = value.replaceAll(from, to);
    });

    return value;
  }

  const cartItemIds = cartItems.map((item) => item.id);

  const visibleUpsellProducts = upsellProducts
    .filter((product) => !cartItemIds.includes(product.id))
    .slice(0, 3);

  if (!isCartOpen) return null;

  return (
    <>
      <div
        onClick={closeCart}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.45)",
          zIndex: 99,
          display: "flex",
          justifyContent: "flex-end",
        }}
      />

      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: isMobile ? "100vw" : "420px",
          maxWidth: "100%",
          height: "100vh",
          backgroundColor: "#ffffff",
          zIndex: 100,
          boxShadow: "-8px 0 30px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid #eeeeee",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
            background: "#fff",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "24px",
                color: "#222",
              }}
            >
              Кошик
            </h2>
            <p
              style={{
                margin: "6px 0 0 0",
                color: "#666",
                fontSize: "14px",
              }}
            >
              Перевірте замовлення перед оформленням
            </p>
          </div>

          <button
            onClick={closeCart}
            style={{
              border: "none",
              backgroundColor: "#f2f2f2",
              borderRadius: "10px",
              padding: "10px 14px",
              cursor: "pointer",
            }}
          >
            Закрити
          </button>
        </div>

        <div
          style={{
            padding: "16px 20px 0",
            flexShrink: 0,
            background: "#fff",
          }}
        >
          <div
            style={{
              backgroundColor: isFreeReached ? "#e8f7ed" : "#f7f3eb",
              border: `1px solid ${isFreeReached ? "#b7e4c7" : "#eed7b0"}`,
              borderRadius: "14px",
              padding: "14px",
              display: "grid",
              gap: "10px",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: "700",
                color: "#222",
                lineHeight: 1.35,
              }}
            >
              {deliveryTitle}
            </div>

            <div
              style={{
                width: "100%",
                height: "10px",
                backgroundColor: "#f0f0f0",
                borderRadius: "999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: "100%",
                  backgroundColor: isFreeReached ? "#2e7d32" : "#f57c00",
                  borderRadius: "999px",
                  transition: "0.3s",
                }}
              />
            </div>

            <div
              style={{
                fontSize: "13px",
                color: "#666",
              }}
            >
              Поріг безкоштовної доставки: {currentMinOrder} грн
            </div>

            {deliveryHint ? (
              <div
                style={{
                  fontSize: "13px",
                  color: isFreeReached ? "#9a6700" : "#666",
                  fontWeight: isFreeReached ? "700" : "400",
                  lineHeight: 1.35,
                }}
              >
                {deliveryHint}
              </div>
            ) : null}

            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => {
                  const value = e.target.value;
                  const formatted = value
                    ? value.charAt(0).toUpperCase() + value.slice(1)
                    : "";

                  setDeliveryAddress(formatted);
                  setDeliveryInfo(null);
                }}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    deliveryAddress.trim() &&
                    !deliveryLoading
                  ) {
                    e.preventDefault();
                    handleApplyAddress();
                  }
                }}
                enterKeyHint="send"
                placeholder="Вулиця та номер будинку (наприклад: Озерна 11)"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "13px 14px",
                  borderRadius: "12px",
                  border: "1px solid #ddd",
                  fontSize: "15px",
                  outline: "none",
                  background: "#fff",
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleApplyAddress}
              disabled={!deliveryAddress.trim() || deliveryLoading}
              style={{
                border: "none",
                borderRadius: "12px",
                padding: "13px 14px",
                background:
                  !deliveryAddress.trim() || deliveryLoading
                    ? "#cccccc"
                    : "#e56a45",
                color: "#fff",
                fontSize: "15px",
                fontWeight: "700",
                cursor:
                  !deliveryAddress.trim() || deliveryLoading
                    ? "default"
                    : "pointer",
              }}
            >
              {deliveryLoading ? "Завантаження..." : "Ввести"}
            </button>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {cartItems.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                color: "#777",
                marginTop: "40px",
                fontSize: "16px",
              }}
            >
              Кошик поки порожній
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gap: "14px" }}>
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      border: "1px solid #ececec",
                      borderRadius: "16px",
                      padding: "14px",
                      backgroundColor: "#fafafa",
                    }}
                  >
                    <div style={{ display: "flex", gap: "12px" }}>
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        style={{
                          width: "74px",
                          height: "74px",
                          objectFit: "cover",
                          borderRadius: "12px",
                          flexShrink: 0,
                        }}
                      />

                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: "700",
                            color: "#222",
                          }}
                        >
                          {item.name}
                        </div>

                        <div
                          style={{
                            marginTop: "6px",
                            color: "#666",
                            fontSize: "14px",
                          }}
                        >
                          {item.price} грн за шт
                        </div>
                        {item.freeQuantity > 0 && (
                          <div
                            style={{
                              marginTop: "6px",
                              color: "#2e7d32",
                              fontSize: "13px",
                              fontWeight: "700",
                            }}
                          >
                            Акція 2+1: {item.freeQuantity} шт у подарунок
                          </div>
                        )}
                        <div
                          style={{
                            marginTop: "12px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "10px",
                            flexWrap: "wrap",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <button
                              onClick={() => decreaseQuantity(item.id)}
                              style={{
                                width: "32px",
                                height: "32px",
                                border: "none",
                                borderRadius: "8px",
                                backgroundColor: "#e9e9e9",
                                cursor: "pointer",
                                fontSize: "18px",
                              }}
                            >
                              -
                            </button>

                            <span
                              style={{
                                minWidth: "20px",
                                textAlign: "center",
                                fontWeight: "700",
                              }}
                            >
                              {item.quantity}
                            </span>

                            <button
                              onClick={() => increaseQuantity(item.id)}
                              style={{
                                width: "32px",
                                height: "32px",
                                border: "none",
                                borderRadius: "8px",
                                backgroundColor: "#e9e9e9",
                                cursor: "pointer",
                                fontSize: "18px",
                              }}
                            >
                              +
                            </button>
                          </div>

                          <div
                            style={{
                              fontWeight: "800",
                              color: "#111",
                            }}
                          >
                            {item.price * item.quantity} грн
                          </div>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          style={{
                            marginTop: "12px",
                            border: "none",
                            background: "none",
                            color: "#d32f2f",
                            cursor: "pointer",
                            padding: 0,
                            fontWeight: "600",
                          }}
                        >
                          Видалити
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {visibleUpsellProducts.length > 0 && (
                <div
                  style={{
                    borderTop: "1px solid #eeeeee",
                    paddingTop: "16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "800",
                      color: "#222",
                      marginBottom: "6px",
                    }}
                  >
                    Додайте до замовлення
                  </div>

                  <div
                    style={{
                      color: "#666",
                      fontSize: "14px",
                      marginBottom: "14px",
                    }}
                  >
                    Те, що часто беруть разом із ролами та сетами
                  </div>

                  <div style={{ display: "grid", gap: "12px" }}>
                    {visibleUpsellProducts.map((product) => (
                      <div
                        key={product.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "72px 1fr auto",
                          gap: "12px",
                          alignItems: "center",
                          border: "1px solid #ececec",
                          borderRadius: "14px",
                          padding: "10px",
                          background: "#fafafa",
                        }}
                      >
                        <img
                          src={getImageUrl(product.image)}
                          alt={product.name}
                          style={{
                            width: "72px",
                            height: "72px",
                            objectFit: "cover",
                            borderRadius: "12px",
                          }}
                        />

                        <div>
                          <div
                            style={{
                              fontWeight: "700",
                              fontSize: "16px",
                              color: "#222",
                            }}
                          >
                            {product.name}
                          </div>

                          <div
                            style={{
                              color: "#666",
                              fontSize: "13px",
                              marginTop: "4px",
                            }}
                          >
                            {product.description || "Без опису"}
                          </div>

                          <div
                            style={{
                              marginTop: "8px",
                              fontWeight: "800",
                              fontSize: "18px",
                              color: "#111",
                            }}
                          >
                            {product.price} грн
                          </div>
                        </div>

                        <button
                          onClick={() => addToCart(product, 1)}
                          style={{
                            border: "none",
                            backgroundColor: "#e53935",
                            color: "#fff",
                            borderRadius: "10px",
                            padding: "10px 12px",
                            fontWeight: "700",
                            cursor: "pointer",
                          }}
                        >
                          +
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div
          style={{
            borderTop: "1px solid #eeeeee",
            padding: "18px 20px calc(28px + env(safe-area-inset-bottom))",
            flexShrink: 0,
            background: "#fff",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
              fontSize: "22px",
              fontWeight: "800",
              color: "#111",
            }}
          >
            <span>Разом</span>
            <span>{totalPrice} грн</span>
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            <Link
              to="/checkout"
              onClick={closeCart}
              style={{
                textAlign: "center",
                textDecoration: "none",
                backgroundColor: cartItems.length ? "#e53935" : "#cccccc",
                color: "#fff",
                borderRadius: "12px",
                padding: "14px",
                fontSize: "16px",
                fontWeight: "700",
                pointerEvents: cartItems.length ? "auto" : "none",
              }}
            >
              Оформити замовлення
            </Link>

            <button
              onClick={clearCart}
              style={{
                backgroundColor: "#f3f3f3",
                color: "#222",
                border: "none",
                borderRadius: "12px",
                padding: "14px",
                fontSize: "15px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              Очистити кошик
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
