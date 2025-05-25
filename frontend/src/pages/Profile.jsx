import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Profile() {
  const [userData, setUserData] = useState({});
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    // Get user data from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserData(user);
    
    // Fetch user orders if on orders tab
    if (activeTab === 'orders') {
      fetchOrders();
    }
    
    setLoading(false);
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      const response = await fetch('http://localhost:8000/api/orders/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const renderProfileContent = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-gray-500 text-sm">First Name</h3>
          <p className="font-medium">{userData.firstName || 'Not provided'}</p>
        </div>
        <div>
          <h3 className="text-gray-500 text-sm">Last Name</h3>
          <p className="font-medium">{userData.lastName || 'Not provided'}</p>
        </div>
        <div>
          <h3 className="text-gray-500 text-sm">Email</h3>
          <p className="font-medium">{userData.email}</p>
        </div>
      </div>
    </div>
  );

  const renderOrdersContent = () => {
    if (orders.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">You haven't placed any orders yet.</p>
          <Link to="/" className="text-blue-600 hover:underline">Browse products</Link>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-sm">
        <ul className="divide-y">
          {orders.map(order => (
            <li key={order.id} className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Order #{order.id}</p>
                  <p className="text-sm text-gray-500">
                    Placed on {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {order.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">My Account</h1>
      
      <div className="flex border-b mb-6">
        <button 
          onClick={() => setActiveTab('profile')}
          className={`pb-2 px-4 ${activeTab === 'profile' 
            ? 'border-b-2 border-black font-medium' 
            : 'text-gray-500'}`}
        >
          Profile
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={`pb-2 px-4 ${activeTab === 'orders' 
            ? 'border-b-2 border-black font-medium' 
            : 'text-gray-500'}`}
        >
          Orders
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        activeTab === 'profile' ? renderProfileContent() : renderOrdersContent()
      )}
    </div>
  );
}

export default Profile;