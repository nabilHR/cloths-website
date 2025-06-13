import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { showToast } from '../utils/toast';

function SearchPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('q') || '';
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    sort: 'relevance'
  });
  
  useEffect(() => {
    const fetchProducts = async () => {
      if (!query.trim()) {
        setProducts([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      // Build query parameters
      const apiParams = new URLSearchParams();
      apiParams.set('q', query);
      apiParams.set('page', currentPage);
      
      if (filters.category) apiParams.set('category', filters.category);
      if (filters.minPrice) apiParams.set('min_price', filters.minPrice);
      if (filters.maxPrice) apiParams.set('max_price', filters.maxPrice);
      
      if (filters.sort === 'price_asc') apiParams.set('ordering', 'price');
      else if (filters.sort === 'price_desc') apiParams.set('ordering', '-price');
      else if (filters.sort === 'newest') apiParams.set('ordering', '-created_at');
      
      try {
        const response = await fetch(`http://localhost:8000/api/products/search/?${apiParams.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Handle different response formats
        if (data.results && Array.isArray(data.results)) {
          setProducts(data.results);
          setTotalResults(data.count || 0);
          setTotalPages(data.total_pages || 1);
        } else if (Array.isArray(data)) {
          setProducts(data);
          setTotalResults(data.length);
          setTotalPages(Math.ceil(data.length / 12));
        } else {
          console.error('Unexpected product data format:', data);
          setProducts([]);
          setTotalResults(0);
          setTotalPages(1);
        }
      } catch (err) {
        console.error('Error searching products:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
    
    // Save search query to recent searches
    if (query.trim()) {
      try {
        const savedSearches = localStorage.getItem('recentSearches');
        const recentSearches = savedSearches ? JSON.parse(savedSearches) : [];
        
        const newRecentSearches = [
          query,
          ...recentSearches.filter(s => s !== query)
        ].slice(0, 5);
        
        localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));
      } catch (e) {
        console.error('Error saving recent search:', e);
      }
    }
  }, [query, currentPage, filters]);
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {query ? (
        <h1 className="text-3xl font-light mb-2">
          Search results for "{query}"
        </h1>
      ) : (
        <h1 className="text-3xl font-light mb-2">Search Products</h1>
      )}
      
      {totalResults > 0 && (
        <p className="text-gray-500 mb-8">
          {totalResults} product{totalResults !== 1 ? 's' : ''} found
        </p>
      )}
      
      {/* Search filters */}
      <div className="bg-gray-50 p-4 rounded-lg mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
            >
              <option value="">All Categories</option>
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="accessories">Accessories</option>
              <option value="shoes">Shoes</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 mb-1">
              Min Price
            </label>
            <input
              type="number"
              id="minPrice"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleFilterChange}
              min="0"
              placeholder="Min"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
            />
          </div>
          
          <div>
            <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 mb-1">
              Max Price
            </label>
            <input
              type="number"
              id="maxPrice"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleFilterChange}
              min="0"
              placeholder="Max"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
            />
          </div>
          
          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              id="sort"
              name="sort"
              value={filters.sort}
              onChange={handleFilterChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
            >
              <option value="relevance">Relevance</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Search results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 aspect-w-1 aspect-h-1 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md text-red-700 mb-8">
          <p>Error searching products: {error}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No results found</h3>
          <p className="mt-1 text-gray-500">We couldn't find any products matching "{query}".</p>
          <div className="mt-6">
            <Link to="/products" className="text-black underline">
              Browse all products
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <Link key={product.id} to={`/product/${product.slug}`} className="group">
                <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={product.image || 'https://via.placeholder.com/300x400'}
                    alt={product.name}
                    className="h-full w-full object-cover object-center group-hover:opacity-75"
                  />
                </div>
                <h3 className="mt-4 text-sm text-gray-700">{product.name}</h3>
                <p className="mt-1 text-lg font-medium text-gray-900">${product.price}</p>
              </Link>
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <nav className="flex items-center gap-1">
                <button 
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-8 h-8 flex items-center justify-center rounded-full ${
                      currentPage === page ? 'bg-black text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button 
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SearchPage;