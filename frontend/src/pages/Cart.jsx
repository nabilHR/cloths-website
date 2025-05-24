import React from 'react';
import { Link } from 'react-router-dom';

function Cart() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Your Shopping Cart</h1>
      
      <p className="text-gray-600 mb-4">Your cart is currently empty.</p>
      
      <Link to="/" className="inline-block px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800">
        Continue Shopping
      </Link>
    </div>
  );
}

export default Cart;