import React from 'react';
import { Link } from 'react-router-dom';

function OrderSuccess() {
  return (
    <div className="text-center py-12">
      <div className="bg-green-50 inline-block p-4 rounded-full mb-6">
        <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <h1 className="text-3xl font-bold mb-4">Order Placed Successfully!</h1>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Thank you for your purchase. We've received your order and will process it shortly.
        You'll receive a confirmation email with your order details.
      </p>
      <div className="space-x-4">
        <Link 
          to="/" 
          className="inline-block px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition"
        >
          Continue Shopping
        </Link>
        <Link 
          to="/orders" 
          className="inline-block px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition"
        >
          View My Orders
        </Link>
      </div>
    </div>
  );
}

export default OrderSuccess;