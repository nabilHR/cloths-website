import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../utils/toast';

function SearchBar({ onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
    
    // Load recent searches from localStorage
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches).slice(0, 5));
      } catch (e) {
        console.error('Error parsing recent searches:', e);
      }
    }
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle search term changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchTerm.trim() || searchTerm.length < 2) {
        setSuggestions([]);
        return;
      }
      
      setLoading(true);
      
      try {
        const response = await fetch(
          `http://localhost:8000/api/products/search-suggestions/?q=${encodeURIComponent(searchTerm)}`
        );
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setSuggestions(data.slice(0, 8)); // Limit to 8 suggestions
      } catch (err) {
        console.error('Error fetching search suggestions:', err);
      } finally {
        setLoading(false);
      }
    };
    
    // Debounce the API call
    const timeoutId = setTimeout(() => {
      fetchSuggestions();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSearch = (term) => {
    if (!term.trim()) return;
    
    // Save to recent searches
    const newRecentSearches = [
      term,
      ...recentSearches.filter(s => s !== term)
    ].slice(0, 5);
    
    setRecentSearches(newRecentSearches);
    localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));
    
    // Navigate to search results
    navigate(`/search?q=${encodeURIComponent(term)}`);
    
    // Close the search modal
    if (onClose) onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(searchTerm);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center border-b border-gray-300 focus-within:border-black transition-colors">
          <svg 
            className="h-5 w-5 text-gray-400 mr-3" 
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
          
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for products, brands, and more..."
            className="w-full py-3 outline-none text-lg"
          />
          
          {searchTerm && (
            <button 
              type="button"
              onClick={() => setSearchTerm('')}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          )}
        </div>
        
        {/* Suggestions Dropdown */}
        {(suggestions.length > 0 || recentSearches.length > 0) && (
          <div 
            ref={suggestionsRef}
            className="absolute left-0 right-0 mt-1 bg-white shadow-lg rounded-md z-50 max-h-96 overflow-y-auto"
          >
            {loading && (
              <div className="p-4 text-center text-gray-500">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-black mr-2"></div>
                Loading suggestions...
              </div>
            )}
            
            {/* Recent Searches */}
            {!loading && recentSearches.length > 0 && (
              <div className="p-2 border-b border-gray-100">
                <div className="flex justify-between items-center px-2 py-1">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Recent Searches</h3>
                  <button 
                    onClick={clearRecentSearches}
                    className="text-xs text-gray-500 hover:text-black"
                  >
                    Clear
                  </button>
                </div>
                {recentSearches.map((term, i) => (
                  <button
                    key={`recent-${i}`}
                    onClick={() => handleSearch(term)}
                    className="flex items-center w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    {term}
                  </button>
                ))}
              </div>
            )}
            
            {/* Product Suggestions */}
            {!loading && suggestions.length > 0 && (
              <div className="p-2">
                <h3 className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">Suggestions</h3>
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigate(`/product/${item.slug}`);
                      if (onClose) onClose();
                    }}
                    className="flex items-center w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    {item.image && (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-10 h-10 object-cover rounded mr-3"
                      />
                    )}
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">${item.price}</div>
                    </div>
                  </button>
                ))}
                
                {/* See all results button */}
                <button
                  onClick={() => handleSearch(searchTerm)}
                  className="flex items-center justify-between w-full text-left px-4 py-2 mt-1 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  <span>See all results for "{searchTerm}"</span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </form>
      
      {/* Search shortcuts */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Popular Categories</h3>
        <div className="flex flex-wrap gap-2">
          {['Men', 'Women', 'Shoes', 'Accessories', 'Sale'].map((category) => (
            <button
              key={category}
              onClick={() => navigate(`/category/${category.toLowerCase()}`)}
              className="px-4 py-2 bg-gray-100 rounded-full text-sm hover:bg-gray-200 transition-colors"
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SearchBar;