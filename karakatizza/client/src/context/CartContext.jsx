import { createContext, useEffect, useMemo, useState, useContext } from "react";

export const CartContext = createContext(null);

const STORAGE_KEY = "karakatizza_cart";

/**
 * Тут укажи, по какому товару работает акция.
 * Лучше по id, если он у тебя стабильный.
 * Пока делаем по имени.
 */
const PROMO_PRODUCT_NAME = "Кокаїн";

function isPromoProduct(product) {
  return (
    (product?.name || "").trim().toLowerCase() ===
    PROMO_PRODUCT_NAME.toLowerCase()
  );
}

function applyPromotions(items) {
  return items.map((item) => {
    if (!isPromoProduct(item)) {
      const quantity = item.quantity ?? item.paidQuantity ?? 1;

      return {
        ...item,
        paidQuantity: quantity,
        freeQuantity: 0,
        quantity,
      };
    }

    const paidQuantity =
      typeof item.paidQuantity === "number"
        ? item.paidQuantity
        : item.quantity ?? 1;

    const freeQuantity = Math.floor(paidQuantity / 2);
    const quantity = paidQuantity + freeQuantity;

    return {
      ...item,
      paidQuantity,
      freeQuantity,
      quantity,
    };
  });
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return applyPromotions(parsed);
    } catch (error) {
      console.error("Cart parse error:", error);
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  function openCart() {
    setIsCartOpen(true);
  }

  function closeCart() {
    setIsCartOpen(false);
  }

  function addToCart(product, quantityToAdd = 1) {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === product.id);

      let next;

      if (existingIndex !== -1) {
        next = [...prev];
        const existing = next[existingIndex];

        if (isPromoProduct(existing)) {
          const nextPaidQuantity =
            (existing.paidQuantity ?? existing.quantity ?? 0) + quantityToAdd;

          next[existingIndex] = {
            ...existing,
            paidQuantity: nextPaidQuantity,
          };
        } else {
          next[existingIndex] = {
            ...existing,
            quantity: (existing.quantity ?? 0) + quantityToAdd,
          };
        }
      } else {
        if (isPromoProduct(product)) {
          next = [
            ...prev,
            {
              ...product,
              paidQuantity: quantityToAdd,
              freeQuantity: 0,
              quantity: quantityToAdd,
            },
          ];
        } else {
          next = [
            ...prev,
            {
              ...product,
              quantity: quantityToAdd,
              paidQuantity: quantityToAdd,
              freeQuantity: 0,
            },
          ];
        }
      }

      return applyPromotions(next);
    });

    setIsCartOpen(true);
  }

  function removeFromCart(id) {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  }

  function clearCart() {
    setCartItems([]);
  }

  function increaseQuantity(id) {
    setCartItems((prev) => {
      const next = prev.map((item) => {
        if (item.id !== id) return item;

        if (isPromoProduct(item)) {
          return {
            ...item,
            paidQuantity: (item.paidQuantity ?? item.quantity ?? 0) + 1,
          };
        }

        return {
          ...item,
          quantity: (item.quantity ?? 0) + 1,
        };
      });

      return applyPromotions(next);
    });
  }

  function decreaseQuantity(id) {
    setCartItems((prev) => {
      const next = prev
        .map((item) => {
          if (item.id !== id) return item;

          if (isPromoProduct(item)) {
            const nextPaidQuantity =
              (item.paidQuantity ?? item.quantity ?? 0) - 1;

            if (nextPaidQuantity <= 0) return null;

            return {
              ...item,
              paidQuantity: nextPaidQuantity,
            };
          }

          const nextQuantity = (item.quantity ?? 0) - 1;

          if (nextQuantity <= 0) return null;

          return {
            ...item,
            quantity: nextQuantity,
          };
        })
        .filter(Boolean);

      return applyPromotions(next);
    });
  }

  const totalItems = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
  }, [cartItems]);

  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const paidQty = item.paidQuantity ?? item.quantity ?? 0;
      return sum + item.price * paidQty;
    }, 0);
  }, [cartItems]);

  const value = {
    cartItems,
    isCartOpen,
    openCart,
    closeCart,
    addToCart,
    removeFromCart,
    clearCart,
    increaseQuantity,
    decreaseQuantity,
    totalItems,
    totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
