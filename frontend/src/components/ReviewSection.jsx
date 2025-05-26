import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ReviewSection({ productId, reviews, isLoggedIn, onReviewAdded }) {
  const [userReview, setUserReview] = useState({ rating: 5, comment: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleRatingChange = (rating) => {
    setUserReview(prev => ({ ...prev, rating }));
  };

  const handleCommentChange = (e) => {
    setUserReview(prev => ({ ...prev, comment: e.target.value }));
  };

  const submitReview = async (e) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      navigate('/login', { state: { from: `/products/${productId}` } });
      return;
    }
    
    if (!userReview.comment) {
      alert('Please add a comment to your review.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8000/api/reviews/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          product: productId,
          rating: userReview.rating,
          comment: userReview.comment
        })
      });
      
      if (response.ok) {
        // Reset form
        setUserReview({ rating: 5, comment: '' });
        // Notify parent to refresh reviews
        if (onReviewAdded) onReviewAdded();
      } else {
        const errorData = await response.json();
        if (errorData.non_field_errors?.includes('The fields product, user must make a unique set.')) {
          alert('You have already reviewed this product.');
        } else {
          alert('Failed to submit review. Please try again.');
        }
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
      
      {reviews.length > 0 ? (
        <div className="mb-8">
          <div className="mb-4">
            <span className="text-lg font-medium">
              {reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length} out of 5
            </span>
            <span className="text-gray-500 ml-2">
              ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
            </span>
          </div>
          
          <div className="space-y-6">
            {reviews.map(review => (
              <div key={review.id} className="border-b pb-6">
                <div className="flex items-center mb-2">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg 
                        key={i} 
                        className="w-5 h-5" 
                        fill={i < review.rating ? 'currentColor' : 'none'} 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                      </svg>
                    ))}
                  </div>
                  <span className="ml-2 font-medium">{review.user_name}</span>
                  <span className="ml-auto text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-gray-500 mb-8">No reviews yet. Be the first to review this product!</p>
      )}
      
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Write a Review</h3>
        
        {!isLoggedIn ? (
          <div>
            <p className="mb-4">Please <button onClick={() => navigate('/login', { state: { from: `/products/${productId}` } })} className="text-blue-600 underline">log in</button> to write a review.</p>
          </div>
        ) : (
          <form onSubmit={submitReview}>
            <div className="mb-4">
              <label className="block mb-2 font-medium">Rating</label>
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleRatingChange(i + 1)}
                    className="w-8 h-8 focus:outline-none"
                  >
                    <svg 
                      className="w-full h-full" 
                      fill={i < userReview.rating ? 'currentColor' : 'none'} 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                    </svg>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="comment" className="block mb-2 font-medium">Your Review</label>
              <textarea
                id="comment"
                rows="4"
                value={userReview.comment}
                onChange={handleCommentChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="What did you like or dislike about this product?"
                required
              ></textarea>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2 ${isSubmitting ? 'bg-gray-400' : 'bg-black hover:bg-gray-800'} text-white rounded-md transition`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ReviewSection;