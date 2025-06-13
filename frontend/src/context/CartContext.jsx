import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the context
const CartContext = createContext();

// Create a provider component
export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);

  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      setCartItems(parsedCart);
      calculateTotal(parsedCart);
    }
  }, []);

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
    // Generate a unique key that includes size and color
    const itemKey = `${product.id}${product.selectedSize ? `-${product.selectedSize}` : ''}${product.selectedColor ? `-${product.selectedColor}` : ''}`;
    
    // Check if this exact combination already exists in cart
    const existingItemIndex = cartItems.findIndex(
      item => `${item.id}${item.selectedSize ? `-${item.selectedSize}` : ''}${item.selectedColor ? `-${item.selectedColor}` : ''}` === itemKey
    );

    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity += product.quantity;
      setCartItems(updatedItems);
    } else {
      // Add new item
      setCartItems([...cartItems, {...product}]);
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

  return (
    <CartContext.Provider value={{
      cartItems,
      totalItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getSubtotal
    }}>
      {children}
    </CartContext.Provider>
  );
}

// Custom hook to use the cart context
export function useCart() {
  return useContext(CartContext);
}