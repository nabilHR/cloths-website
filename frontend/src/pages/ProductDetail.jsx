import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import ReviewSection from '../components/ReviewSection';

function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/products/${id}/`);
        if (response.ok) {
          const data = await response.json();
          setProduct(data);
          if (data.sizes && data.sizes.length > 0) {
            setSelectedSize(data.sizes[0]);
          }
        } else {
          setError('Product not found');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Error loading product');
      } finally {
        setLoading(false);
      }
    };
    // f4aa8de34b30b865844680bded4ec377e376abf8

    const fetchReviews = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/reviews/?product=${id}`);
        if (response.ok) {
          const data = await response.json();
          setReviews(data);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    };

    fetchProduct();
    fetchReviews();
  }, [id]);

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert('Please select a size');
      return;
    }
    
    addToCart({
      ...product,
      quantity,
      size: selectedSize,
    });
  };

  if (loading) {
    return <div className="text-center py-12">Loading product...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">{error}</div>;
  }

  if (!product) {
    return <div className="text-center py-12">Product not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <img 
            src={`http://localhost:8000${product.image}`} 
            alt={product.name} 
            className="w-full h-auto rounded-lg shadow-md"
          />
        </div>
        
        <div>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          <p className="text-2xl font-semibold mb-4">${product.price}</p>
          
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-2">Description</h2>
            <p className="text-gray-700">{product.description}</p>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-2">Select Size</h2>
            <div className="flex flex-wrap gap-2">
              {product.sizes && product.sizes.map(size => (
                <button
                  key={size}
                  className={`px-4 py-2 border rounded-md ${
                    selectedSize === size 
                      ? 'bg-black text-white border-black' 
                      : 'border-gray-300 hover:border-black'
                  }`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-2">Quantity</h2>
            <div className="flex items-center">
              <button 
                className="w-10 h-10 border border-gray-300 rounded-l-md flex items-center justify-center hover:bg-gray-100"
                onClick={() => quantity > 1 && setQuantity(quantity - 1)}
              >
                -
              </button>
              <span className="w-10 h-10 border-t border-b border-gray-300 flex items-center justify-center">
                {quantity}
              </span>
              <button 
                className="w-10 h-10 border border-gray-300 rounded-r-md flex items-center justify-center hover:bg-gray-100"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </button>
            </div>
          </div>
          
          <button
            className="w-full py-3 bg-black text-white rounded-md hover:bg-gray-800 transition"
            onClick={handleAddToCart}
          >
            Add to Cart
          </button>
        </div>
      </div>

      <ReviewSection 
        productId={id} 
        reviews={reviews} 
        isLoggedIn={!!localStorage.getItem('authToken')} 
        onReviewAdded={() => {
          const fetchReviews = async () => {
            try {
              const response = await fetch(`http://localhost:8000/api/reviews/?product=${id}`);
              if (response.ok) {
                const data = await response.json();
                setReviews(data);
              }
            } catch (error) {
              console.error("Error fetching reviews:", error);
            }
          };
          fetchReviews();
        }} 
      />
    </div>
  );
}

export default ProductDetail;