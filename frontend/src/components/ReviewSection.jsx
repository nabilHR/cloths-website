import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { showToast } from '../utils/toast';

function ReviewSection({ productId, isLoggedIn }) {
  const [reviews, setReviews] = useState([]);  // Initialize as empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newReview, setNewReview] = useState({ rating: 5, title: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!productId) return;
      
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8000/api/reviews/?product=${productId}`);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Handle different response formats
        if (Array.isArray(data)) {
          setReviews(data);
        } else if (data.results && Array.isArray(data.results)) {
          setReviews(data.results);
        } else {
          console.error('Unexpected reviews data format:', data);
          setReviews([]); // Ensure reviews is an array
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError(err.message);
        setReviews([]); // Ensure reviews is an array even on error
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [productId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewReview(prev => ({ ...prev, [name]: value }));
  };

  const handleRatingChange = (rating) => {
    setNewReview(prev => ({ ...prev, rating }));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    // Check authentication before attempting to submit
    const token = localStorage.getItem('authToken');
    if (!token) {
      showToast.error('Please log in to submit a review');
      return;
    }
    
    // Validate inputs
    if (!newReview.title.trim()) {
      showToast.error('Please enter a review title');
      return;
    }
    
    if (!newReview.comment.trim()) {
      showToast.error('Please enter a review comment');
      return;
    }
    
    if (!productId || isNaN(parseInt(productId, 10))) {
      showToast.error('Invalid product ID');
      return;
    }
    
    setSubmitting(true);
    const toastId = showToast.loading('Submitting your review...');
    
    try {
      // Ensure all required fields are included
      const reviewData = {
        product: parseInt(productId, 10),
        rating: parseInt(newReview.rating, 10),
        title: newReview.title.trim(),
        content: newReview.comment.trim()
      };

      console.log('Sending review data:', reviewData);

      const response = await fetch('http://localhost:8000/api/reviews/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(reviewData)
      });
      
      // Get the response content first as text
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      // Try to parse as JSON if possible
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log('Response data:', responseData);
      } catch (e) {
        console.log('Response is not JSON');
      }
      
      if (!response.ok) {
        // Use the parsed JSON error if available
        if (responseData) {
          const errorMessage = Object.entries(responseData)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('; ');
          throw new Error(`Error (${response.status}): ${errorMessage}`);
        } else {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
      }
      
      // Success - use the parsed data if available
      const data = responseData || { 
        id: Date.now(), 
        rating: reviewData.rating,
        title: reviewData.title,
        content: reviewData.content,
        created_at: new Date().toISOString(),
        user_name: 'You'
      };
      
      // Add the new review to the list
      setReviews(prev => [data, ...prev]);
      
      // Reset the form
      setNewReview({ rating: 5, title: '', comment: '' });
      
      showToast.dismiss(toastId);
      showToast.success('Review submitted successfully!');
    } catch (err) {
      console.error('Error submitting review:', err);
      showToast.dismiss(toastId);
      showToast.error(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-16">
      <h2 className="text-2xl font-light mb-8">Customer Reviews</h2>
      
      {/* Add Review Form - Show at top for better visibility */}
      {isLoggedIn && (
        <div className="mb-12 bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Write a Review</h3>
          <form onSubmit={handleSubmitReview}>
            {/* Rating Selection */}
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Rating</label>
              <div className="flex text-2xl text-yellow-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingChange(star)}
                    className="focus:outline-none mr-1"
                  >
                    {star <= newReview.rating ? '★' : '☆'}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Review Title - New field added */}
            <div className="mb-4">
              <label htmlFor="title" className="block text-gray-700 mb-2">Review Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={newReview.title}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Summarize your review in a short title"
              />
            </div>
            
            {/* Review Comment */}
            <div className="mb-4">
              <label htmlFor="comment" className="block text-gray-700 mb-2">Your Review</label>
              <textarea
                id="comment"
                name="comment"
                value={newReview.comment}
                onChange={handleInputChange}
                rows="4"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Share your experience with this product..."
              ></textarea>
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-400"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      )}
      
      {/* Reviews List */}
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md text-red-700">
          <p>Error loading reviews: {error}</p>
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-8">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-6">
              <div className="flex items-center mb-2">
                <div className="flex text-yellow-400 mr-2">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>
                      {i < review.rating ? '★' : '☆'}
                    </span>
                  ))}
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm font-bold mb-1">{review.title}</p>
              <p className="text-sm font-medium mb-1">{review.user_name || 'Anonymous'}</p>
              <p className="text-gray-700">{review.content || review.comment}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No reviews yet. Be the first to review this product!</p>
          {!isLoggedIn && (
            <Link to="/login" className="text-blue-600 hover:underline">
              Sign in to leave a review
            </Link>
          )}
        </div>
      )}
      
     
    </div>
  );
}

export default ReviewSection;