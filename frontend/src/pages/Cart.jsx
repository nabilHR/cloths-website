import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock cart data (replace with actual cart state management)
  useEffect(() => {
    // Simulate loading cart items
    setTimeout(() => {
      setCartItems([
        {
          id: 1,
          name: 'Classic T-Shirt',
          price: 29.99,
          size: 'M',
          color: 'Black',
          quantity: 2,
          image: 'https://via.placeholder.com/100x100?text=T-Shirt',
        },
        {
          id: 2,
          name: 'Slim Fit Jeans',
          price: 59.99,
          size: '32',
          color: 'Blue',
          quantity: 1,
          image: 'https://via.placeholder.com/100x100?text=Jeans',
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const handleUpdateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;
    
    setCartItems(cartItems.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const handleRemoveItem = (id) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading cart...</div>;
  }

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
        <p className="mb-8">Looks like you haven't added anything to your cart yet.</p>
        <Link to="/" className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          {cartItems.map(item => (
            <div key={item.id} className="flex border-b border-gray-200 py-4">
              <img 
                src={item.image} 
                alt={item.name} 
                className="w-24 h-24 object-cover rounded-md"
              />
              
              <div className="ml-4 flex-grow">
                <div className="flex justify-between">
                  <h3 className="text-lg font-medium">{item.name}</h3>
                  <button 
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-gray-500 hover:text-red-500"
                  >
                    Remove
                  </button>
                </div>
                
                <p className="text-gray-600">Size: {item.size}</p>
                <p className="text-gray-600">Color: {item.color}</p>
                
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center">
                    <button 
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      className="px-2 py-1 border border-gray-300 rounded-md"
                    >
                      -
                    </button>
                    <span className="px-3">{item.quantity}</span>
                    <button 
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      className="px-2 py-1 border border-gray-300 rounded-md"
                    >
                      +
                    </button>
                  </div>
                  <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Order Summary */}
        <div className="bg-gray-50 p-6 rounded-lg h-fit">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          
          <div className="flex justify-between mb-2">
            <span>Subtotal</span>
            <span>${calculateSubtotal().toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between mb-2">
            <span>Shipping</span>
            <span>$5.00</span>
          </div>
          
          <div className="flex justify-between font-semibold text-lg border-t border-gray-300 pt-2 mt-2">
            <span>Total</span>
            <span>${(calculateSubtotal() + 5).toFixed(2)}</span>
          </div>
          
          <Link 
            to="/checkout" 
            className="block w-full text-center bg-black text-white py-3 rounded-md mt-6 hover:bg-gray-800 transition"
          >
            Proceed to Checkout
          </Link>
          
          <Link 
            to="/" 
            className="block w-full text-center py-3 mt-2 text-gray-600 hover:text-black transition"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Cart;