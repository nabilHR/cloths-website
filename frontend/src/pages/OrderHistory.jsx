import React, { useEffect, useState } from 'react';

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch('http://localhost:8000/api/orders/', {
          headers: {
            'Authorization': `Token ${localStorage.getItem('authToken')}`
          }
        });
        const data = await response.json();
        if (Array.isArray(data)) {
          setOrders(data);
        } else if (Array.isArray(data.results)) {
          setOrders(data.results);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  if (loading) return <div>Loading orders...</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">My Orders</h2>
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="border rounded p-4 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Order #{order.id}</span>
                <span className="text-sm text-gray-500">{order.created_at ? new Date(order.created_at).toLocaleString() : ''}</span>
              </div>
              <div className="mb-2">
                <span className="text-sm">Status: <span className="font-medium">{order.status || 'N/A'}</span></span>
              </div>
              <div className="mb-2">
                <span className="text-sm">Total: <span className="font-medium">${order.total}</span></span>
              </div>
              {order.items && order.items.length > 0 && (
                <div className="mb-2">
                  <span className="text-sm font-semibold">Items:</span>
                  <ul className="ml-4 list-disc">
                    {order.items.map(item => (
                      <li key={item.id} className="text-sm flex items-center gap-2">
                        {item.product_image && (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <span>
                          {item.quantity} x {item.product_name || 'Product'}
                          {item.size ? ` (${item.size})` : ''} {item.color ? `- ${item.color}` : ''}
                          {item.product_price && (
                            <> — <span className="text-gray-500">${item.product_price}</span></>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="text-xs text-gray-400">
                Shipping: {order.shipping_address}, {order.shipping_city}, {order.shipping_country}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrderHistory;