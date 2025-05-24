import React, { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard.jsx';

// Mock product data
const mockProducts = [
  {
    id: 1,
    name: 'T-Shirt',
    price: 19.99,
    image: 'https://via.placeholder.com/200x150?text=T-Shirt',
  },
  {
    id: 2,
    name: 'Jeans',
    price: 49.99,
    image: 'https://via.placeholder.com/200x150?text=Jeans',
  },
  {
    id: 3,
    name: 'Jacket',
    price: 89.99,
    image: 'https://via.placeholder.com/200x150?text=Jacket',
  },
];

function Home() {
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Men', 'Women', 'Accessories'];
  
  // Hero section component (defined inside Home function)
  const HeroSection = () => (
    <div className="bg-gray-900 text-white py-16 mb-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Summer Collection 2025</h1>
        <p className="text-xl max-w-xl mb-8">Discover the latest trends and styles for the season at unbeatable prices.</p>
        <button className="bg-white text-gray-900 px-6 py-3 rounded-md font-medium hover:bg-gray-100 transition">
          Shop Now
        </button>
      </div>
    </div>
  );

  useEffect(() => {
    console.log('Home component is rendering');
    // Simulate fetching data
    setProducts(mockProducts);
  }, []);

  return (
    <div>
      <HeroSection />
      
      <div className="container mx-auto px-4">
        {/* Category filters */}
        <div className="flex space-x-4 mb-8">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-md ${
                activeCategory === category 
                  ? 'bg-black text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        
        <h2 className="text-2xl font-bold mb-6">Featured Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;