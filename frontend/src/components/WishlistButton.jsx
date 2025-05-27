import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function WishlistButton({ productId, className }) {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if product is in wishlist
    const checkWishlist = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      try {
        const response = await fetch('http://localhost:8000/api/wishlist/', {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsInWishlist(data.some(item => item.product.id === productId));
        }
      } catch (err) {
        console.error('Error checking wishlist:', err);
      }
    };
    
    checkWishlist();
  }, [productId]);
  
  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      navigate('/login?redirect=product/' + productId);
      return;
    }
    
    setLoading(true);
    
    try {
      if (isInWishlist) {
        // Find the wishlist item ID
        const response = await fetch('http://localhost:8000/api/wishlist/', {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const wishlistItem = data.find(item => item.product.id === productId);
          
          if (wishlistItem) {
            // Remove from wishlist
            await fetch(`http://localhost:8000/api/wishlist/${wishlistItem.id}/`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Token ${token}`
              }
            });
            
            setIsInWishlist(false);
          }
        }
      } else {
        // Add to wishlist
        await fetch('http://localhost:8000/api/wishlist/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
          },
          body: JSON.stringify({ product_id: productId })
        });
        
        setIsInWishlist(true);
      }
    } catch (err) {
      console.error('Error updating wishlist:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <button 
      onClick={toggleWishlist}
      disabled={loading}
      className={className || "text-gray-700 hover:text-black focus:outline-none"}
      aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
    >
      {isInWishlist ? (
        <svg className="h-6 w-6 fill-current text-red-500" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ) : (
        <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      )}
    </button>
  );
}

export default WishlistButton;