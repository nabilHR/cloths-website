import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function Cart() {
  const { cartItems: cart, updateQuantity, removeFromCart, clearCart, getSubtotal: calculateTotal } = useCart();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Just a short delay to simulate loading
    setTimeout(() => setLoading(false), 300);
  }, []);

  // Handle quantity change with debounce
  const handleQuantityChange = (itemId, size, newQuantity) => {
    setIsUpdating(true);
    updateQuantity(itemId, size, newQuantity);
    setTimeout(() => setIsUpdating(false), 500);
  };

  // Calculate totals
  const subtotal = calculateTotal();
  const shipping = subtotal > 0 ? 10 : 0;
  const total = subtotal + shipping;

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <p className="text-xl mb-4">Your cart is empty</p>
          <Link to="/" className="inline-block px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
      
      <div className="lg:grid lg:grid-cols-3 lg:gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6 lg:mb-0">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Cart Items ({cart.length})</h2>
            </div>
            
            <div className="divide-y">
              {cart.map((item) => (
                <div key={`${item.id}-${item.size}`} className="p-6 flex flex-col sm:flex-row items-start sm:items-center">
                  <div className="w-full sm:w-20 h-20 mb-4 sm:mb-0 sm:mr-6 flex-shrink-0">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                  
                  <div className="flex-grow">
                    <Link to={`/products/${item.id}`} className="font-medium hover:text-gray-500">
                      {item.name}
                    </Link>
                    <p className="text-gray-500 text-sm mt-1">Size: {item.size}</p>
                    <p className="font-medium mt-1">${parseFloat(item.price).toFixed(2)}</p>
                  </div>
                  
                  <div className="flex items-center mt-4 sm:mt-0">
                    <div className="flex items-center border rounded-md mr-4">
                      <button 
                        onClick={() => handleQuantityChange(item.id, item.size, Math.max(1, item.quantity - 1))}
                        className="px-3 py-1 border-r hover:bg-gray-100"
                        disabled={isUpdating}
                      >
                        -
                      </button>
                      <span className="px-3 py-1 min-w-[40px] text-center">{item.quantity}</span>
                      <button 
                        onClick={() => handleQuantityChange(item.id, item.size, item.quantity + 1)}
                        className="px-3 py-1 border-l hover:bg-gray-100"
                        disabled={isUpdating}
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
              ))}
            </div>
            
            <div className="p-6 border-t bg-gray-50">
              <div className="flex justify-between">
                <button 
                  onClick={() => clearCart()}
                  className="text-red-500 hover:text-red-700"
                >
                  Clear Cart
                </button>
                
                <Link to="/" className="text-blue-600 hover:text-blue-800">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden sticky top-4">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Order Summary</h2>
            </div>
            
            <div className="p-6">
              <div className="flex justify-between mb-4">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between mb-4">
                <span>Shipping</span>
                <span>${shipping.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between font-bold text-lg border-t pt-4 mt-4">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              
              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-3 px-4 bg-black text-white rounded-md hover:bg-gray-800 transition mt-6"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;