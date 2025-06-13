import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function FilterBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const isFirstRender = useRef(true); // Moved to component top level
  
  // State for filters
  const [priceRange, setPriceRange] = useState({
    min: queryParams.get('min_price') || '',
    max: queryParams.get('max_price') || ''
  });
  const [selectedSize, setSelectedSize] = useState(queryParams.get('size') || '');
  const [selectedCategory, setSelectedCategory] = useState(queryParams.get('category') || '');
  const [sortBy, setSortBy] = useState(queryParams.get('sort_by') || 'newest');
  const [selectedColor, setSelectedColor] = useState(queryParams.get('color') || '');
  const [categories, setCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Available sizes
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  
  // Available colors
  const colors = [
    {name: 'Black', value: 'black', hex: '#000000'},
    {name: 'White', value: 'white', hex: '#ffffff'},
    {name: 'Red', value: 'red', hex: '#ef4444'},
    {name: 'Blue', value: 'blue', hex: '#3b82f6'},
    {name: 'Green', value: 'green', hex: '#22c55e'},
    // Add more colors as needed
  ];
  
  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/categories/');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Apply filters - COMPLETE IMPLEMENTATION
  const applyFilters = () => {
    const params = new URLSearchParams(location.search);
    
    // Debug output
    console.log("Applying filters with:", {
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      size: selectedSize,
      category: selectedCategory,
      sortBy: sortBy,
      color: selectedColor
    });
    
    // Update or remove price filters
    if (priceRange.min) {
      params.set('min_price', priceRange.min);
    } else {
      params.delete('min_price');
    }
    
    if (priceRange.max) {
      params.set('max_price', priceRange.max);
    } else {
      params.delete('max_price');
    }
    
    // Update size filter
    if (selectedSize) {
      params.set('size', selectedSize);
    } else {
      params.delete('size');
    }
    
    // Update category filter
    if (selectedCategory) {
      params.set('category', selectedCategory);
    } else {
      params.delete('category');
    }
    
    // Update sort option
    if (sortBy) {
      params.set('sort_by', sortBy);
    } else {
      params.delete('sort_by');
    }
    
    // Update color filter
    if (selectedColor) {
      params.set('color', selectedColor);
    } else {
      params.delete('color');
    }
    
    // Keep search query if it exists
    const searchQuery = queryParams.get('q');
    if (searchQuery) {
      params.set('q', searchQuery);
    }
    
    // Debug the final URL
    const newUrl = `${location.pathname}?${params.toString()}`;
    console.log("Navigating to:", newUrl);
    
    // Actually navigate to the new URL
    navigate(newUrl);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setPriceRange({ min: '', max: '' });
    setSelectedSize('');
    setSelectedCategory('');
    setSortBy('newest');
    setSelectedColor('');
    
    // Keep only the search query if it exists
    const params = new URLSearchParams();
    const searchQuery = queryParams.get('q');
    if (searchQuery) {
      params.set('q', searchQuery);
    }
    
    navigate(`${location.pathname}?${params.toString()}`);
  };
  
  // Apply filters with delay when values change - FIXED VERSION
  useEffect(() => {
    // Skip the first render to avoid immediate navigation on component mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    console.log('Filter values changed, will apply filters');
    const timer = setTimeout(() => {
      applyFilters();
    }, 500);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceRange, selectedSize, selectedCategory, sortBy, selectedColor]);
  
  return (
    <div className="md:w-64 md:flex-shrink-0 mb-8 md:mb-0 md:mr-8">
      {/* Mobile filter toggle */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 bg-white"
        >
          <span className="font-light uppercase tracking-wider text-sm">Filters</span>
          <svg 
            className={`h-4 w-4 transform ${showFilters ? 'rotate-180' : ''} transition-transform`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      
      {/* Filter sections - vertical layout */}
      <div className={`${showFilters ? 'block' : 'hidden'} md:block bg-white border border-gray-100 md:border-none`}>
        <div className="p-5">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-sm uppercase tracking-wider font-light">Filters</h2>
            <button 
              onClick={resetFilters}
              className="text-xs text-gray-500 hover:text-black transition-colors duration-200"
            >
              Reset all
            </button>
          </div>
          
          {/* Sort By - First section */}
          <div className="mb-8 pb-8 border-b border-gray-100">
            <h3 className="font-light text-xs uppercase tracking-wider mb-4">Sort By</h3>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full p-2 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors duration-200"
            >
              <option value="newest">Newest</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
            </select>
          </div>
          
          {/* Price Range */}
          <div className="mb-8 pb-8 border-b border-gray-100">
            <h3 className="font-light text-xs uppercase tracking-wider mb-4">Price Range</h3>
            <div className="flex space-x-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={priceRange.min}
                  onChange={(e) => {
                    // Only allow numbers and a single decimal point
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setPriceRange({...priceRange, min: value});
                      console.log("Set min price:", value);
                    }
                  }}
                  placeholder="Min"
                  className="w-full p-2 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors duration-200"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={priceRange.max}
                  onChange={(e) => {
                    // Only allow numbers and a single decimal point
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setPriceRange({...priceRange, max: value});
                      console.log("Set max price:", value);
                    }
                  }}
                  placeholder="Max"
                  className="w-full p-2 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors duration-200"
                />
              </div>
            </div>
          </div>
          
          {/* Sizes */}
          <div className="mb-8 pb-8 border-b border-gray-100">
            <h3 className="font-light text-xs uppercase tracking-wider mb-4">Sizes</h3>
            <div className="flex flex-wrap gap-2">
              {sizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(selectedSize === size ? '' : size)}
                  className={`min-w-[40px] h-10 flex items-center justify-center transition-all duration-200 ${
                    selectedSize === size
                      ? 'bg-black text-white' 
                      : 'bg-white text-black border border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <span className="text-xs">{size}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Categories */}
          <div className="mb-4">
            <h3 className="font-light text-xs uppercase tracking-wider mb-4">Categories</h3>
            <div className="max-h-60 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {categories.map(category => (
                <div key={category.id} className="flex items-center">
                  <input
                    type="radio"
                    id={`category-${category.id}`}
                    name="category"
                    checked={selectedCategory === category.id.toString()}
                    onChange={() => setSelectedCategory(category.id.toString())}
                    className="form-radio h-4 w-4 text-black border-gray-300 focus:ring-0 cursor-pointer"
                  />
                  <label 
                    htmlFor={`category-${category.id}`} 
                    className="ml-2 text-sm text-gray-700 cursor-pointer hover:text-black transition-colors duration-200"
                  >
                    {category.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Colors */}
          <div className="mb-8 pb-8 border-b border-gray-100">
            <h3 className="font-light text-xs uppercase tracking-wider mb-4">Colors</h3>
            <div className="flex flex-wrap gap-2">
              {colors.map(color => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(selectedColor === color.value ? '' : color.value)}
                  className={`w-8 h-8 rounded-full border hover:scale-110 transition-transform ${
                    selectedColor === color.value ? 'ring-2 ring-offset-2 ring-black' : ''
                  }`}
                  style={{backgroundColor: color.hex}}
                  title={color.name}
                />
              ))}
            </div>
          </div>
          
          {/* Apply Filters button - visible only on mobile */}
          <div className="mt-8 md:hidden">
            <button
              onClick={() => {
                applyFilters();
                setShowFilters(false);
              }}
              className="w-full bg-black text-white py-3 text-sm uppercase tracking-wider font-light"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FilterBar;