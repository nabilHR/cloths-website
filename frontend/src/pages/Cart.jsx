import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

function Cart() {
  const { cartItems, removeFromCart, updateQuantity, getSubtotal } = useCart();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Just a short delay to simulate loading
    setTimeout(() => setLoading(false), 300);
  }, []);

  const calculateShipping = () => {
    return cartItems.length > 0 ? 5.00 : 0.00;
  };

  const calculateTotal = () => {
    return getSubtotal() + calculateShipping();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
        <p className="text-gray-600 mb-8">Your cart is currently empty.</p>
        <Link 
          to="/" 
          className="inline-block px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Cart Items */}
          <div className="border rounded-lg divide-y">
            {cartItems.map((item) => (
              <div key={`${item.id}-${item.size}`} className="flex p-4">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-20 h-20 object-cover rounded-md"
                />
                
                <div className="flex-grow ml-4">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-gray-500 text-sm">Size: {item.size}</p>
                    </div>
                    <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center">
                      <button 
                        onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                        className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="px-3">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                        className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                      >
                        +
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => removeFromCart(item.id, item.size)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="bg-gray-50 p-6 rounded-lg h-fit">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>${getSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span>${calculateShipping().toFixed(2)}</span>
            </div>
            <div className="border-t pt-3 mt-3 flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
          </div>
          
          <Link 
            to="/checkout"
            className="block w-full py-3 bg-black text-white text-center rounded-md hover:bg-gray-800 transition"
          >
            Proceed to Checkout
          </Link>
          
          <Link 
            to="/" 
            className="block text-center text-gray-600 hover:text-black mt-4"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Cart;