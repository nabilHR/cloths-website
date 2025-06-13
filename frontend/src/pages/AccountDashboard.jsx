import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { showToast } from '../utils/toast';

function AccountDashboard() {
  const [userData, setUserData] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // First use localStorage data for immediate display
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        setUserData(storedUser);
        
        const token = localStorage.getItem('authToken');
        if (!token) return;
        
        // Fetch latest user data from API
        const response = await fetch('http://localhost:8000/api/users/me/', {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
          localStorage.setItem('user', JSON.stringify(data));
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    showToast.success('Logged out successfully');
    navigate('/login');
  };
  
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  const renderOverview = () => (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium">Welcome back, {userData?.first_name || 'Customer'}</h2>
          <button 
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-black"
          >
            Sign Out
          </button>
        </div>
        <p className="text-gray-600">
          From your account dashboard you can view your recent orders, manage your shipping addresses, 
          and edit your account details.
        </p>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Orders</h3>
            <span className="text-2xl text-gray-700">{recentOrders.length}</span>
          </div>
          <Link to="/order-history" className="text-blue-600 hover:underline text-sm">
            View all orders
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Wishlist</h3>
            <span className="text-2xl text-gray-700">{wishlistItems.length}</span>
          </div>
          <Link to="/wishlist" className="text-blue-600 hover:underline text-sm">
            View wishlist
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Addresses</h3>
            <span className="text-2xl text-gray-700">{addresses.length}</span>
          </div>
          <Link to="/addresses" className="text-blue-600 hover:underline text-sm">
            Manage addresses
          </Link>
        </div>
      </div>
      
      {/* Recent Orders */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium mb-4">Recent Orders</h3>
        
        {recentOrders.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${order.total}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/order-confirmation/${order.id}`} className="text-blue-600 hover:text-blue-900">
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 text-right">
              <Link to="/order-history" className="text-blue-600 hover:underline text-sm">
                View all orders →
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
            <Link to="/products" className="inline-block px-4 py-2 bg-black text-white rounded-md">
              Start Shopping
            </Link>
          </div>
        )}
      </div>
      
      {/* Wishlist Preview */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium mb-4">Wishlist</h3>
        
        {wishlistItems.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlistItems.slice(0, 3).map((item) => (
                <div key={item.id} className="group relative">
                  <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-md bg-gray-200 group-hover:opacity-75">
                    <img
                      src={item.product.image || 'https://via.placeholder.com/300x300'}
                      alt={item.product.name}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                  <div className="mt-4 flex justify-between">
                    <div>
                      <h3 className="text-sm text-gray-700">
                        <Link to={`/product/${item.product.slug}`}>
                          {item.product.name}
                        </Link>
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">${item.product.price}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-right">
              <Link to="/wishlist" className="text-blue-600 hover:underline text-sm">
                View full wishlist →
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500 mb-4">Your wishlist is empty.</p>
            <Link to="/products" className="inline-block px-4 py-2 bg-black text-white rounded-md">
              Discover Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
  
  const renderProfile = () => (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h2 className="text-xl font-medium mb-6">Account Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Name</h3>
          <p>{userData?.first_name} {userData?.last_name}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
          <p>{userData?.email}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Phone</h3>
          <p>{userData?.phone || 'Not provided'}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Member Since</h3>
          <p>{userData?.date_joined ? new Date(userData.date_joined).toLocaleDateString() : 'N/A'}</p>
        </div>
      </div>
      
      <div className="mt-8">
        <Link to="/profile/edit" className="inline-block px-4 py-2 bg-black text-white rounded-md">
          Edit Profile
        </Link>
      </div>
    </div>
  );
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-light mb-8">My Account</h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="md:w-1/4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 sticky top-24">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'overview' 
                    ? 'bg-gray-900 text-white' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Dashboard
              </button>
              
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'profile' 
                    ? 'bg-gray-900 text-white' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Profile
              </button>
              
              <Link
                to="/order-history"
                className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Orders
              </Link>
              
              <Link
                to="/addresses"
                className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Addresses
              </Link>
              
              <Link
                to="/wishlist"
                className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Wishlist
              </Link>
              
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Sign Out
              </button>
            </nav>
          </div>
        </div>
        
        {/* Main content */}
        <div className="md:w-3/4">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'profile' && renderProfile()}
        </div>
      </div>
    </div>
  );
}

export default AccountDashboard;