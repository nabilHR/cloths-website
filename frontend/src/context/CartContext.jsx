import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the context
export const CartContext = createContext();

// Create a provider component
export function CartProvider({ children }) {
  // Initialize state from localStorage
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [totalItems, setTotalItems] = useState(0);

  // Save to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
    calculateTotal(cartItems);
  }, [cartItems]);

  // Calculate total items
  const calculateTotal = (items) => {
    const total = items.reduce((sum, item) => sum + item.quantity, 0);
    setTotalItems(total);
  };

  // Add item to cart
  const addToCart = (product) => {
    // Normalize property names
    const normalizedProduct = {
      ...product,
      size: product.selectedSize || '',
      color: product.selectedColor || '',
    };

    const itemKey = `${normalizedProduct.id}${normalizedProduct.size ? `-${normalizedProduct.size}` : ''}${normalizedProduct.color ? `-${normalizedProduct.color}` : ''}`;

    const existingItemIndex = cartItems.findIndex(
      item => `${item.id}${item.size ? `-${item.size}` : ''}${item.color ? `-${item.color}` : ''}` === itemKey
    );

    if (existingItemIndex >= 0) {
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity += normalizedProduct.quantity;
      setCartItems(updatedItems);
    } else {
      setCartItems([...cartItems, { ...normalizedProduct }]);
    }
  };

  // Remove item from cart
  const removeFromCart = (id, size) => {
    setCartItems(prevItems => 
      prevItems.filter(item => !(item.id === id && item.size === size))
    );
  };

  // Update item quantity
  const updateQuantity = (id, size, quantity) => {
    if (quantity < 1) return;
    
    setCartItems(prevItems => 
      prevItems.map(item => 
        (item.id === id && item.size === size) 
          ? { ...item, quantity } 
          : item
      )
    );
  };

  // Clear cart
  const clearCart = () => {
    setCartItems([]);
  };

  // Calculate subtotal
  const getSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Calculate total price
  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      return total + (parseFloat(item.price) || 0) * item.quantity;
    }, 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      totalItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getSubtotal,
      getTotalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
}

// Custom hook to use the cart context
export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }

  // Destructure updateQuantity from context!
  const { cartItems, addToCart, removeFromCart, clearCart, updateQuantity } = context;

  return {
    cartItems,
    addToCart,
    removeFromCart,
    clearCart,
    updateQuantity, // <-- use this in your Cart page
  };
}

// Example usage in Cart.jsx
/*
<button onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}>-</button>
<input
  type="number"
  min="1"
  value={item.quantity}
  onChange={e => updateQuantity(item.id, item.size, parseInt(e.target.value, 10))}
/>
<button onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}>+</button>
*/