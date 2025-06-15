// In ProductCard.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import WishlistButton from './WishlistButton';

const formatSizes = (sizes) => {
  if (!sizes) return 'N/A';

  // If it's an array, join
  if (Array.isArray(sizes)) {
    return sizes.join(', ');
  }

  // If it's a string, clean up brackets, quotes, and newlines
  if (typeof sizes === 'string') {
    // Try JSON.parse first
    try {
      const parsed = JSON.parse(sizes);
      if (Array.isArray(parsed)) {
        return parsed.join(', ');
      }
      return String(parsed);
    } catch {
      // Remove brackets, quotes, and split by comma, newline, or space
      return sizes
        .replace(/[\[\]'"]/g, '')      // remove brackets and quotes
        .replace(/\r?\n/g, ',')        // replace newlines with commas
        .split(/,|\s+/)                // split by comma or whitespace
        .map(s => s.trim())
        .filter(Boolean)
        .join(', ');
    }
  }

  // Fallback for any other type
  return String(sizes);
};

function ProductCard({ product, minimal = false }) {
  const [isHovered, setIsHovered] = useState(false);
  const { addToCart } = useCart();
  
  // If product has multiple images, show first on hover
  const mainImage = product.image;
  const hoverImage = product.images?.length > 0 ? product.images[0].image : product.image;
  
  // Format sizes safely regardless of data type
  

  if (!product) return null;
  
  return (
    <div 
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/product/${product.slug}`}>
        <div className="bg-gray-100 w-full max-w-xs h-72 mx-auto rounded-xl shadow-md overflow-hidden flex items-center justify-center">
          <img
            src={isHovered && hoverImage ? hoverImage : mainImage}
            alt={product.name}
            className="w-full h-full object-cover transition-opacity group-hover:opacity-75"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/placeholders/product.jpg";
            }}
          />
        </div>
        
        {/* Zara-like minimal product info */}
        <div className="mt-2 flex flex-col items-start">
          <h3 className="text-sm text-gray-700">{product.name}</h3>
          <p className="mt-1 text-sm font-medium text-gray-900">{product.price} MAD</p>
          
          {!minimal && (
            <div className="mt-1 text-xs text-gray-500">
              {product.sizes && (
                <p className="mt-1 text-xs text-gray-500">
                  {formatSizes(product.sizes)}
                </p>
              )}
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
    </div>
  );
}

export default ProductCard;