import { createContext, useContext, useEffect, useMemo, useState } from "react";

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

    setCartItems((prev) => {
      if (product.category === "sets") {
        setSoySauceCount((prev) => prev + (product.freeSoySauce || 0));
        setGingerCount((prev) => prev + (product.freeGinger || 0));
        setWasabiCount((prev) => prev + (product.freeWasabi || 0));
      }

      const hasDiscountOfferAlready = prev.some((item) => {
        if (item.id === product.id) return false;

        return (
          item.isDiscountOffer === true ||
          Number(item.freeQuantity ?? 0) > 0 ||
          item.isGiftRoll === true ||
          (item.promoType && item.promoType !== "none")
        );
      });

      const existingItem = prev.find((item) => item.id === product.id);

      if (existingItem) {
        const currentPaidQuantity = Number(
          existingItem.paidQuantity ?? existingItem.quantity ?? 0
        );

        const newPaidQuantity = currentPaidQuantity + safePaidQuantity;

        const effectivePromoType = hasDiscountOfferAlready
          ? "none"
          : existingItem.promoType ?? product.promoType;

        const promo = calculatePromo(newPaidQuantity, effectivePromoType);

        return prev.map((item) =>
          item.id === product.id
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
        },
      ];
    });

    window.dispatchEvent(
      new CustomEvent("cart:toast", {
        detail: `Додано: ${product.name}`,
      })
    );
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

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
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
  const checkoutTotalPrice = totalPrice + sticksExtraPrice;

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

        checkoutMode,
        setCheckoutMode,
        confirmedAddress,
        setConfirmedAddress,
        deliveryDistanceKm,
        setDeliveryDistanceKm,
        deliverySummary,
        setDeliverySummary,

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
