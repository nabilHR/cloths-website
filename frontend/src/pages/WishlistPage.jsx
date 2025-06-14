// WishlistPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { showToast } from '../utils/toast';

function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState([]);  // Initialize as empty array
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  
  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      const response = await fetch('http://localhost:8000/api/wishlist/', {
        headers: {
          'Authorization': `Token ${token}`  // Use Token prefix, not Bearer
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Handle both array and object responses
        const items = Array.isArray(data) ? data : (data.results || []);
        setWishlistItems(items);
      } else {
        console.error('Failed to fetch wishlist');
        setWishlistItems([]);  // Set empty array on error
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setWishlistItems([]);  // Set empty array on error
    } finally {
      setLoading(false);
    }
  };
  
  const removeFromWishlist = async (itemId) => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`http://localhost:8000/api/wishlist/${itemId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      if (response.ok) {
        setWishlistItems(prev => prev.filter(item => item.id !== itemId));
        showToast('Item removed from wishlist', 'success');
      } else {
        showToast('Failed to remove item', 'error');
      }
    } catch (err) {
      console.error('Error removing item:', err);
      showToast('Error removing item', 'error');
    }
  };
  
  const handleAddToCart = (product) => {
    addToCart(product, product.sizes[0], 1);
  };
  
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">My Wishlist</h1>
        <p>Loading your wishlist...</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">My Wishlist</h1>
      
      {Array.isArray(wishlistItems) && wishlistItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map(item => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <Link to={`/products/${item.product.id}`}>
                <div className="aspect-w-3 aspect-h-4 relative">
                  <img 
                    src={item.image || 'https://placehold.co/300x400'}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </Link>
              
              <div className="p-4">
                <Link to={`/products/${item.product.id}`}>
                  <h3 className="font-medium mb-1">{item.product.name}</h3>
                </Link>
                <p className="text-gray-800 mb-4">${parseFloat(item.product.price).toFixed(2)}</p>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAddToCart(item.product)}
                    className="flex-1 bg-black text-white py-2 rounded-md hover:bg-gray-800"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                    aria-label="Remove from wishlist"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500 mb-6">Your wishlist is empty</p>
          <Link 
            to="/" 
            className="inline-block bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800"
          >
            Continue Shopping
          </Link>
        </div>
      )}
    </div>
  );
}

export default WishlistPage;