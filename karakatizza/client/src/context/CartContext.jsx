import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext();

function calculatePromo(quantity, promoType) {
  const safeQuantity = Number(quantity) || 0;

  if (promoType === "2plus1") {
    const freeQuantity = Math.floor(safeQuantity / 3);
    const paidQuantity = safeQuantity - freeQuantity;

    return {
      paidQuantity,
      freeQuantity,
    };
  }

  return {
    paidQuantity: safeQuantity,
    freeQuantity: 0,
  };
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem("cartItems");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    const safeQuantity = Number(quantity) || 1;

    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);

      if (existingItem) {
        const newQuantity = existingItem.quantity + safeQuantity;
        const promo = calculatePromo(newQuantity, existingItem.promoType);

        return prev.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: newQuantity,
                paidQuantity: promo.paidQuantity,
                freeQuantity: promo.freeQuantity,
              }
            : item
        );
      }

      const promo = calculatePromo(safeQuantity, product.promoType);

      return [
        ...prev,
        {
          ...product,
          quantity: safeQuantity,
          paidQuantity: promo.paidQuantity,
          freeQuantity: promo.freeQuantity,
        },
      ];
    });

    setIsCartOpen(true);
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

        const newQuantity = item.quantity + 1;
        const promo = calculatePromo(newQuantity, item.promoType);

        return {
          ...item,
          quantity: newQuantity,
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

          const newQuantity = item.quantity - 1;

          if (newQuantity <= 0) {
            return null;
          }

          const promo = calculatePromo(newQuantity, item.promoType);

          return {
            ...item,
            quantity: newQuantity,
            paidQuantity: promo.paidQuantity,
            freeQuantity: promo.freeQuantity,
          };
        })
        .filter(Boolean)
    );
  };

  const totalItems = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const paidQuantity = item.paidQuantity ?? item.quantity;
      return sum + item.price * paidQuantity;
    }, 0);
  }, [cartItems]);

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
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
