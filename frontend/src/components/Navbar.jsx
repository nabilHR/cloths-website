import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/toast';
import '../styles/Navbar.css';
import SearchBar from './SearchBar';

function Navbar() {
  const { cartItems } = useCart();
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  // Calculate total items in cart
  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };
  
  // Fetch categories from backend
  useEffect(() => {
    // Fetch only the main categories
    fetch('http://localhost:8000/api/categories/')
      .then(res => res.json())
      .then(data => {
        console.log("Raw categories data:", data);
        
        // Handle different response formats
        let categoryList = [];
        if (data.results && Array.isArray(data.results)) {
          categoryList = data.results;
        } else if (Array.isArray(data)) {
          categoryList = data;
        }
        
        // IMPORTANT: Filter to only show Men, Women, Kids
        const mainCategories = categoryList.filter(cat => 
          ["men", "women", "kids"].includes(cat.slug.toLowerCase())
        );
        
        console.log("Filtered main categories:", mainCategories);
        setCategories(mainCategories);
      })
      .catch(err => {
        console.error("Error fetching categories:", err);
      });
  }, []);
  
  // Get user initial for profile button
  const getUserInitial = () => {
    if (user && user.first_name) {
      return user.first_name.charAt(0).toUpperCase();
    }
    if (user && user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };
  
  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    showToast.success('Logged out successfully');
    navigate('/');
  };
  
  const handleCategoryClick = (categoryId) => {
    // Just close the menu when category is clicked
    setIsMenuOpen(false);
  };
  
  const handleSubcategoryClick = (slug) => {
    navigate(`/category/${slug}`);
    setIsMenuOpen(false);
    setSelectedCategory(null);
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setShowSearch(false);
      setSearchTerm('');
    }
  };
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSearch && !event.target.closest('.search-container')) {
        setShowSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearch]);
  
  return (
    <>
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Left side: Menu button, Stylist, and Logo */}
            <div className="flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 mr-3 focus:outline-none hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Menu"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  ></path>
                </svg>
              </button>

              {/* Fancy Stylist text, clickable */}
              <Link
                to="/"
                className="font-serif italic font-bold text-2xl text-yellow-400 select-none hover:underline flex items-center"
                style={{ textDecorationThickness: '2px' }}
              >
                Stylist
                <img
                  src="/logo/logo.png"
                  alt="Logo"
                  className="w-36 h-auto object-contain ml-2"
                  style={{ maxHeight: '7.5rem' }}
                />
              </Link>
            </div>
            
            {/* Right side: Search, Login, Register, Cart */}
            <div className="flex items-center space-x-4">
              {/* Search Button */}
              <button 
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 focus:outline-none hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Search"
              >
                <svg 
                  className="h-5 w-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  ></path>
                </svg>
              </button>
              
              {/* Cart Button */}
              <Link 
                to="/cart" 
                className="relative p-2 focus:outline-none hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Cart"
              >
                <svg 
                  className="h-5 w-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  ></path>
                </svg>
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </Link>
              
              {/* Conditional rendering based on login state */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-800 text-white focus:outline-none"
                  >
                    {getUserInitial()}
                  </button>
                  
                  {/* Profile dropdown */}
                  {showProfileMenu && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      <Link to="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowProfileMenu(false)}>
                        Dashboard
                      </Link>
                      <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowProfileMenu(false)}>
                        Your Profile
                      </Link>
                      <Link to="/order-history" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowProfileMenu(false)}>
                        Orders
                      </Link>
                      <Link to="/wishlist" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowProfileMenu(false)}>
                        Wishlist
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>
        
        {/* Search Overlay */}
        {showSearch && (
          <div className="search-container fixed inset-0 z-50 bg-white bg-opacity-95 p-4 md:p-8">
            <div className="max-w-5xl mx-auto pt-16">
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => setShowSearch(false)}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              
              <SearchBar onClose={() => setShowSearch(false)} />
            </div>
          </div>
        )}

        {/* Enhanced Category Menu */}
        <div
          className={`fixed inset-0 z-50 transform ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } transition-transform duration-300 ease-in-out`}
        >
          {/* Dark overlay behind menu */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
            onClick={() => setIsMenuOpen(false)}
          ></div>
          
          {/* Menu sidebar */}
          <div className="absolute inset-y-0 left-0 max-w-xs w-full bg-white shadow-xl flex flex-col transform transition-all duration-300">
            {/* Menu header */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-medium">Browse Categories</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 focus:outline-none transition-colors"
                aria-label="Close menu"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>

            {/* Categories section */}
            <div className="flex-1 overflow-y-auto">
              <nav className="p-6 space-y-6">
                {categories && categories.length > 0 ? (
                  categories.map((category) => (
                    <div key={category.id} className="category-item">
                      {/* Direct link to category without dropdown */}
                      <Link
                        to={`/category/${category.slug}`}
                        className="category-button w-full text-left py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors flex items-center"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span className="text-lg font-medium">{category.name}</span>
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No categories available</p>
                )}
              </nav>
            </div>
            
            {/* Menu footer with login/register links */}
            <div className="border-t border-gray-200 p-6">
              <div className="grid grid-cols-2 gap-4">
                <Link 
                  to="/login" 
                  className="flex items-center justify-center py-3 px-4 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="flex items-center justify-center py-3 px-4 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                  </svg>
                  Register
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Page content padding to account for fixed header */}
      <div className="pt-16"></div>
    </>
  );
}

export default Navbar;