import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import FilterBar from '../components/FilterBar';

function CategoryPage() {
  const { slug } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('grid'); // 'grid' or 'list'
  const [priceRange, setPriceRange] = useState({min: '', max: ''});
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  
  // Fetch products when URL params change
  useEffect(() => {
    const fetchCategoryProducts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch the category info based on slug
        const categoryResponse = await fetch(`http://localhost:8000/api/categories/?slug=${slug}`);
        const categoryData = await categoryResponse.json();
        
        // Check if we have results and it's an array or paginated results
        let foundCategory;
        if (categoryData.results && categoryData.results.length > 0) {
          foundCategory = categoryData.results[0];
        } else if (Array.isArray(categoryData) && categoryData.length > 0) {
          foundCategory = categoryData[0];
        } else {
          // No category found with this slug
          throw new Error(`Category with slug "${slug}" not found`);
        }
        
        // Set the category state
        setCategory(foundCategory);
        
        // Build API params
        const apiParams = new URLSearchParams();
        
        // Ensure we have a valid category ID before setting it
        if (foundCategory && foundCategory.id) {
          apiParams.set('category', foundCategory.id.toString());
        } else {
          throw new Error("Category ID not found");
        }
        
        // Add any other filter parameters
        for (const [key, value] of queryParams.entries()) {
          if (!['category', 'subcategory'].includes(key)) {
            apiParams.set(key, value);
          }
        }
        
        // Fetch filtered products
        const productsUrl = `http://localhost:8000/api/products/?${apiParams.toString()}`;
        const productsResponse = await fetch(productsUrl);
        
        if (!productsResponse.ok) {
          throw new Error(`Failed to fetch products: ${productsResponse.status} ${productsResponse.statusText}`);
        }
        
        const productsData = await productsResponse.json();
        setProducts(productsData.results || productsData || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategoryProducts();
  }, [slug, location.search]); // React to URL changes

  const handleFilterChange = (filters) => {
    // Handle filter changes
  };

  // Reset filters
  const resetFilters = () => {
    setPriceRange({min: '', max: ''});
    setSelectedSize('');
    setSelectedCategory('');
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="h-screen flex items-center justify-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md my-4">
          <h3 className="font-bold">Error Loading Products</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="mt-2 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // Simply use the category name directly
  const gender = category?.name || '';

  // No need for a separate cleaned name since our categories are already simple
  const cleanCategoryName = '';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Category header - Simplified */}
      <div className="mb-12 text-center">
        <h1 className="text-2xl font-medium">{category?.name || 'Products'}</h1>
      </div>
      
      {/* Main content with filters sidebar */}
      <div className="flex flex-col md:flex-row">
        {/* Filters - vertical sidebar */}
        <FilterBar onFilterChange={handleFilterChange} />
        
        {/* Products content */}
        <div className="flex-1">
          {/* View toggle and product count */}
          <div className="flex justify-between items-center mb-8">
            <div className="text-sm">{products.length} products</div>
            <div className="flex space-x-4">
              <button 
                onClick={() => setView('grid')}
                className={`focus:outline-none ${view === 'grid' ? 'text-black' : 'text-gray-400'}`}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zm-9 9h7v7H4v-7zm9 0h7v7h-7v-7z"></path>
                </svg>
              </button>
              <button 
                onClick={() => setView('list')}
                className={`focus:outline-none ${view === 'list' ? 'text-black' : 'text-gray-400'}`}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z"></path>
                </svg>
              </button>
            </div>
          </div>
          
          {/* Active filters display */}
          <div className="mb-4 flex flex-wrap gap-2">
            {Object.entries({
              'Price': priceRange.min || priceRange.max ? `$${priceRange.min || '0'} - $${priceRange.max || '∞'}` : null,
              'Size': selectedSize,
              'Category': categories.find(c => c.id.toString() === selectedCategory)?.name
            }).map(([key, value]) => value && (
              <div key={key} className="bg-gray-100 px-3 py-1 text-sm flex items-center">
                <span>{key}: {value}</span>
                <button 
                  onClick={() => {
                    if (key === 'Price') setPriceRange({min: '', max: ''});
                    if (key === 'Size') setSelectedSize('');
                    if (key === 'Category') setSelectedCategory('');
                  }}
                  className="ml-2 text-gray-500 hover:text-black"
                >
                  &times;
                </button>
              </div>
            ))}
            
            {(priceRange.min || priceRange.max || selectedSize || selectedCategory) && (
              <button 
                onClick={resetFilters}
                className="text-sm text-blue-600 hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
          
          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No products found in this category.</p>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {Array.isArray(products) && products.length > 0 ? (
                products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className="col-span-full text-center py-10">
                  <p className="text-gray-500">No products found matching your criteria.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {products.map(product => (
                <div key={product.id} className="flex border-b pb-6">
                  <div className="w-32 flex-shrink-0">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-40 object-cover"
                    />
                  </div>
                  <div className="ml-6 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-medium">{product.name}</h3>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{product.description}</p>
                    </div>
                    <div className="text-sm font-medium">${product.price}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CategoryPage;