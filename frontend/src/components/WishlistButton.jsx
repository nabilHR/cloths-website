import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext'; // Assuming you have AuthContext
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast'; // Or your preferred toast library

function WishlistButton({ productId, initialIsInWishlist, onToggle }) {
  const { isAuthenticated, user } = useAuth();
  const [isInWishlist, setIsInWishlist] = useState(initialIsInWishlist || false);
  const [wishlistItemId, setWishlistItemId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchWishlistStatus = useCallback(async () => {
    if (!isAuthenticated || !productId || !user) {
      setIsInWishlist(false);
      setWishlistItemId(null);
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8000/api/wishlist/check/${productId}/`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setIsInWishlist(data.in_wishlist);
        setWishlistItemId(data.in_wishlist ? data.wishlist_item_id : null);
      } else if (response.status === 404 && (await response.json()).detail === "Product not found.") {
        // Product might have been deleted, handle gracefully
        setIsInWishlist(false);
        setWishlistItemId(null);
         console.warn(`Wishlist check: Product ID ${productId} not found on backend.`);
      } else {
        console.error('Failed to fetch wishlist status:', response.status);
        // setIsInWishlist(false); // Optionally reset on error
        // setWishlistItemId(null);
      }
    } catch (error) {
      console.error('Error fetching wishlist status:', error);
    } finally {
      setLoading(false);
    }
  }, [productId, isAuthenticated, user]);

  useEffect(() => {
    fetchWishlistStatus();
  }, [fetchWishlistStatus]);


  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to manage your wishlist.');
      // Consider redirecting to login: history.push('/login');
      return;
    }
    if (loading) return;

    setLoading(true);
    const token = localStorage.getItem('authToken');
    let currentWishlistItemId = wishlistItemId;

    // If not in wishlist, try to fetch status again to get wishlistItemId if it was added elsewhere
    if (!isInWishlist && !currentWishlistItemId) {
        try {
            const checkResponse = await fetch(`http://localhost:8000/api/wishlist/check/${productId}/`, {
                headers: { 'Authorization': `Token ${token}`},
            });
            if (checkResponse.ok) {
                const data = await checkResponse.json();
                if (data.in_wishlist) {
                    currentWishlistItemId = data.wishlist_item_id;
                }
            }
        } catch (error) {
            console.error("Error re-checking wishlist status:", error);
        }
    }


    try {
      if (isInWishlist || currentWishlistItemId) { // If it is in wishlist or we found an ID
        // Remove from wishlist
        if (!currentWishlistItemId) {
            toast.error("Could not remove item: ID missing.");
            setLoading(false);
            return;
        }
        const response = await fetch(`http://localhost:8000/api/wishlist/${currentWishlistItemId}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Token ${token}`,
          },
        });
        if (response.ok) {
          setIsInWishlist(false);
          setWishlistItemId(null);
          toast.success('Removed from wishlist!');
          if (onToggle) onToggle(productId, false);
        } else {
          const errorData = await response.json();
          toast.error(errorData.detail || 'Failed to remove from wishlist.');
        }
      } else {
        // Add to wishlist
        const response = await fetch('http://localhost:8000/api/wishlist/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`,
          },
          body: JSON.stringify({ product_id: productId }),
        });
        if (response.status === 201 || response.status === 200) { // 200 if already exists and backend returns existing
          const data = await response.json();
          setIsInWishlist(true);
          setWishlistItemId(data.id); // Assuming response contains the created/existing wishlist item with its ID
          toast.success('Added to wishlist!');
          if (onToggle) onToggle(productId, true);
        } else {
          const errorData = await response.json();
          toast.error(errorData.detail || errorData.product_id || 'Failed to add to wishlist.');
        }
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const Icon = isInWishlist ? HeartSolid : HeartOutline;

  return (
    <button
      onClick={handleToggleWishlist}
      disabled={loading || !productId}
      className={`p-2 rounded-full transition-colors duration-200 ease-in-out focus:outline-none 
                  ${isInWishlist ? 'text-red-500 bg-red-100 hover:bg-red-200' : 'text-gray-500 hover:text-red-500 hover:bg-red-100'}`}
      aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
    </button>
  );
}

export default WishlistButton;