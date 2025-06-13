import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { showToast } from '../utils/toast';

function Cart() {
  const { cartItems, updateCartItemQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  
  // Calculate cart totals
  const subtotal = cartItems.reduce((total, item) => {
    const price = item.sale_price && item.sale_price < item.price 
      ? item.sale_price 
      : item.price;
    return total + (price * item.quantity);
  }, 0);
  
  const shipping = subtotal > 100 ? 0 : 10;
  const tax = subtotal * 0.08; // 8% tax rate
  const total = subtotal + shipping + tax - discount;
  
  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    updateCartItemQuantity(itemId, newQuantity);
  };
  
  const handleRemoveItem = (itemId) => {
    removeFromCart(itemId);
    showToast.success('Item removed from cart');
  };
  
  const handleApplyCoupon = () => {
    setLoading(true);
    
    // Simulate API call to validate coupon
    setTimeout(() => {
      if (couponCode.toUpperCase() === 'SAVE20') {
        const discountAmount = subtotal * 0.2; // 20% discount
        setDiscount(discountAmount);
        setCouponApplied(true);
        showToast.success('Coupon applied successfully!');
      } else {
        showToast.error('Invalid coupon code');
      }
      setLoading(false);
    }, 1000);
  };
  
  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) {
      showToast.error('Your cart is empty');
      return;
    }
    
    navigate('/checkout');
  };
  
  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center">
          <h1 className="text-3xl font-light mb-6">Your Cart</h1>
          <div className="bg-gray-50 p-12 rounded-lg">
            <svg 
              className="mx-auto h-16 w-16 text-gray-400 mb-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="1.5" 
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              ></path>
            </svg>
            <p className="text-gray-600 mb-6">Your cart is empty</p>
            <Link 
              to="/products" 
              className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors inline-block"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto py-12">
      <h1 className="text-3xl font-light mb-8">Your Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="border-b pb-4 mb-4 hidden md:grid md:grid-cols-12 text-sm text-gray-500">
            <div className="md:col-span-6">Product</div>
            <div className="md:col-span-2 text-center">Price</div>
            <div className="md:col-span-2 text-center">Quantity</div>
            <div className="md:col-span-2 text-right">Total</div>
          </div>
          
          {cartItems.map((item) => {
            const itemPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price || 0);
            const itemSalePrice = item.sale_price && typeof item.sale_price === 'number' ? 
              item.sale_price : (item.sale_price ? parseFloat(item.sale_price) : itemPrice);
            const actualPrice = item.sale_price && itemSalePrice < itemPrice ? itemSalePrice : itemPrice;
            
            return (
              <div 
                key={`${item.id}-${item.selectedSize}-${item.selectedColor}`} 
                className="border-b py-6 flex flex-col md:grid md:grid-cols-12 items-start md:items-center gap-4"
              >
                {/* Product Image & Info */}
                <div className="md:col-span-6 flex items-center space-x-4">
                  <Link to={`/product/${item.slug}`} className="shrink-0">
                    <img 
                      src={item.image || 'https://via.placeholder.com/150'} 
                      alt={item.name} 
                      className="w-20 h-20 object-cover rounded"
                    />
                  </Link>
                  <div>
                    <Link to={`/product/${item.slug}`} className="font-medium hover:underline">
                      {item.name}
                    </Link>
                    {item.selectedSize && (
                      <p className="text-sm text-gray-600 mt-1">Size: {item.selectedSize}</p>
                    )}
                    {item.selectedColor && (
                      <p className="text-sm text-gray-600 mt-1">
                        Color: 
                        <span 
                          className="inline-block w-3 h-3 rounded-full ml-1"
                          style={{ backgroundColor: item.selectedColor }}
                        ></span>
                      </p>
                    )}
                    <button 
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-sm text-red-600 mt-2 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                
                {/* Price */}
                <div className="md:col-span-2 text-center">
                  {item.sale_price && item.sale_price < item.price ? (
                    <div>
                      <span className="text-red-600">
                        ${(typeof item.sale_price === 'number' ? item.sale_price : parseFloat(item.sale_price || 0)).toFixed(2)}
                      </span>
                      <span className="text-gray-500 line-through text-sm ml-1">${item.price.toFixed(2)}</span>
                    </div>
                  ) : (
                    <span>${(typeof item.price === 'number' ? item.price : parseFloat(item.price || 0)).toFixed(2)}</span>
                  )}
                </div>
                
                {/* Quantity */}
                <div className="md:col-span-2 text-center">
                  <div className="inline-flex border border-gray-300">
                    <button 
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      className="px-3 py-1 border-r border-gray-300"
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <div className="px-4 py-1">{item.quantity}</div>
                    <button 
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      className="px-3 py-1 border-l border-gray-300"
                    >
                      +
                    </button>
                  </div>
                </div>
                
                {/* Total */}
                <div className="md:col-span-2 text-right font-medium">
                  ${(itemPrice * item.quantity).toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-medium mb-4">Order Summary</h2>
            
            {/* Subtotal */}
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            
            {/* Shipping */}
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Shipping</span>
              {shipping === 0 ? (
                <span className="text-green-600">Free</span>
              ) : (
                <span>${shipping.toFixed(2)}</span>
              )}
            </div>
            
            {/* Tax */}
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Tax (8%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            
            {/* Discount */}
            {discount > 0 && (
              <div className="flex justify-between mb-2 text-green-600">
                <span>Discount</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            
            {/* Total */}
            <div className="flex justify-between border-t border-gray-200 mt-4 pt-4 font-medium">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            
            {/* Coupon Code */}
            {!couponApplied && (
              <div className="mt-6">
                <label htmlFor="coupon" className="block text-sm text-gray-600 mb-2">
                  Apply Coupon Code
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="coupon"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter code"
                    className="flex-grow px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={loading || !couponCode}
                    className="ml-2 px-4 py-2 bg-gray-800 text-white disabled:bg-gray-400"
                  >
                    {loading ? 'Applying...' : 'Apply'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Try "SAVE20" for 20% off</p>
              </div>
            )}
            
            {/* Checkout Button */}
            <button
              onClick={handleProceedToCheckout}
              className="w-full bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors mt-6"
            >
              Proceed to Checkout
            </button>
            
            {/* Continue Shopping */}
            <Link 
              to="/products" 
              className="block text-center mt-4 text-gray-600 hover:underline"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;