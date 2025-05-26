// In ProductCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function ProductCard({ product }) {
  return (
    <div className="border rounded-lg overflow-hidden hover:shadow-lg transition">
      <Link to={`/products/${product.id}`}>
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-64 object-cover"
        />
      </Link>
      <div className="p-4">
        <Link to={`/products/${product.id}`}>
          <h3 className="font-semibold text-lg hover:text-gray-700">{product.name}</h3>
        </Link>
        <p className="text-lg font-semibold">${parseFloat(product.price).toFixed(2)}</p>
        <Link 
          to={`/products/${product.id}`}
          className="mt-3 block text-center py-2 bg-black text-white rounded hover:bg-gray-800 transition"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}

export default ProductCard;