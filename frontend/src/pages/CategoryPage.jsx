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
  
  // This is the critical part - fetch products when URL params change
  useEffect(() => {
    const fetchCategoryProducts = async () => {
      setLoading(true);
      try {
        let categoryId, subcategoryId;
        
        // First determine if we're looking at a main category or a subcategory
        const categoryResponse = await fetch(`http://localhost:8000/api/categories/?slug=${slug}`);
        
        if (!categoryResponse.ok) {
          throw new Error(`Error fetching category: ${categoryResponse.status}`);
        }
        
        const categoryData = await categoryResponse.json();
        
        // Only try to fetch subcategory if category not found
        if (categoryData.length === 0) {
          const subcategoryResponse = await fetch(`http://localhost:8000/api/subcategories/?slug=${slug}`);
          
          if (!subcategoryResponse.ok) {
            throw new Error(`Error fetching subcategory: ${subcategoryResponse.status}`);
          }
          
          const subcategoryData = await subcategoryResponse.json();
          
          if (subcategoryData.length > 0) {
            setCategory({
              ...subcategoryData[0],
              name: subcategoryData[0].name,
              parent_category: subcategoryData[0].category
            });
            subcategoryId = subcategoryData[0].id;
            categoryId = subcategoryData[0].category;
          } else {
            throw new Error('Category not found');
          }
        } else {
          setCategory(categoryData[0]);
          categoryId = categoryData[0].id;
        }
        
        // Build API params
        const apiParams = new URLSearchParams();
        
        // Ensure categoryId is a number and correctly set
        if (categoryId) {
          apiParams.set('category', categoryId.toString());
          
          // For debugging, log the exact URL you're calling
          console.log(`Fetching products with category ID: ${categoryId}`);
        }
        
        // If we're viewing a subcategory, add subcategory filter
        if (subcategoryId) {
          apiParams.set('subcategory', subcategoryId.toString());
        }
        
        // Add all other query parameters
        for (const [key, value] of queryParams.entries()) {
          if (!['category', 'subcategory'].includes(key)) {
            apiParams.set(key, value);
          }
        }
        
        console.log('Fetching products with params:', Object.fromEntries(apiParams));
        
        // Fetch filtered products
        const productsUrl = `http://localhost:8000/api/products/?${apiParams.toString()}`;
        const productsResponse = await fetch(productsUrl);
        
        if (!productsResponse.ok) {
          const errorText = await productsResponse.text();
          console.error('Server response:', errorText);
          throw new Error(`Failed to fetch products: ${productsResponse.status} ${productsResponse.statusText}`);
        }
        
        const productsData = await productsResponse.json();
        console.log(`Category ID: ${categoryId}, Products returned:`, productsData);
        
        // Log each product's category to verify
        if (Array.isArray(productsData)) {
          console.log("Product categories in response:", 
            productsData.map(p => ({id: p.id, name: p.name, category: p.category})));
        }

        setProducts(productsData.results || productsData || []);
      } catch (err) {
        console.error('Error details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategoryProducts();
  }, [slug, location.search]); // React to URL changes

  const handleFilterChange = (filters) => {
    console.log('Filters changed:', filters);
  };

  const testDirectApi = async () => {
    try {
      const testUrl = `http://localhost:8000/api/products/?category=${category?.id}&min_price=10&max_price=50`;
      console.log("Testing direct API call:", testUrl);
      
      const response = await fetch(testUrl);
      const data = await response.json();
      console.log(`Direct API test returned ${data.length} products`);
      
      // Update products directly
      setProducts(data);
    } catch (err) {
      console.error("Direct API test failed:", err);
    }
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
        <div className="text-red-500 p-4">
          {error}
        </div>
      </div>
    );
  }

  // Extract gender from category name
  const gender = category?.name?.startsWith("Men's") 
    ? "Men" 
    : category?.name?.startsWith("Women's") 
      ? "Women" 
      : "Kids";
  
  // Clean category name (remove gender prefix)
  const cleanCategoryName = category?.name?.replace(/^(Men's|Women's|Kids') /, '');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Category header - Zara style */}
      <div className="mb-12 text-center">
        <h2 className="text-sm uppercase tracking-wider mb-1">{gender}</h2>
        <h1 className="text-2xl font-light">{cleanCategoryName}</h1>
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
          
          <button 
            onClick={testDirectApi}
            className="px-4 py-2 bg-black text-white mb-4"
          >
            Test Price Filter (10-50)
          </button>
          
          <button 
            onClick={() => {
              const catId = category?.id;
              fetch(`http://localhost:8000/api/products/?category=${catId}`)
                .then(res => res.json())
                .then(data => {
                  console.log(`Direct API call with category=${catId} returned:`, data);
                  console.log("Products by category:", 
                    data.map(p => ({id: p.id, name: p.name, category: p.category})));
                })
                .catch(err => console.error("API test failed:", err));
            }}
            className="px-4 py-2 bg-black text-white mb-4 mr-2"
          >
            Test Current Category Filter
          </button>
          
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