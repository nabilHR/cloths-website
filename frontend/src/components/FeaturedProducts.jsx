import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/products/?featured=true&limit=6');
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Handle different response formats (with or without pagination)
        if (data.results && Array.isArray(data.results)) {
          setProducts(data.results);
        } else if (Array.isArray(data)) {
          setProducts(data);
        } else {
          console.error('Unexpected product data format:', data);
          setProducts([]);
        }
      } catch (err) {
        console.error('Error fetching featured products:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  if (loading) {
    return (
      <section className="py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-light mb-8 text-center">Featured Products</h2>
          <div className="text-center py-8">Loading featured products...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-light mb-8 text-center">Featured Products</h2>
          <div className="text-center py-8 text-red-500">Error: {error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-light mb-8 text-center">Featured Products</h2>
        
        {products.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No featured products available</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <Link key={product.id} to={`/product/${product.slug}`} className="group">
                <div className="mb-4 overflow-hidden">
                  <img 
                    src={product.image || 'https://via.placeholder.com/300x400'} 
                    alt={product.name}
                    className="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <h3 className="text-sm font-medium">{product.name}</h3>
                <p className="mt-1 text-sm font-medium">${product.price}</p>
              </Link>
            ))}
          </div>
        )}
        
        <div className="text-center mt-10">
          <Link 
            to="/products" 
            className="inline-block border border-black px-6 py-2 text-sm uppercase tracking-wider hover:bg-black hover:text-white transition-colors duration-300"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
}

export default FeaturedProducts;