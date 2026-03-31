import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useSiteSettings } from "./SiteSettingsContext";

const CartContext = createContext();

function calculatePromo(paidQuantity, promoType) {
  const safePaidQuantity = Number(paidQuantity) || 0;

  if (promoType === "2plus1") {
    const freeQuantity = Math.floor(safePaidQuantity / 2);
    const totalQuantity = safePaidQuantity + freeQuantity;

    return {
      paidQuantity: safePaidQuantity,
      freeQuantity,
      totalQuantity,
    };
  }

  return {
    paidQuantity: safePaidQuantity,
    freeQuantity: 0,
    totalQuantity: safePaidQuantity,
  };
}

export function CartProvider({ children }) {
  const { siteSettings } = useSiteSettings();

  const deliverySettings = siteSettings?.delivery;
  const pickupDiscountPercent = deliverySettings?.pickupDiscountPercent ?? 5;

  const deliveryEnabled = deliverySettings?.deliveryEnabled ?? true;
  const pickupEnabled = deliverySettings?.pickupEnabled ?? true;

  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem("cartItems");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [checkoutMode, setCheckoutMode] = useState("delivery");
  const [confirmedAddress, setConfirmedAddress] = useState("");
  const [deliveryDistanceKm, setDeliveryDistanceKm] = useState(null);
  const [deliverySummary, setDeliverySummary] = useState(null);

  const [regularSticksCount, setRegularSticksCount] = useState(0);
  const [trainingSticksCount, setTrainingSticksCount] = useState(0);
  const [activePromoType, setActivePromoType] = useState(null);

  const [soySauceCount, setSoySauceCount] = useState(0);
  const [gingerCount, setGingerCount] = useState(0);
  const [wasabiCount, setWasabiCount] = useState(0);

  const sticksExtraPrice = trainingSticksCount * 2;

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (!deliveryEnabled && checkoutMode === "delivery" && pickupEnabled) {
      setCheckoutMode("pickup");
    }

    if (!pickupEnabled && checkoutMode === "pickup" && deliveryEnabled) {
      setCheckoutMode("delivery");
    }
  }, [deliveryEnabled, pickupEnabled, checkoutMode, setCheckoutMode]);

  useEffect(() => {
    if (!deliveryEnabled && pickupEnabled) {
      setCheckoutMode("pickup");
    }

    if (!pickupEnabled && deliveryEnabled) {
      setCheckoutMode("delivery");
    }
  }, [deliveryEnabled, pickupEnabled, setCheckoutMode]);

  const getItemQuantity = (productId) => {
    const item = cartItems.find((item) => item.id === productId);
    return item ? Number(item.paidQuantity ?? item.quantity ?? 0) : 0;
  };

  const getNextPromoType = (items) => {
    const promoItem = items.find((item) => item.promoType);
    return promoItem ? promoItem.promoType : null;
  };

  const addToCart = (product, quantity = 1) => {
    const safePaidQuantity = Number(quantity) || 1;

    const getKey = (item) =>
      item.cartKey ?? `${item.id}-${item.isGiftRoll ? "gift" : "normal"}`;

    const productKey =
      product.cartKey ??
      `${product.id}-${product.isGiftRoll ? "gift" : "normal"}`;

    setCartItems((prev) => {
      console.log("ADD TO CART PRODUCT", product);
      if (product.category === "sets") {
        setSoySauceCount(
          (prevCount) => prevCount + (product.freeSoySauce || 0)
        );
        setGingerCount((prevCount) => prevCount + (product.freeGinger || 0));
        setWasabiCount((prevCount) => prevCount + (product.freeWasabi || 0));
      }

      const hasDiscountOfferAlready = prev.some((item) => {
        if (getKey(item) === productKey) return false;

        return (
          item.isDiscountOffer === true ||
          Number(item.freeQuantity ?? 0) > 0 ||
          item.isGiftRoll === true ||
          (item.promoType && item.promoType !== "none")
        );
      });

      const existingItem = prev.find((item) => getKey(item) === productKey);

      if (existingItem) {
        if (product.isGiftRoll) {
          return prev;
        }

        const currentPaidQuantity = Number(
          existingItem.paidQuantity ?? existingItem.quantity ?? 0
        );

        const newPaidQuantity = currentPaidQuantity + safePaidQuantity;

        const effectivePromoType = hasDiscountOfferAlready
          ? "none"
          : existingItem.promoType ?? product.promoType;

        const promo = calculatePromo(newPaidQuantity, effectivePromoType);

        return prev.map((item) =>
          getKey(item) === productKey
            ? {
                ...item,
                quantity: promo.totalQuantity,
                paidQuantity: promo.paidQuantity,
                freeQuantity: promo.freeQuantity,
                isDiscountOffer:
                  item.isDiscountOffer ?? product.isDiscountOffer ?? false,
                discountLabel:
                  item.discountLabel ?? product.discountLabel ?? "",
              }
            : item
        );
      }

      if (product.isGiftRoll) {
        return [
          ...prev,
          {
            ...product,
            quantity: 1,
            paidQuantity: 0,
            freeQuantity: 0,
            isGiftRoll: true,
            cartKey: productKey,
          },
        ];
      }

      const effectivePromoType = hasDiscountOfferAlready
        ? "none"
        : product.promoType;
      const promo = calculatePromo(safePaidQuantity, effectivePromoType);

      return [
        ...prev,
        {
          ...product,
          quantity: promo.totalQuantity,
          paidQuantity: promo.paidQuantity,
          freeQuantity: promo.freeQuantity,
          isDiscountOffer: product.isDiscountOffer ?? false,
          discountLabel: product.discountLabel ?? "",
          cartKey: productKey,
        },
      ];
    });
  };

  const decreaseCartItem = (productId) => {
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === productId);

      if (!existingItem) return prev;

      const currentPaidQuantity = Number(
        existingItem.paidQuantity ?? existingItem.quantity ?? 0
      );

      const newPaidQuantity = currentPaidQuantity - 1;

      if (newPaidQuantity <= 0) {
        return prev.filter((item) => item.id !== productId);
      }

      const promo = calculatePromo(newPaidQuantity, existingItem.promoType);

      return prev.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity: promo.totalQuantity,
              paidQuantity: promo.paidQuantity,
              freeQuantity: promo.freeQuantity,
              isDiscountOffer: existingItem.isDiscountOffer ?? false,
              discountLabel: existingItem.discountLabel ?? "",
            }
          : item
      );
    });
  };

  const removeFromCart = (targetKey) => {
    setCartItems((prev) =>
      prev.filter((item) => (item.cartKey ?? item.id) !== targetKey)
    );
  };
  const clearCart = () => {
    setCartItems([]);
  };

  const increaseQuantity = (productId) => {
    setCartItems((prev) => {
      const hasDiscountOfferAlready = prev.some((item) => {
        if (item.id === productId) return false;

        return (
          item.isDiscountOffer === true ||
          Number(item.freeQuantity ?? 0) > 0 ||
          item.isGiftRoll === true ||
          (item.promoType && item.promoType !== "none")
        );
      });

      return prev.map((item) => {
        if (item.id !== productId) return item;

        const newPaidQuantity = (item.paidQuantity ?? item.quantity ?? 0) + 1;

        const effectivePromoType =
          hasDiscountOfferAlready && !item.isDiscountOffer
            ? "none"
            : item.promoType;

        const promo = calculatePromo(newPaidQuantity, effectivePromoType);

        return {
          ...item,
          quantity: promo.totalQuantity,
          paidQuantity: promo.paidQuantity,
          freeQuantity: promo.freeQuantity,
          isDiscountOffer: item.isDiscountOffer ?? false,
          discountLabel: item.discountLabel ?? "",
          originalPrice: item.originalPrice ?? item.price,
        };
      });
    });
  };

  const decreaseQuantity = (productId) => {
    setCartItems((prev) => {
      const hasDiscountOfferAlready = prev.some((item) => {
        if (item.id === productId) return false;

        return (
          item.isDiscountOffer === true ||
          Number(item.freeQuantity ?? 0) > 0 ||
          item.isGiftRoll === true ||
          (item.promoType && item.promoType !== "none")
        );
      });

      return prev
        .map((item) => {
          if (item.id !== productId) return item;

          const currentPaidQuantity = item.paidQuantity ?? item.quantity ?? 0;
          const newPaidQuantity = currentPaidQuantity - 1;

          if (newPaidQuantity <= 0) {
            return null;
          }

          const effectivePromoType =
            hasDiscountOfferAlready && !item.isDiscountOffer
              ? "none"
              : item.promoType;

          const promo = calculatePromo(newPaidQuantity, effectivePromoType);

          return {
            ...item,
            quantity: promo.totalQuantity,
            paidQuantity: promo.paidQuantity,
            freeQuantity: promo.freeQuantity,
            isDiscountOffer: item.isDiscountOffer ?? false,
            discountLabel: item.discountLabel ?? "",
            originalPrice: item.originalPrice ?? item.price,
          };
        })
        .filter(Boolean);
    });
  };

  const totalItems = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
  }, [cartItems]);

  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const paidQuantity = item.paidQuantity ?? item.quantity ?? 0;
      return sum + item.price * paidQuantity;
    }, 0);
  }, [cartItems]);
  // есть ли вообще акции в корзине
  const hasAnyPromoInCart = cartItems.some((item) => {
    if (item.isGiftRoll === true) return true;

    const freeQty = Number(item.freeQuantity ?? 0);
    if (freeQty > 0) return true;

    const discountAmount = Number(item.discountAmount ?? 0);
    if (discountAmount > 0) return true;

    const oldPrice = Number(item.oldPrice ?? item.originalPrice ?? 0);
    const price = Number(item.price ?? 0);
    if (oldPrice > price) return true;

    return false;
  });

  const pickupDiscountBase = cartItems.reduce((sum, item) => {
    if (item.isGiftRoll) return sum;

    const category = item.category?.toLowerCase?.() || "";

    const isDrink =
      category === "drinks" || category === "напої" || category === "напитки";

    const isExtra =
      category === "extras" ||
      category === "додатково" ||
      category === "дополнительно";

    if (isDrink || isExtra) return sum;

    const oldPrice = Number(item.oldPrice ?? item.originalPrice ?? 0);
    const price = Number(item.price ?? 0);
    const hasOldPriceDiscount = oldPrice > price;

    const hasDiscountAmount = Number(item.discountAmount ?? 0) > 0;
    const isAlreadyDiscounted =
      hasOldPriceDiscount || hasDiscountAmount || item.isDiscountOffer === true;

    if (isAlreadyDiscounted) return sum;

    const paidQty = Number(item.paidQuantity ?? item.quantity ?? 0);
    return sum + price * paidQty;
  }, 0);

  const pickupDiscount =
    checkoutMode === "pickup" && pickupEnabled && !hasAnyPromoInCart
      ? Math.round(pickupDiscountBase * (pickupDiscountPercent / 100))
      : 0;

  const finalTotal = Math.max(0, totalPrice - pickupDiscount);
  const checkoutTotalPrice = finalTotal + sticksExtraPrice;

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        setCartItems,
        isCartOpen,
        openCart,
        closeCart,
        addToCart,
        removeFromCart,
        clearCart,
        increaseQuantity,
        decreaseQuantity,
        decreaseCartItem,
        getItemQuantity,
        totalItems,
        totalPrice,
        toastMessage,
        setToastMessage,
        pickupDiscount,
        finalTotal,
        hasAnyPromoInCart,

        checkoutMode,
        setCheckoutMode,
        confirmedAddress,
        setConfirmedAddress,
        deliveryDistanceKm,
        setDeliveryDistanceKm,
        deliverySummary,
        setDeliverySummary,
        calculatePromo,
        pickupDiscountPercent,
        deliveryEnabled,
        pickupEnabled,

        regularSticksCount,
        setRegularSticksCount,
        trainingSticksCount,
        setTrainingSticksCount,
        sticksExtraPrice,
        checkoutTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
