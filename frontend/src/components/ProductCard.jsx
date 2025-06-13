// In ProductCard.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import WishlistButton from './WishlistButton';

function ProductCard({ product, minimal = false }) {
  const [isHovered, setIsHovered] = useState(false);
  const { addToCart } = useCart();
  
  // If product has multiple images, show first on hover
  const mainImage = product.image;
  const hoverImage = product.images?.length > 0 ? product.images[0].image : product.image;
  
  return (
    <div 
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/product/${product.slug}`}>
        <div className="aspect-w-1 aspect-h-1 overflow-hidden bg-gray-100">
          <img
            src={isHovered && hoverImage ? hoverImage : mainImage}
            alt={product.name}
            className="object-cover w-full h-full transition-opacity group-hover:opacity-75"
          />
        </div>
        
        {/* Zara-like minimal product info */}
        <div className="mt-2 flex flex-col items-start">
          <h3 className="text-sm text-gray-700">{product.name}</h3>
          <p className="mt-1 text-sm font-medium text-gray-900">${product.price}</p>
          
          {!minimal && (
            <div className="mt-1 text-xs text-gray-500">
              {product.sizes.join(" / ")}
            </div>
          )}
        </div>
      </Link>
      
      {/* Quick add button - appears on hover */}
      {!minimal && (
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-center py-2 text-sm transition-all duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <button 
            onClick={(e) => {
              e.preventDefault();
              addToCart(product, product.sizes[0], 1);
            }}
            className="w-full h-full"
          >
            Add to Cart
          </button>
        </div>
      )}

      {/* Wishlist button - always visible */}
      <div className="absolute top-2 right-2 z-10">
        <WishlistButton 
          productId={product.id} 
          className="bg-white bg-opacity-80 rounded-full p-2 shadow-sm"
        />
      </div>

      {/* Quick view button - always visible */}
      <button 
        className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-sm"
        onClick={(e) => {
          e.preventDefault();
          setQuickViewProduct(product);
        }}
      >
        <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

export default ProductCard;