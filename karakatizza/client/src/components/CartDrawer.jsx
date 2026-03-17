import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCart } from "../hooks/useCart";
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
  } = useCart();

  const [upsellProducts, setUpsellProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryError, setDeliveryError] = useState("");
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [discountOfferProduct, setDiscountOfferProduct] = useState(null);
  const [discountOfferDismissed, setDiscountOfferDismissed] = useState(false);
  const [discountOfferAccepted, setDiscountOfferAccepted] = useState(false);

  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  useEffect(() => {
    loadUpsell();
  }, []);

  const rollItemsForDiscountOffer = cartItems.filter((item) => {
    const category = item.category?.toLowerCase?.() || "";
    const isRoll = category === "rolls" || category === "роллы";
    const isDiscountOfferItem = item.isDiscountOffer === true;
    const isGiftItem = (item.freeQuantity ?? 0) > 0;

    const isEligible = item.discountOfferEligible === true;

    return isRoll && isEligible && !isDiscountOfferItem && !isGiftItem;
    w;
  });

  const rollsSum = rollItemsForDiscountOffer.reduce((sum, item) => {
    const paidQty = item.paidQuantity ?? item.quantity ?? 0;
    return sum + item.price * paidQty;
  }, 0);

  const hasDiscountOfferItemInCart = cartItems.some((item) => {
    const freeQty = Number(item.freeQuantity ?? 0);
    const isDiscountOffer = item.isDiscountOffer === true;
    return freeQty > 0 || isDiscountOffer;
  });

  useEffect(() => {
    if (!hasDiscountOfferItemInCart) {
      setDiscountOfferAccepted(false);
    }
  }, [hasDiscountOfferItemInCart]);

  const shouldTriggerDiscountOffer =
    rollsSum >= 600 &&
    !discountOfferDismissed &&
    !discountOfferAccepted &&
    !hasDiscountOfferItemInCart;

  useEffect(() => {
    if (!isCartOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isCartOpen]);

  useEffect(() => {
    if (shouldTriggerDiscountOffer) {
      if (!discountOfferProduct) {
        const randomRoll = getRandomRollOffer();
        setDiscountOfferProduct(randomRoll);
      }
    } else {
      setDiscountOfferProduct(null);
    }
  }, [shouldTriggerDiscountOffer, upsellProducts, cartItems]);

  useEffect(() => {
    if (cartItems.length === 0) {
      setDiscountOfferProduct(null);
      setDiscountOfferDismissed(false);
      setDiscountOfferAccepted(false);
    }
  }, [cartItems.length]);

  function getRandomRollOffer() {
    const rollsInCartIds = cartItems.map((item) => item.id);

    const availableRolls = allProducts.filter(
      (product) =>
        product.category === "rolls" && !rollsInCartIds.includes(product.id)
    );

    if (!availableRolls.length) return null;

    const randomIndex = Math.floor(Math.random() * availableRolls.length);
    return availableRolls[randomIndex];
  }

  async function geocodeAddress(addressText) {
    const normalized = normalizeAddress(addressText);

    const queries = [Миколаїв`${normalized}`, Николаев`${normalized}`];

    for (const q of queries) {
      const query = encodeURIComponent(q);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ua&addressdetails=1&q=${query}`
      );

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];

        const road =
          item.address?.road ||
          item.address?.pedestrian ||
          item.address?.residential ||
          item.address?.street ||
          "";

        const houseNumber = item.address?.house_number || "";

        const shortLabel = [road, houseNumber].filter(Boolean).join(" ");

        return {
          lat: Number(item.lat),
          lng: Number(item.lon),
          label: item.display_name,
          shortLabel: shortLabel || item.display_name,
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
        resolvedAddress: location.shortLabel || location.label,
        addressFound: true,
      });

      setConfirmedAddress(location.shortLabel || location.label);
    } catch (error) {
      setDeliveryInfo({
        type: "operator",
        minOrder: null,
        remaining: 0,
        freeDelivery: false,
        addressFound: false,
      });

      setConfirmedAddress("");
    } finally {
      setDeliveryLoading(false);
    }
  }

  async function geocodeAddress(addressText) {
    const query = encodeURIComponent(`Миколаїв, ${addressText}`);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ua&addressdetails=1&q=${query}`
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

      setAllProducts(products);

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

  const rollSubtotalForDiscountOffer = rollItemsForDiscountOffer.reduce(
    (sum, item) => {
      const paidQty = item.paidQuantity ?? item.quantity ?? 0;
      return sum + item.price * paidQty;
    },
    0
  );

  const shouldShowDiscountOffer =
    rollSubtotalForDiscountOffer >= 600 && !hasDiscountOfferItemInCart;

  const shouldShowRegularUpsell =
    !shouldShowDiscountOffer && !discountOfferProduct;

  function handleAddDiscountOffer() {
    if (!discountOfferProduct) return;

    const discountedPrice = Math.round(discountOfferProduct.price * 0.75);

    addToCart({
      ...discountOfferProduct,
      originalPrice: discountOfferProduct.price,
      price: discountedPrice,
      isDiscountOffer: true,
      discountLabel: "-25%",
    });

    setDiscountOfferAccepted(true);
    setDiscountOfferProduct(null);
  }

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
                        {item.freeQuantity > 0 ? (
                          <div
                            style={{
                              marginTop: "4px",
                              fontSize: "13px",
                              color: "#4caf50",
                              fontWeight: "600",
                            }}
                          >
                            Акція 2+1: {item.freeQuantity} шт у подарунок
                          </div>
                        ) : item.isDiscountOffer ? (
                          <div
                            style={{
                              marginTop: "4px",
                              fontSize: "13px",
                              color: "#4caf50",
                              fontWeight: "600",
                            }}
                          >
                            Знижка {item.discountLabel || "-25%"}
                          </div>
                        ) : null}
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
                            {item.price * (item.paidQuantity ?? item.quantity)}{" "}
                            грн
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

              {discountOfferProduct ? (
                <div
                  style={{
                    marginTop: "20px",
                    padding: "16px",
                    borderRadius: "16px",
                    background: "#fff7ef",
                    border: "1px solid #f1d2a8",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#222",
                    }}
                  >
                    Додайте ще один рол зі знижкою 25%
                  </div>

                  <div
                    style={{
                      fontSize: "13px",
                      color: "#666",
                      lineHeight: 1.4,
                    }}
                  >
                    У вас вже ролів на {rollsSum} грн. Даруємо вам знижку на
                    наступний рол.
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px",
                      background: "#fff",
                      borderRadius: "14px",
                    }}
                  >
                    <img
                      src={getImageUrl(discountOfferProduct.image)}
                      alt={discountOfferProduct.name}
                      style={{
                        width: "64px",
                        height: "64px",
                        objectFit: "cover",
                        borderRadius: "12px",
                        flexShrink: 0,
                      }}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "15px",
                          fontWeight: "700",
                          color: "#222",
                          marginBottom: "4px",
                        }}
                      >
                        {discountOfferProduct.name}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "13px",
                            color: "#999",
                            textDecoration: "line-through",
                          }}
                        >
                          {discountOfferProduct.price} грн
                        </span>

                        <span
                          style={{
                            fontSize: "16px",
                            fontWeight: "700",
                            color: "#e56a45",
                          }}
                        >
                          {Math.round(discountOfferProduct.price * 0.75)} грн
                        </span>

                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: "700",
                            color: "#fff",
                            background: "#e56a45",
                            borderRadius: "999px",
                            padding: "4px 8px",
                          }}
                        >
                          -25%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountOfferDismissed(true);
                        setDiscountOfferProduct(null);
                      }}
                      style={{
                        flex: 1,
                        border: "1px solid #ddd",
                        background: "#fff",
                        borderRadius: "12px",
                        padding: "12px",
                        fontSize: "14px",
                        cursor: "pointer",
                      }}
                    >
                      Ні, дякую
                    </button>

                    <button
                      type="button"
                      onClick={handleAddDiscountOffer}
                      style={{
                        flex: 1,
                        border: "none",
                        background: "#e56a45",
                        color: "#fff",
                        borderRadius: "12px",
                        padding: "12px",
                        fontSize: "14px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      Додати
                    </button>
                  </div>
                </div>
              ) : (
                shouldShowRegularUpsell &&
                visibleUpsellProducts.length > 0 && (
                  <div>
                    <h3
                      style={{
                        margin: "0 0 6px 0",
                        fontSize: "18px",
                        color: "#222",
                      }}
                    >
                      Додайте до замовлення
                    </h3>

                    <p
                      style={{
                        margin: "0 0 14px 0",
                        fontSize: "14px",
                        color: "#666",
                      }}
                    >
                      Те, що часто беруть разом із ролами та сетами
                    </p>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      {visibleUpsellProducts.map((product) => (
                        <div
                          key={product.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "12px",
                            background: "#fff",
                            borderRadius: "14px",
                            border: "1px solid #eee",
                          }}
                        >
                          <img
                            src={getImageUrl(product.image)}
                            alt={product.name}
                            style={{
                              width: "64px",
                              height: "64px",
                              objectFit: "cover",
                              borderRadius: "12px",
                              flexShrink: 0,
                            }}
                          />

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: "15px",
                                fontWeight: "700",
                                color: "#222",
                              }}
                            >
                              {product.name}
                            </div>

                            <div
                              style={{
                                fontSize: "13px",
                                color: "#666",
                                marginTop: "4px",
                              }}
                            >
                              {product.description}
                            </div>

                            <div
                              style={{
                                fontSize: "18px",
                                fontWeight: "700",
                                color: "#222",
                                marginTop: "8px",
                              }}
                            >
                              {product.price} грн
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => addToCart(product)}
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "12px",
                              border: "none",
                              background: "#e56a45",
                              color: "#fff",
                              fontSize: "22px",
                              cursor: "pointer",
                              flexShrink: 0,
                            }}
                          >
                            +
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
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
