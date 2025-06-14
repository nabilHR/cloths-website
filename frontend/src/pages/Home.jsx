import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import FeaturedProducts from '../components/FeaturedProducts';
import Hero from '../components/Hero';

function Home() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/categories/');
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Home categories data:', data);
        
        // Handle different response formats and filter out duplicates
        let allCategories = [];
        if (Array.isArray(data)) {
          allCategories = data;
        } else if (data.results && Array.isArray(data.results)) {
          allCategories = data.results;
        }
        
        // FILTER: Keep only the simple 'men', 'women', 'kids' categories
        const filteredCategories = allCategories.filter(cat => 
          ['men', 'women', 'kids'].includes(cat.slug)
        );
        
        setCategories(filteredCategories);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Safe filtering - only if categories is an array
  const featuredCategories = Array.isArray(categories) 
    ? categories
    : [];

  if (loading) {
    return <div className="py-20 text-center">Loading...</div>;
  }

  if (error) {
    return <div className="py-20 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div>
      {/* Hero Banner */}
      <Hero />
      
      {/* Featured Categories */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-light mb-8 text-center">Shop by Category</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredCategories.length > 0 ? (
              featuredCategories.map(category => (
                <Link 
                  key={category.id} 
                  to={`/category/${category.slug}`}
                  className="group"
                >
                  <div className="relative overflow-hidden flex justify-center items-center bg-gray-100 w-full max-w-xs h-80 mx-auto rounded-xl shadow-md">
                    <img
                      src={`/category-images/${category.slug}.jpg`}
                      alt={category.name}
                      className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 group-hover:bg-opacity-10 transition-all duration-300">
                      <span className="text-white text-2xl font-light">{category.name}</span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-3 text-center py-10">
                No featured categories found.
              </div>
            )}
          </div>
        </div>
      </section>
      
      {/* Featured Products Section */}
      <FeaturedProducts />
    </div>
  );
}

export default Home;