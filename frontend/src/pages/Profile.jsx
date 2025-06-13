import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Profile() {
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    try {
      // Get user data from localStorage
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      console.log("Parsed user data:", storedUser);
      
      // Set userData from localStorage as initial data
      setUserData(storedUser);
      
      // Fetch complete user data from API
      const fetchUserData = async () => {
        try {
          const token = localStorage.getItem('authToken');
          if (!token) return;
          
          const response = await fetch('http://localhost:8000/api/users/me/', {
            headers: {
              'Authorization': `Token ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log("API user data:", data);
            setUserData(data);
            
            // Update localStorage with complete data
            localStorage.setItem('user', JSON.stringify(data));
          }
        } catch (error) {
          console.error("API fetch error:", error);
        }
      };
      
      fetchUserData();
    } catch (error) {
      console.error("Error parsing user data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const renderProfileContent = () => {
    // Debug current userData state
    console.log("Rendering profile with userData:", userData);
    
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-gray-500 text-sm">First Name</h3>
            <p className="font-medium">{userData.first_name || 'Not provided'}</p>
          </div>
          <div>
            <h3 className="text-gray-500 text-sm">Last Name</h3>
            <p className="font-medium">{userData.last_name || 'Not provided'}</p>
          </div>
          <div>
            <h3 className="text-gray-500 text-sm">Email</h3>
            <p className="font-medium">{userData.email || 'Not provided'}</p>
          </div>
          <div>
            <h3 className="text-gray-500 text-sm">Username</h3>
            <p className="font-medium">{userData.username || 'Not provided'}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderOrdersContent = () => {
    if (!Array.isArray(orders) || orders.length === 0) {
      return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">You haven't placed any orders yet.</p>
            <Link to="/" className="text-blue-600 hover:underline">Browse products</Link>
          </div>
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
                  <p className="text-sm text-gray-600">
                    Total: ${order.total || 'N/A'}
                  </p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {order.status || 'Processing'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderAccountManagement = () => (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-6">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold">Account Management</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link 
            to="/addresses" 
            className="p-4 border rounded-md hover:bg-gray-50 flex items-center"
          >
            <div className="mr-4 text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">Shipping Addresses</h3>
              <p className="text-sm text-gray-500">Manage your saved addresses</p>
            </div>
          </Link>
          
          <Link 
            to="/order-history" 
            className="p-4 border rounded-md hover:bg-gray-50 flex items-center"
          >
            <div className="mr-4 text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">Order History</h3>
              <p className="text-sm text-gray-500">View your past orders</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4">
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

      {renderAccountManagement()}
    </div>
  );
}

export default Profile;