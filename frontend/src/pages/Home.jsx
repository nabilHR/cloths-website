import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';

function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuredCategory, setFeaturedCategory] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/products/');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/categories/');
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchProducts();
    fetchCategories();
  }, []);

  // Group categories by gender
  const mainCategories = {
    "Men": categories.filter(cat => cat.name.startsWith("Men's")),
    "Women": categories.filter(cat => cat.name.startsWith("Women's")),
    "Kids": categories.filter(cat => cat.name.startsWith("Kids'"))
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-500">Loading collection...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <div className="relative h-[70vh] mb-16">
        <div className="absolute inset-0 bg-black">
          <img 
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070" 
            alt="Fashion hero" 
            className="w-full h-full object-cover opacity-90"
          />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <h1 className="text-5xl font-light tracking-wider mb-4">NEW COLLECTION</h1>
          <p className="text-xl font-light mb-8">Discover the latest trends</p>
          <Link 
            to="/category/womens-dresses" 
            className="border border-white px-8 py-3 hover:bg-white hover:text-black transition-colors"
          >
            SHOP NOW
          </Link>
        </div>
      </div>
      
      {/* Category Showcase */}
      <div className="mb-24">
        <h2 className="text-2xl font-light text-center mb-12 uppercase tracking-widest">Shop by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Object.entries(mainCategories).map(([gender, subcategories]) => (
            subcategories.length > 0 && (
              <div key={gender} className="relative group overflow-hidden h-96">
                <img 
                  src={`https://source.unsplash.com/random/?${gender.toLowerCase()},fashion`}
                  alt={`${gender}'s Collection`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white bg-opacity-80 px-10 py-5">
                    <Link 
                      to={`/category/${subcategories[0]?.slug || ''}`} 
                      className="text-xl uppercase tracking-widest font-light"
                    >
                      {gender}
                    </Link>
                  </div>
                </div>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Products Display - Minimal and Fancy */}
      <div className="mb-24">
        <h2 className="text-2xl font-light text-center mb-12 uppercase tracking-widest">New Arrivals</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.slice(0, 8).map(product => (
            <Link 
              key={product.id} 
              to={`/products/${product.id}`}
              className="group"
            >
              <div className="aspect-w-3 aspect-h-4 mb-2 overflow-hidden bg-gray-100">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="text-center">
                <h3 className="text-sm text-gray-700 font-light">{product.name}</h3>
                <p className="mt-1 text-sm font-medium">${parseFloat(product.price).toFixed(2)}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link 
            to="/category/all" 
            className="inline-block border border-black px-10 py-3 uppercase tracking-widest text-sm hover:bg-black hover:text-white transition-colors"
          >
            View All Products
          </Link>
        </div>
      </div>
      
      {/* Trend Spotlight */}
      <div className="mb-24 py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-light text-center mb-12 uppercase tracking-widest">Trending Now</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="aspect-w-4 aspect-h-5 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1920" 
                alt="Trending fashion" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col justify-center">
              <h3 className="text-3xl font-light mb-6">Summer Essentials</h3>
              <p className="text-gray-600 mb-8 font-light leading-relaxed">
                Discover our curated selection of lightweight pieces perfect for the season. 
                From breathable fabrics to effortless styles, find everything you need to stay 
                cool and fashionable.
              </p>
              <Link 
                to="/category/womens-dresses" 
                className="self-start border border-black px-8 py-3 uppercase tracking-widest text-sm hover:bg-black hover:text-white transition-colors"
              >
                Explore Collection
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;