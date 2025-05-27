import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StarRating from '../components/StarRating';

function AccountDashboard() {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login?redirect=account');
        return;
      }
      
      setLoading(true);
      
      try {
        // Fetch profile
        const profileResponse = await fetch('http://localhost:8000/api/users/profile/', {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setProfile(profileData);
        }
        
        // Fetch orders
        const ordersResponse = await fetch('http://localhost:8000/api/orders/', {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          setOrders(ordersData);
        }
        
        // Fetch addresses
        const addressesResponse = await fetch('http://localhost:8000/api/addresses/', {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        if (addressesResponse.ok) {
          const addressesData = await addressesResponse.json();
          setAddresses(addressesData);
        }
        
        // Fetch reviews
        const reviewsResponse = await fetch('http://localhost:8000/api/reviews/my-reviews/', {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          setReviews(reviewsData);
        }
      } catch (err) {
        setError('Failed to load account data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [navigate]);
  
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };
  
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">My Account</h1>
        <p>Loading your account information...</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">My Account</h1>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-600 font-medium">
                  {profile.first_name?.charAt(0) || profile.email?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <p className="font-medium">
                  {profile.first_name ? `${profile.first_name} ${profile.last_name}` : 'User'}
                </p>
                <p className="text-sm text-gray-500">{profile.email}</p>
              </div>
            </div>
            
            <div className="space-y-1">
              <button 
                onClick={() => setActiveTab('orders')}
                className={`w-full text-left px-3 py-2 rounded-md ${
                  activeTab === 'orders' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
                }`}
              >
                My Orders
              </button>
              <button 
                onClick={() => setActiveTab('addresses')}
                className={`w-full text-left px-3 py-2 rounded-md ${
                  activeTab === 'addresses' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
                }`}
              >
                Addresses
              </button>
              <button 
                onClick={() => setActiveTab('wishlist')}
                className={`w-full text-left px-3 py-2 rounded-md ${
                  activeTab === 'wishlist' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
                }`}
              >
                Wishlist
              </button>
              <button 
                onClick={() => setActiveTab('reviews')}
                className={`w-full text-left px-3 py-2 rounded-md ${
                  activeTab === 'reviews' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
                }`}
              >
                My Reviews
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`w-full text-left px-3 py-2 rounded-md ${
                  activeTab === 'settings' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
                }`}
              >
                Account Settings
              </button>
            </div>
            
            <div className="mt-6 pt-4 border-t">
              <button 
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1">
          {/* Orders tab */}
          {activeTab === 'orders' && (
            <div>
              <h2 className="text-xl font-medium mb-4">Order History</h2>
              
              {orders.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                  <p className="text-gray-500 mb-4">You haven't placed any orders yet</p>
                  <Link 
                    to="/" 
                    className="inline-block bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                      <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                        <div>
                          <span className="text-sm text-gray-500">Order placed</span>
                          <div className="font-medium">
                            {new Date(order.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Total</span>
                          <div className="font-medium">${order.total_price}</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Order #</span>
                          <div className="font-medium">{order.id}</div>
                        </div>
                        <div>
                          <span className={`px-3 py-1 rounded-full text-xs ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                        <Link 
                          to={`/order/${order.id}`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          View details
                        </Link>
                      </div>
                      
                      <div className="p-4">
                        {order.items.map(item => (
                          <div key={item.id} className="flex items-center py-2">
                            <div className="w-16 h-16 rounded-md overflow-hidden mr-4">
                              <img 
                                src={item.product.image} 
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <Link to={`/products/${item.product.id}`}>
                                <h3 className="font-medium">{item.product.name}</h3>
                              </Link>
                              <div className="text-sm text-gray-500">
                                Size: {item.size} | Quantity: {item.quantity}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">${item.price}</div>
                              {order.status === 'completed' && (
                                <Link 
                                  to={`/review/product/${item.product.id}`}
                                  className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                  Write a review
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Addresses tab */}
          {activeTab === 'addresses' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium">My Addresses</h2>
                <Link 
                  to="/addresses/add"
                  className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800"
                >
                  Add New Address
                </Link>
              </div>
              
              {addresses.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                  <p className="text-gray-500 mb-4">You haven't added any addresses yet</p>
                  <Link 
                    to="/addresses/add" 
                    className="inline-block bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800"
                  >
                    Add an Address
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map(address => (
                    <div key={address.id} className="bg-white rounded-lg shadow-sm p-4">
                      {address.is_default && (
                        <div className="text-sm text-green-600 mb-2">Default Address</div>
                      )}
                      
                      <div className="font-medium mb-1">
                        {address.first_name} {address.last_name}
                      </div>
                      <div className="text-gray-700">
                        {address.street}
                        <br />
                        {address.city}, {address.state} {address.postal_code}
                        <br />
                        {address.country}
                      </div>
                      <div className="text-gray-500 text-sm mt-1">
                        {address.phone}
                      </div>
                      
                      <div className="flex mt-4 space-x-2">
                        <Link 
                          to={`/addresses/edit/${address.id}`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </Link>
                        <button 
                          className="text-sm text-red-600 hover:text-red-800"
                          onClick={() => {/* Handle delete */}}
                        >
                          Delete
                        </button>
                        {!address.is_default && (
                          <button 
                            className="text-sm text-gray-600 hover:text-gray-800"
                            onClick={() => {/* Handle set as default */}}
                          >
                            Set as Default
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Reviews tab */}
          {activeTab === 'reviews' && (
            <div>
              <h2 className="text-xl font-medium mb-4">My Reviews</h2>
              
              {reviews.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                  <p className="text-gray-500 mb-4">You haven't written any reviews yet</p>
                  <Link 
                    to="/orders" 
                    className="inline-block bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800"
                  >
                    View Orders to Write Reviews
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map(review => (
                    <div key={review.id} className="bg-white rounded-lg shadow-sm p-4">
                      <div className="flex items-start">
                        <div className="w-16 h-16 rounded-md overflow-hidden mr-4">
                          <img 
                            src={review.product.image} 
                            alt={review.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <Link to={`/products/${review.product.id}`}>
                            <h3 className="font-medium">{review.product.name}</h3>
                          </Link>
                          <div className="flex items-center mt-1">
                            <StarRating rating={review.rating} />
                            <span className="ml-2 text-sm text-gray-500">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="font-medium mt-2">{review.title}</h4>
                          <p className="text-gray-700 mt-1">{review.content}</p>
                          
                          {review.images && review.images.length > 0 && (
                            <div className="mt-3 flex space-x-2">
                              {review.images.map(image => (
                                <div key={image.id} className="w-16 h-16 rounded-md overflow-hidden">
                                  <img 
                                    src={image.image} 
                                    alt="Review" 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <Link 
                            to={`/review/edit/${review.id}`}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Account Settings tab */}
          {activeTab === 'settings' && (
            <div>
              <h2 className="text-xl font-medium mb-4">Account Settings</h2>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-medium mb-4">Personal Information</h3>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        value={profile.first_name || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        value={profile.last_name || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={profile.email || ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Email address cannot be changed
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={profile.phone || ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="pt-4">
                    <button
                      type="submit"
                      className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
                
                <div className="mt-8 pt-6 border-t">
                  <h3 className="font-medium mb-4">Password</h3>
                  <button
                    className="text-blue-600 hover:text-blue-800"
                    onClick={() => {/* Open password change modal */}}
                  >
                    Change Password
                  </button>
                </div>
                
                <div className="mt-8 pt-6 border-t">
                  <h3 className="font-medium mb-4">Delete Account</h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button
                    className="text-red-600 hover:text-red-800"
                    onClick={() => {/* Open confirmation modal */}}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Wishlist tab */}
          {activeTab === 'wishlist' && (
            <div>
              <h2 className="text-xl font-medium mb-4">My Wishlist</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Wishlist items will go here */}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AccountDashboard;