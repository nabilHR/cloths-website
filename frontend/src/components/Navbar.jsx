import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function Navbar() {
  const { cartItems } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  
  // Calculate total items in cart
  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };
  
  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/categories/');
        if (response.ok) {
          const data = await response.json();
          
          // Group categories by gender
          const menCategories = data.filter(cat => cat.name.startsWith("Men's"));
          const womenCategories = data.filter(cat => cat.name.startsWith("Women's"));
          const kidsCategories = data.filter(cat => cat.name.startsWith("Kids'"));
          
          setCategories([
            {
              id: 'men',
              name: 'Men',
              subcategories: menCategories.map(cat => ({
                id: cat.id,
                name: cat.name.replace("Men's ", ""),
                slug: cat.slug
              }))
            },
            {
              id: 'women',
              name: 'Women',
              subcategories: womenCategories.map(cat => ({
                id: cat.id,
                name: cat.name.replace("Women's ", ""),
                slug: cat.slug
              }))
            },
            {
              id: 'kids',
              name: 'Kids',
              subcategories: kidsCategories.map(cat => ({
                id: cat.id,
                name: cat.name.replace("Kids' ", ""),
                slug: cat.slug
              }))
            }
          ]);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    
    fetchCategories();
  }, []);
  
  const handleCategoryClick = (categoryId) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(categoryId);
    }
  };
  
  const handleSubcategoryClick = (slug) => {
    navigate(`/category/${slug}`);
    setIsMenuOpen(false);
    setSelectedCategory(null);
  };
  
  return (
    <>
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 focus:outline-none"
              aria-label="Menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            
            {/* Logo */}
            <Link to="/" className="font-bold text-xl">STORE</Link>
            
            {/* Right side links */}
            <div className="flex items-center space-x-4">
              <Link to="/search" className="p-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </Link>
              
              <Link to="/account" className="p-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </Link>
              
              <Link to="/cart" className="p-2 relative">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                </svg>
                {getTotalItems() > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 bg-black text-white rounded-full text-xs flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </Link>

              {/* Wishlist Link */}
              <Link to="/wishlist" className="p-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Sidebar Menu - Zara style */}
      <div 
        className={`fixed inset-0 z-50 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}
      >
        <div className="absolute inset-0 bg-black bg-opacity-25" onClick={() => setIsMenuOpen(false)}></div>
        <div className="absolute inset-y-0 left-0 max-w-xs w-full bg-white shadow-xl flex flex-col">
          {/* Close button */}
          <div className="p-4 flex justify-end">
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="p-2 focus:outline-none"
              aria-label="Close menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          {/* Categories */}
          <div className="flex-1 overflow-y-auto">
            <nav className="px-6 pt-6 pb-16 space-y-8 text-sm">
              {categories.map(category => (
                <div key={category.id} className="space-y-3">
                  <button 
                    onClick={() => handleCategoryClick(category.id)}
                    className="font-medium uppercase text-lg block hover:text-gray-500 focus:outline-none"
                  >
                    {category.name}
                  </button>
                  
                  {selectedCategory === category.id && (
                    <div className="ml-4 space-y-2">
                      {category.subcategories.map(subcategory => (
                        <button
                          key={subcategory.id}
                          onClick={() => handleSubcategoryClick(subcategory.slug)}
                          className="block w-full text-left py-1 hover:text-gray-500"
                        >
                          {subcategory.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Additional links */}
              <div className="pt-8 space-y-3">
                <Link to="/new-arrivals" className="block text-gray-500">New Arrivals</Link>
                <Link to="/sale" className="block text-gray-500">Sale</Link>
                <Link to="/join-newsletter" className="block text-gray-500">Join Newsletter</Link>
              </div>
            </nav>
          </div>
        </div>
      </div>
      
      {/* Page content padding to account for fixed header */}
      <div className="pt-16"></div>
    </>
  );
}

export default Navbar;