import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StarRating from './StarRating';

function ReviewSection({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    rating: 5,
    images: []
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const navigate = useNavigate();
  
  // Fetch reviews for this product
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8000/api/reviews/?product=${productId}`);
        
        if (response.ok) {
          const data = await response.json();
          setReviews(data);
          
          // Check if user has already reviewed
          const token = localStorage.getItem('authToken');
          if (token) {
            const userResponse = await fetch(`http://localhost:8000/api/reviews/my-review/?product=${productId}`, {
              headers: {
                'Authorization': `Token ${token}`
              }
            });
            
            if (userResponse.ok) {
              const userData = await userResponse.json();
              if (userData.length > 0) {
                setUserReview(userData[0]);
              }
            }
          }
        } else {
          const errorData = await response.json();
          setError(errorData.detail || 'Failed to load reviews');
          console.error('Error response:', errorData);
        }
      } catch (err) {
        setError('Failed to load reviews. Please try again later.');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReviews();
  }, [productId]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle rating change
  const handleRatingChange = (newRating) => {
    setFormData({
      ...formData,
      rating: newRating
    });
  };
  
  // Handle image upload
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Limit to 3 images
    if (files.length > 3) {
      alert('You can upload up to 3 images');
      return;
    }
    
    setFormData({
      ...formData,
      images: files
    });
  };
  
  // Submit review
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('You must be logged in to leave a review');
        return;
      }
      
      const formDataToSend = new FormData();
      formDataToSend.append('product', productId);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('rating', formData.rating);
      
      formData.images.forEach(image => {
        formDataToSend.append('uploaded_images', image);
      });
      
      const response = await fetch('http://localhost:8000/api/reviews/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`
        },
        body: formDataToSend
      });
      
      if (response.ok) {
        const newReview = await response.json();
        setReviews([newReview, ...reviews]);
        setUserReview(newReview);
        setShowForm(false);
        setFormData({
          title: '',
          content: '',
          rating: 5,
          images: []
        });
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to submit review');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setSubmitLoading(false);
    }
  };
  
  // Sort reviews
  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at) - new Date(a.created_at);
    } else if (sortBy === 'highest') {
      return b.rating - a.rating;
    } else if (sortBy === 'lowest') {
      return a.rating - b.rating;
    }
    return 0;
  });
  
  if (loading) {
    return <div className="py-4">Loading reviews...</div>;
  }
  
  return (
    <div className="border-t border-gray-200 pt-8 mt-8">
      <h2 className="text-2xl font-medium mb-6">Customer Reviews</h2>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {/* Review summary */}
      <div className="flex flex-col md:flex-row justify-between mb-8">
        <div>
          <div className="flex items-center">
            <StarRating rating={reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length || 0} size="lg" />
            <span className="ml-2 text-lg">
              {(reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length || 0).toFixed(1)} out of 5
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{reviews.length} reviews</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          {!userReview && !showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800"
            >
              Write a Review
            </button>
          ) : userReview && !showForm ? (
            <div className="bg-green-50 text-green-700 p-4 rounded-md">
              You've already reviewed this product
            </div>
          ) : null}
        </div>
      </div>
      
      {/* Review form */}
      {showForm && (
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-medium mb-4">Write Your Review</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rating
              </label>
              <StarRating 
                rating={formData.rating} 
                size="lg"
                interactive={true}
                onChange={handleRatingChange}
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Review Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                placeholder="Summarize your experience"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Review Content
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                placeholder="Share details about your experience with this product"
              ></textarea>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add Photos (optional, max 3)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                Photos help other customers make better purchase decisions
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 disabled:bg-gray-400"
              >
                {submitLoading ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Sort options */}
      <div className="flex justify-end mb-4">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm"
        >
          <option value="newest">Most Recent</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
        </select>
      </div>
      
      {/* Reviews list */}
      {sortedReviews.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-md">
          <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedReviews.map(review => (
            <div key={review.id} className="border-b border-gray-200 pb-8">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium">{review.title}</h3>
                  <div className="flex items-center">
                    <StarRating rating={review.rating} />
                    <span className="ml-2 text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {review.user_email}
                  {review.is_verified_purchase && (
                    <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-md">
                      Verified Purchase
                    </span>
                  )}
                </div>
              </div>
              
              <p className="text-gray-700 mt-2">{review.content}</p>
              
              {/* Review images */}
              {review.images && review.images.length > 0 && (
                <div className="mt-4 flex space-x-2">
                  {review.images.map(image => (
                    <div key={image.id} className="w-20 h-20 overflow-hidden rounded-md">
                      <img 
                        src={image.image} 
                        alt="Review" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReviewSection;