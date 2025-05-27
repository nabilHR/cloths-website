import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';

function CategoryPage() {
  const { slug } = useParams();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      setLoading(true);
      try {
        // First get the category
        const categoryResponse = await fetch(`http://localhost:8000/api/categories/?slug=${slug}`);
        if (!categoryResponse.ok) {
          throw new Error('Category not found');
        }
        
        const categoryData = await categoryResponse.json();
        if (categoryData.length === 0) {
          throw new Error('Category not found');
        }
        
        setCategory(categoryData[0]);
        
        // Then get products in this category
        const productsResponse = await fetch(`http://localhost:8000/api/products/?category=${categoryData[0].id}`);
        if (!productsResponse.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const productsData = await productsResponse.json();
        setProducts(productsData);
        
      } catch (err) {
        setError(err.message);
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategoryProducts();
  }, [slug]);

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
      
      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No products found in this category.</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} minimal={true} />
          ))}
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
  );
}

export default CategoryPage;