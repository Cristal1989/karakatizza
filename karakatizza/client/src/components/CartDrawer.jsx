import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useCart } from "../hooks/useCart";
import { getProducts, getImageUrl } from "../api/productsApi";
import {
  getRouteDistanceKm,
  getDeliveryInfo,
} from "../services/deliveryService";
import { getPromotionSettings } from "../api/promotionsApi";
import { getGiftRollSettings } from "../api/giftRollApi";

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
    calculatePromo,
    pickupDiscount,
    finalTotal,
    hasAnyPromoInCart,
  } = useCart();

  const isGiftProcessingRef = useRef(false);
  const isCleanupProcessingRef = useRef(false);

  const [upsellProducts, setUpsellProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryError, setDeliveryError] = useState("");
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [discountOfferProduct, setDiscountOfferProduct] = useState(null);
  const [discountOfferDismissed, setDiscountOfferDismissed] = useState(false);
  const [discountOfferAccepted, setDiscountOfferAccepted] = useState(false);
  const [promoSettings, setPromoSettings] = useState(null);
  const [promoProducts, setPromoProducts] = useState([]);

  const [promotionSettings, setPromotionSettings] = useState({
    discountPercent: 25,
    triggerSum: 600,
    isActive: true,
  });

  const [giftRollSettings, setGiftRollSettings] = useState({
    triggerSum: 1000,
    giftProductId: "",
    isActive: true,
    weekdaysOnly: true,
  });


  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const API_URL = "https://karakatizza-production.up.railway.app";

  useEffect(() => {
    loadUpsell();
    loadPromoProducts();
    loadPromotionSettings();
    loadGiftRollSettings();
  }, []);

  
  useEffect(() => {
    fetch("/promotions/settings")
      .then((res) => res.json())
      .then((data) => setPromoSettings(data))
      .catch(() => console.error("Ошибка загрузки акции"));
  }, []);

  const selectedGiftRollProduct =
  promoProducts.find(
    (p) => String(p.id) === String(giftRollSettings.giftProductId)
  ) || null;

  const rollItemsForDiscountOffer = cartItems.filter((item) => {
    const category = item.category?.toLowerCase?.() || "";
    const isRoll = category === "rolls" || category === "роллы";
    const isDiscountOfferItem = item.isDiscountOffer === true;
    const isGiftItem = Number(item.freeQuantity ?? 0) > 0;
    const hasPromoType = item.promoType && item.promoType !== "none";

    return isRoll && !isDiscountOfferItem && !isGiftItem && !hasPromoType;
  });

  const discountOfferItemInCart = cartItems.find(
    (item) => item.isDiscountOffer === true
  );
  const giftRollInCart = cartItems.find((item) => item.isGiftRoll === true);
  const baseCartTotalForGift = cartItems.reduce((sum, item) => {
    if (item.isGiftRoll || item.isDiscountOffer) return sum;
  
    const paidQty = Number(item.paidQuantity ?? item.quantity ?? 0);
    return sum + Number(item.price ?? 0) * paidQty;
  }, 0);

  const hasDiscountOfferActive =
    !!discountOfferItemInCart ||
    !!discountOfferProduct ||
    !!discountOfferAccepted;

  const isGiftRollWeekdayAllowed = giftRollSettings.weekdaysOnly
    ? isWeekdayNow()
    : true;

  const shouldGiftRollBeActive =
    giftRollSettings.isActive === true &&
    Number(giftRollSettings.triggerSum || 0) > 0 &&
    !!giftRollSettings.giftProductId &&
    !!selectedGiftRollProduct &&
    isGiftRollWeekdayAllowed &&
    baseCartTotalForGift >= Number(giftRollSettings.triggerSum || 0);

  useEffect(() => {
    if (!discountOfferItemInCart) {
      setDiscountOfferAccepted(false);
      setDiscountOfferDismissed(false);
      setDiscountOfferProduct(null);
    }
  }, [discountOfferItemInCart]);

  const rollsSum = rollItemsForDiscountOffer.reduce((sum, item) => {
    const paidQty = item.paidQuantity ?? item.quantity ?? 0;
    return sum + item.price * paidQty;
  }, 0);

  const rollsInCartIds = cartItems.map((item) =>
  String(item.cartKey ?? `${item.id}-${item.isGiftRoll ? "gift" : "normal"}`)
);

  const availableDiscountRolls = allProducts.filter((product) => {
    const category = product.category?.toLowerCase?.() || "";
    const isRoll = category === "rolls" || category === "роллы";
    const isEligible = product.discountOfferEligible === true;
    const isNotInCart = !rollsInCartIds.includes(String(product.id));

    return isRoll && isEligible && isNotInCart;
  });

  const hasAvailableDiscountRoll = availableDiscountRolls.length > 0;

  const pickupDiscountBase = cartItems.reduce((sum, item) => {
    if (item.isGiftRoll || item.isDiscountOffer) return sum;

    const category = item.category?.toLowerCase?.() || "";
    const isDrink =
      category === "drinks" || category === "напої" || category === "напитки";
    const isExtra =
      category === "extras" ||
      category === "додатково" ||
      category === "дополнительно";

    if (isDrink || isExtra) return sum;

    const paidQty = item.paidQuantity ?? item.quantity ?? 0;
    return sum + item.price * paidQty;
  }, 0);

  const shouldTriggerDiscountOffer =
    promotionSettings.isActive &&
    rollsSum >= Number(promotionSettings.triggerSum || 0) &&
    hasAvailableDiscountRoll &&
    !discountOfferDismissed &&
    !discountOfferAccepted &&
    !hasAnyPromoInCart &&
    !giftRollInCart

    const rollSubtotalForDiscountOffer = cartItems.reduce((sum, item) => {
      const category = item.category?.toLowerCase?.() || "";
      const isRoll = category === "rolls" || category === "роллы";
    
      if (!isRoll) return sum;
      if (item.isGiftRoll || item.isDiscountOffer) return sum;
      if (Number(item.freeQuantity ?? 0) > 0) return sum;
      if (item.promoType && item.promoType !== "none") return sum;
    
      const paidQty = Number(item.paidQuantity ?? item.quantity ?? 0);
      return sum + Number(item.price ?? 0) * paidQty;
    }, 0);

  useEffect(() => {
    if (!hasAnyPromoInCart) {
      setDiscountOfferAccepted(false);
      setDiscountOfferDismissed(false);
      setDiscountOfferProduct(null);
    }
  }, [hasAnyPromoInCart]);

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
      const randomRoll = getRandomRollOffer();
      setDiscountOfferProduct(randomRoll);
    } else {
      setDiscountOfferProduct(null);
    }
  }, [shouldTriggerDiscountOffer, allProducts, cartItems]);

  useEffect(() => {
    if (!shouldGiftRollBeActive) return;
    if (discountOfferItemInCart) return;
  
    const giftAlreadyInCart = cartItems.some(item => item.isGiftRoll);
    if (giftAlreadyInCart) return;
  
    addToCart({
      ...selectedGiftRollProduct,
      cartKey: `gift-${selectedGiftRollProduct.id}`,
      isGiftRoll: true,
      price: 0,
    });
  
  }, [
    shouldGiftRollBeActive,
    hasDiscountOfferActive,
    selectedGiftRollProduct,
    cartItems
  ]);

 

  useEffect(() => {
    if (isCleanupProcessingRef.current) return;
  
    const giftThreshold = Number(giftRollSettings.triggerSum || 0);
    const discountThreshold = Number(promotionSettings.triggerSum || 0);
  
    const shouldRemoveGift =
      giftRollInCart &&
      (
        cartItems.length === 0 ||
        baseCartTotalForGift < giftThreshold ||
        !!discountOfferItemInCart
      );
  
    const shouldRemoveDiscount =
      discountOfferItemInCart &&
      (
        cartItems.length === 0 ||
        rollSubtotalForDiscountOffer < discountThreshold
      );
  
    if (!shouldRemoveGift && !shouldRemoveDiscount) return;
  
    isCleanupProcessingRef.current = true;
  
    if (shouldRemoveGift) {
      removeFromCart(giftRollInCart.cartKey ?? giftRollInCart.id);
    }
  
    if (shouldRemoveDiscount) {
      removeFromCart(
        discountOfferItemInCart.cartKey ?? discountOfferItemInCart.id
      );
      setDiscountOfferProduct(null);
      setDiscountOfferDismissed(false);
      setDiscountOfferAccepted(false);
    }
  
    setTimeout(() => {
      isCleanupProcessingRef.current = false;
    }, 0);
  }, [
    cartItems,
    baseCartTotalForGift,
    rollSubtotalForDiscountOffer,
    giftRollInCart,
    discountOfferItemInCart,
    giftRollSettings.triggerSum,
    promotionSettings.triggerSum,
    removeFromCart,
  ]);

  function getRandomRollOffer() {
    if (availableDiscountRolls.length === 0) return null;

    return availableDiscountRolls[
      Math.floor(Math.random() * availableDiscountRolls.length)
    ];
  }

  function isWeekdayNow() {
    const day = new Date().getDay(); // 0 = sunday, 1 = monday ... 6 = saturday
    return day >= 1 && day <= 4; // пн-чт
  }

  async function geocodeAddress(addressText) {
    const normalized = addressText.trim();

    const variants = [
      normalized,
      normalized.replace("е", "ё"),
      normalized.replace("ё", "е"),
      normalized.replace("і", "и"),
      normalized.replace("и", "і"),
    ];

    const cities = ["Миколаїв", "Николаев"];

    for (const city of cities) {
      for (const variant of variants) {
        const query = encodeURIComponent(`${city} ${variant}`);

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ua&q=${query}`
        );

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          const item = data[0];

          return {
            lat: Number(item.lat),
            lng: Number(item.lon),
            label: item.display_name,
            shortLabel: normalized,
          };
        }
      }
    }

    throw new Error("ADDRESS_NOT_FOUND");
  }

  async function handleApplyAddress() {
    if (!deliveryAddress?.trim()) return;

    try {
      setDeliveryLoading(true);

      const location = await geocodeAddress(deliveryAddress.trim());
      const distanceKm = await getRouteDistanceKm(location.lat, location.lng);

      setDeliveryInfo({
        distanceKm,
        resolvedAddress: location.label,
        addressFound: true,
      });

      setConfirmedAddress(deliveryAddress.trim());
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

  async function loadUpsell() {
    try {
      const products = await getProducts();

      setAllProducts(products);

      const filtered = products.filter(
        (p) => p.category === "drinks" || p.category === "snacks"
      );

      setUpsellProducts(filtered);
    } catch (error) {
      console.error("Upsell load error:", error);
    }
  }

  async function loadPromoProducts() {
    try {
      const res = await fetch(`${API_URL}/products?admin=1`);
  
      if (!res.ok) throw new Error("Bad response");
  
      const text = await res.text();
  
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("NOT JSON:", text);
        return;
      }
  
      console.log("PROMO LOAD:", data);
  
      setPromoProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Promo load error:", error);
    }
  }


  async function loadPromotionSettings() {
    try {
      const settings = await getPromotionSettings();

      setPromotionSettings({
        discountPercent: Number(settings?.discountPercent) || 25,
        triggerSum: Number(settings?.triggerSum) || 600,
        isActive: settings?.isActive !== false,
      });
    } catch (error) {
      console.error("Promotion settings load error:", error);
    }
  }

  async function loadGiftRollSettings() {
    try {
      const data = await getGiftRollSettings();

      setGiftRollSettings({
        triggerSum: data?.triggerSum ?? 1000,
        giftProductId: data?.giftProductId ?? "",
        isActive: data?.isActive ?? true,
        weekdaysOnly: data?.weekdaysOnly ?? true,
      });
    } catch (error) {
      console.error("Gift roll settings load error:", error);
    }
  }

  const defaultMinOrder = 1000;

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

  const cartItemIds = cartItems.map(
    (item) => item.cartKey ?? `${item.id}-${item.isGiftRoll ? "gift" : "normal"}`
  );

  const visibleUpsellProducts = upsellProducts
    .filter((product) => !cartItemIds.includes(product.id))
    .slice(0, 3);


  const shouldShowDiscountOffer =
    rollSubtotalForDiscountOffer >= Number(promotionSettings.triggerSum || 0) &&
    !giftRollInCart &&
    !shouldGiftRollBeActive &&
    !hasDiscountOfferActive;

  const shouldShowRegularUpsell =
    !shouldTriggerDiscountOffer && !discountOfferProduct;

    function handleAddDiscountOffer() {
      if (!discountOfferProduct) return;
    
      if (giftRollInCart) {
        removeFromCart(giftRollInCart.cartKey ?? giftRollInCart.id);
      }
    
      const discountedPrice = Math.round(
        discountOfferProduct.price * (1 - promotionSettings.discountPercent / 100)
      );
    
      addToCart({
        ...discountOfferProduct,
        cartKey: `discount-${discountOfferProduct.id}`,
        originalPrice: discountOfferProduct.price,
        price: discountedPrice,
        isDiscountOffer: true,
        discountLabel: `-${promotionSettings.discountPercent}%`,
        freeSoySauce: 0,
        freeGinger: 0,
        freeWasabi: 0,
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
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#3b3b3b",
              }}
            >
              Спосіб отримання
            </div>

            <button
              type="button"
              onClick={() =>
                setCheckoutMode(
                  checkoutMode === "pickup" ? "delivery" : "pickup"
                )
              }
              style={{
                border:
                  "1px solid " +
                  (checkoutMode === "pickup" ? "#22c55e" : "#e5e7eb"),
                background: checkoutMode === "pickup" ? "#f0fdf4" : "#fff",
                color: checkoutMode === "pickup" ? "#166534" : "#444",
                borderRadius: "999px",
                height: "34px",
                padding: "0 12px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {checkoutMode === "pickup" ? "✓ Самовивіз -5%" : "Самовивіз -5%"}
            </button>
          </div>
          {checkoutMode !== "pickup" ? (
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
                      deliveryAddress?.trim() &&
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
                disabled={!deliveryAddress?.trim() || deliveryLoading}
                style={{
                  border: "none",
                  borderRadius: "12px",
                  padding: "13px 14px",
                  background:
                    !deliveryAddress?.trim() || deliveryLoading
                      ? "#cccccc"
                      : "#e56a45",
                  color: "#fff",
                  fontSize: "15px",
                  fontWeight: "700",
                  cursor:
                    !deliveryAddress?.trim() || deliveryLoading
                      ? "default"
                      : "pointer",
                }}
              >
                {deliveryLoading ? "Завантаження..." : "Ввести"}
              </button>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "14px",
                padding: "14px",
                fontSize: "13px",
                color: "#166534",
                fontWeight: "600",
                lineHeight: 1.4,
              }}
            >
              Самовивіз обрано — адресу вводити не потрібно
            </div>
          )}
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
                  key={item.cartKey ?? `${item.id}-${item.isGiftRoll ? "gift" : "normal"}`}
                    style={{
                      border: "1px solid #ececec",
                      borderRadius: "16px",
                      padding: "14px",
                      backgroundColor: "#fafafa",
                      display: "block",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "88px 1fr auto",
                        gap: "12px",
                        alignItems: "center",
                      }}
                    >
                      {/* Картинка */}
                      <div
                        style={{
                          width: "88px",
                          height: "88px",
                          minWidth: "88px",
                          borderRadius: "14px",
                          overflow: "hidden",
                          background: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid #eee",
                        }}
                      >
                        <img
                          src={getImageUrl(item.image)}
                          alt={`${item.name}— доставка суші Каракатица`}
                          loading="lazy"
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "block",
                            objectFit: "contain",
                            padding:
                              item.category === "drinks"
                                ? "8px"
                                : item.category === "rolls" ||
                                  item.category === "sets"
                                ? "2px"
                                : "4px",
                          }}
                        />
                      </div>

                      {/* Центр: название / цена за шт / статус / количество */}
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: "700",
                            color: "#222",
                            lineHeight: 1.2,
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
                          {item.isDiscountOffer && item.originalPrice ? (
                            <div>
                              <span
                                style={{
                                  textDecoration: "line-through",
                                  color: "#999",
                                  marginRight: 6,
                                }}
                              >
                                {item.originalPrice} грн
                              </span>
                              <span style={{ fontWeight: 700 }}>
                                {item.price} грн
                              </span>
                            </div>
                          ) : (
                            <div>{item.price} грн за шт</div>
                          )}
                        </div>

                        {item.isGiftRoll ? (
                          <div
                            style={{
                              marginTop: "4px",
                              fontSize: "13px",
                              color: "#999",
                              fontWeight: "600",
                            }}
                          >
                            🎁 Подарунок
                          </div>
                        ) : item.freeQuantity > 0 ? (
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

                        {!item.isGiftRoll && !item.isDiscountOffer && (
                          <div
                            style={{
                              marginTop: "12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              background: "#fff",
                              borderRadius: "10px",
                              // padding: "4px 8px",
                              width: "fit-content",
                            }}
                          >
                            <button
                              onClick={() => decreaseQuantity(item.id)}
                              style={{
                                width: "28px",
                                height: "28px",
                                border: "none",
                                borderRadius: "8px",
                                background: "#dedede",
                                cursor: "pointer",
                                fontSize: "16px",
                              }}
                            >
                              -
                            </button>

                            <span
                              style={{
                                minWidth: "20px",
                                textAlign: "center",
                                fontWeight: "600",
                              }}
                            >
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => increaseQuantity(item.id)}
                              style={{
                                width: "28px",
                                height: "28px",
                                border: "none",
                                borderRadius: "8px",
                                background: "#dedede",
                                cursor: "pointer",
                                fontSize: "16px",
                              }}
                            >
                              +
                            </button>
                          </div>
                        )}

                        {(item.isGiftRoll || item.isDiscountOffer) && (
                          <div
                            style={{
                              marginTop: "12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              width: "fit-content",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "13px",
                                color: item.isGiftRoll ? "#999" : "#4caf50",
                                fontWeight: "600",
                              }}
                            >
                              {item.isGiftRoll
                                ? "Додається автоматично"
                                : "Акційний товар"}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Справа: итоговая цена */}
                      <div
                        style={{
                          minWidth: "90px",
                          textAlign: "right",
                          fontWeight: "700",
                          fontSize: "16px",
                          color: "#222",
                          alignSelf: "center",
                        }}
                      >
                        {item.isDiscountOffer && item.originalPrice
                          ? `${item.price} грн`
                          : `${
                              item.price *
                              (item.paidQuantity ?? item.quantity ?? 0)
                            } грн`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {shouldTriggerDiscountOffer && discountOfferProduct ? (
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
                    {`Додайте ще один рол зі знижкою ${promotionSettings.discountPercent}%`}
                  </div>

                  <div
                    style={{
                      fontSize: "13px",
                      color: "#666",
                      lineHeight: 1.4,
                    }}
                  >
                    У вас вже ролів на {promotionSettings.triggerSum} грн.
                    Даруємо вам знижку на наступний рол.
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
                      alt={`${discountOfferProduct.name}— доставка суші Каракатица`}
                      loading="lazy"

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
                          {Math.round(
                            discountOfferProduct.price *
                              (1 - promotionSettings.discountPercent / 100)
                          )}{" "}
                          грн
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
                          {`-${promotionSettings.discountPercent}%`}
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
                          <div
                            style={{
                              width: "64px",
                              height: "64px",
                              minWidth: "64px",
                              borderRadius: "12px",
                              overflow: "hidden",
                              background: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "1px solid #eee",
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src={getImageUrl(product.image)}
                              alt={`${product.name}— доставка суші Каракатица`}
                              loading="lazy"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                                padding:
                                  product.category === "drinks"
                                    ? "8px"
                                    : product.category === "rolls" ||
                                      product.category === "sets"
                                    ? "2px"
                                    : "4px",
                                display: "block",
                              }}
                            />
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: "15px",
                                fontWeight: "700",
                                color: "#222",
                                lineHeight: 1.2,
                              }}
                            >
                              {product.name}
                            </div>

                            <div
                              style={{
                                fontSize: "13px",
                                color: "#666",
                                marginTop: "4px",
                                lineHeight: 1.25,
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
                              minWidth: "40px",
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
              marginBottom: "10px",
              fontSize: "22px",
              fontWeight: "800",
              color: "#111",
            }}
          >
            <span>Разом</span>
            <span>{finalTotal} грн</span>
          </div>
          {checkoutMode === "pickup" && pickupDiscount > 0 && (
            <div
              style={{
                marginBottom: "10px",
                fontSize: "12px",
                color: "#16a34a",
                fontWeight: 700,
              }}
            >
              Знижка за самовивіз: -{pickupDiscount} грн
            </div>
          )}

          {checkoutMode === "pickup" &&
            pickupDiscount === 0 &&
            hasAnyPromoInCart && (
              <div
                style={{
                  fontSize: "12px",
                  color: "#a16207",
                  fontWeight: 700,
                  marginBottom: "10px",
                }}
              >
                Знижка не діє з акціями
              </div>
            )}

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


