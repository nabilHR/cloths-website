import React, { useState, useEffect } from 'react';
import { showToast } from '../utils/toast';

function WishlistButton({ productId }) {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Check if product is in wishlist
    const checkWishlist = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      try {
        const response = await fetch(`http://localhost:8000/api/wishlist/check/${productId}/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsInWishlist(data.in_wishlist);
        }
      } catch (err) {
        console.error('Error checking wishlist:', err);
      }
    };
    
    checkWishlist();
  }, [productId]);
  
  const toggleWishlist = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      showToast.error('Please login to add items to your wishlist');
      return;
    }
    
    setLoading(true);
    const toastId = showToast.loading('Updating wishlist...');
    
    try {
      const method = isInWishlist ? 'DELETE' : 'POST';
      const url = isInWishlist 
        ? `http://localhost:8000/api/wishlist/${productId}/`
        : 'http://localhost:8000/api/wishlist/';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: isInWishlist ? null : JSON.stringify({ product: productId })
      });
      
      if (response.ok) {
        setIsInWishlist(!isInWishlist);
        showToast.dismiss(toastId);
        showToast.success(isInWishlist ? 'Removed from wishlist' : 'Added to wishlist');
      } else {
        throw new Error('Failed to update wishlist');
      }
    } catch (err) {
      console.error('Error toggling wishlist:', err);
      showToast.dismiss(toastId);
      showToast.error('Failed to update wishlist');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <button
      onClick={toggleWishlist}
      disabled={loading}
      className="bg-white rounded-full p-2 shadow-md hover:bg-gray-50 transition-colors focus:outline-none"
      aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
    >
      {loading ? (
        <svg className="h-6 w-6 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg
          className={`h-6 w-6 ${isInWishlist ? 'text-red-500 fill-current' : 'text-gray-400'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          ></path>
        </svg>
      )}
    </button>
  );
}

export default WishlistButton;