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

  const sticksExtraPrice = trainingSticksCount * 2;

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  const getItemQuantity = (productId) => {
    const item = cartItems.find((item) => item.id === productId);
    return item ? Number(item.paidQuantity ?? item.quantity ?? 0) : 0;
  };

  const addToCart = (product, quantity = 1) => {
    const safePaidQuantity = Number(quantity) || 1;

    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);

      if (existingItem) {
        const newPaidQuantity =
          (existingItem.paidQuantity ?? existingItem.quantity ?? 0) +
          safePaidQuantity;

        const promo = calculatePromo(
          newPaidQuantity,
          existingItem.promoType ?? product.promoType
        );

        return prev.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: promo.totalQuantity,
                paidQuantity: promo.paidQuantity,
                freeQuantity: promo.freeQuantity,
              }
            : item
        );
      }

      const promo = calculatePromo(safePaidQuantity, product.promoType);

      return [
        ...prev,
        {
          ...product,
          quantity: promo.totalQuantity,
          paidQuantity: promo.paidQuantity,
          freeQuantity: promo.freeQuantity,
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
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id !== productId) return item;

        const newPaidQuantity = (item.paidQuantity ?? item.quantity ?? 0) + 1;
        const promo = calculatePromo(newPaidQuantity, item.promoType);

        return {
          ...item,
          quantity: promo.totalQuantity,
          paidQuantity: promo.paidQuantity,
          freeQuantity: promo.freeQuantity,
        };
      })
    );
  };

  const decreaseQuantity = (productId) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id !== productId) return item;

          const currentPaidQuantity = item.paidQuantity ?? item.quantity ?? 0;
          const newPaidQuantity = currentPaidQuantity - 1;

          if (newPaidQuantity <= 0) {
            return null;
          }

          const promo = calculatePromo(newPaidQuantity, item.promoType);

          return {
            ...item,
            quantity: promo.totalQuantity,
            paidQuantity: promo.paidQuantity,
            freeQuantity: promo.freeQuantity,
          };
        })
        .filter(Boolean)
    );
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
