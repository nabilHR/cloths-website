import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();
  const { totalItems } = useCart();
  
  // Check auth status when component mounts and when auth changes
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('authToken');
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (token) {
        setIsLoggedIn(true);
        setUserName(userData.firstName || userData.email?.split('@')[0] || 'User');
      } else {
        setIsLoggedIn(false);
        setUserName('');
      }
    };
    
    // Check initial state
    checkAuthStatus();
    
    // Listen for storage events (if user logs in/out in another tab)
    window.addEventListener('storage', checkAuthStatus);
    
    return () => {
      window.removeEventListener('storage', checkAuthStatus);
    };
  }, []);
  
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    navigate('/');
  };
  
  return (
    <nav className="bg-gray-800 text-white py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div>
          <Link to="/" className="text-xl font-bold">Cloths Store</Link>
        </div>

        <div className="flex items-center space-x-6">
          <Link to="/" className="hover:text-gray-300">Home</Link>
          <Link to="/cart" className="hover:text-gray-300 relative">
            Cart
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
          
          {isLoggedIn ? (
            <div className="relative group">
              <button className="hover:text-gray-300">
                Hello, {userName}
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 hidden group-hover:block z-10">
                <Link to="/profile" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">
                  My Profile
                </Link>
                <Link to="/orders" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">
                  My Orders
                </Link>
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="hover:text-gray-300">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;