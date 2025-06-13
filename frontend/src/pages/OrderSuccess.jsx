import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { showToast } from '../utils/toast';

function OrderSuccess() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }
      
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`http://localhost:8000/api/orders/${orderId}/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setOrder(data);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [orderId]);
  
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin h-12 w-12 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Loading order details...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 p-4 rounded-md mb-8">
          <h2 className="text-xl font-medium text-red-800 mb-2">Error loading order</h2>
          <p className="text-red-700">{error}</p>
        </div>
        <Link to="/account" className="text-black underline">
          Go to my account
        </Link>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h1 className="text-3xl font-medium mb-2">Thank You for Your Order!</h1>
        <p className="text-gray-600">
          {order ? `Order #${order.id} has been placed successfully.` : 'Your order has been placed successfully.'}
        </p>
      </div>
      
      {order && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium">Order Details</h2>
          </div>
          
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm text-gray-500 mb-1">Order Number</h3>
                <p className="font-medium">{order.id}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-500 mb-1">Date</h3>
                <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-500 mb-1">Total</h3>
                <p className="font-medium">${order.total}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-500 mb-1">Payment Method</h3>
                <p className="font-medium">
                  {order.payment_method === 'credit_card' ? 'Credit Card' : 'PayPal'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4">
            <h3 className="text-sm text-gray-500 mb-2">Items</h3>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-start">
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                    <img
                      src={item.product_image || 'https://via.placeholder.com/100x100'}
                      alt={item.product_name}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-medium">{item.product_name}</h4>
                        <p className="mt-1 text-sm text-gray-500">
                          {item.size && `Size: ${item.size}`}
                          {item.color && item.size && ' | '}
                          {item.color && `Color: ${item.color}`}
                        </p>
                      </div>
                      <p className="text-sm font-medium">${item.price} x {item.quantity}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-gray-50 px-6 py-4">
            <h3 className="text-sm text-gray-500 mb-2">Shipping Address</h3>
            <address className="not-italic">
              <p>{order.shipping_address.full_name}</p>
              <p>{order.shipping_address.address}</p>
              <p>
                {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip_code}
              </p>
              <p>{order.shipping_address.country}</p>
            </address>
          </div>
        </div>
      )}
      
      <div className="mt-8 flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-6">
        <Link
          to="/"
          className="text-blue-600 hover:underline"
        >
          Continue Shopping
        </Link>
        <Link
          to="/order-history"
          className="px-6 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800"
        >
          View Order History
        </Link>
      </div>
    </div>
  );
}

export default OrderSuccess;