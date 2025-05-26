import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          setError('Authentication required');
          setLoading(false);
          return;
        }
        
        const response = await fetch(`http://localhost:8000/api/orders/${orderId}/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setOrder(data);
        } else {
          setError('Failed to load order details');
        }
      } catch (err) {
        setError('An error occurred while fetching your order');
        console.error('Order fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [orderId]);
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 text-center">
        <p className="text-xl">Loading your order...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-50 text-red-800 p-4 rounded-md mb-6">
          {error}
        </div>
        <Link to="/" className="text-blue-600 hover:text-blue-800">
          Return to Home
        </Link>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md mb-6">
          Order not found
        </div>
        <Link to="/" className="text-blue-600 hover:text-blue-800">
          Return to Home
        </Link>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-green-50 text-green-800 p-6 rounded-lg mb-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Thank You for Your Order!</h2>
        <p>A confirmation email has been sent to your email address.</p>
        <p className="mt-2">Order Number: <span className="font-mono font-bold">{order.id}</span></p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Order Details</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Shipping Information</h3>
              <p>{order.shipping.first_name} {order.shipping.last_name}</p>
              <p>{order.shipping.address}</p>
              <p>{order.shipping.city}, {order.shipping.postal_code}</p>
              <p>{order.shipping.country}</p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Order Summary</h3>
              <p>Order Date: {new Date(order.created_at).toLocaleDateString()}</p>
              <p>Status: <span className="capitalize">{order.status}</span></p>
              <p>Payment Method: Credit Card (ending in {order.payment.last_four})</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Items</h2>
        </div>
        
        <div className="divide-y">
          {order.items.map((item) => (
            <div key={item.id} className="p-6 flex items-center">
              <div className="w-16 h-16 flex-shrink-0 mr-4">
                <img 
                  src={item.product.image} 
                  alt={item.product.name}
                  className="w-full h-full object-cover rounded"
                />
              </div>
              
              <div className="flex-grow">
                <h3 className="font-medium">{item.product.name}</h3>
                <p className="text-sm text-gray-500">
                  Size: {item.size} | Qty: {item.quantity}
                </p>
              </div>
              
              <div className="font-medium">
                ${(parseFloat(item.product.price) * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-6 bg-gray-50">
          <div className="flex justify-between mb-2">
            <span>Subtotal</span>
            <span>${order.subtotal.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between mb-2">
            <span>Shipping</span>
            <span>${order.shipping_cost.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between font-bold text-lg border-t pt-4 mt-4">
            <span>Total</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <Link to="/" className="inline-block px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default OrderConfirmation;