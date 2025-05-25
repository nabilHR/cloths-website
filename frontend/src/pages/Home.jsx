import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch products from the API
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/products/');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
        // Use mock data if API fetch fails
        setProducts([
          {
            id: 1,
            name: "Classic White T-Shirt",
            price: 29.99,
            image: "/images/tshirt-white.jpg",
            sizes: ["S", "M", "L", "XL"]
          },
          {
            id: 2,
            name: "Black Denim Jeans",
            price: 59.99,
            image: "/images/jeans-black.jpg",
            sizes: ["30", "32", "34", "36"]
          },
          {
            id: 3,
            name: "Casual Striped Shirt",
            price: 45.99,
            image: "/images/shirt-striped.jpg",
            sizes: ["S", "M", "L"]
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading products...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Our Products</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

export default Home;