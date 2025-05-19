import React, { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
console.log('Home component is rendering');
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

  useEffect(() => {
    // Simulate fetching data
    setProducts(mockProducts);
  }, []);

  return (
    <div>
      <h1>Products</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

export default Home;