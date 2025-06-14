import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import ReviewSection from '../components/ReviewSection';
import WishlistButton from '../components/WishlistButton';
import { showToast } from '../utils/toast';
import { api } from '../utils/api';
import ImageWithFallback from '../components/ImageWithFallback';
import { toast } from 'react-hot-toast';

function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  // State management
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [showZoom, setShowZoom] = useState(false);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8000/api/products/${slug}/`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Product not found');
          } else if (response.status === 401) {
            throw new Error('Please log in to view this product');
          } else {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }
        }
        
        const data = await response.json();
        setProduct(data);
        
        // If we have the product, fetch related products
        if (data.id && data.category) {
          fetchRelatedProducts(data.id, data.category);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err.message);
        
        // Show toast notification for better UX
        toast.error(err.message);
        
        // Optionally redirect to products page after a delay
        setTimeout(() => {
          navigate('/products');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    const fetchRelatedProducts = async (productId, categoryId) => {
      try {
        const { data } = await api.get(
          `http://localhost:8000/api/products/?category=${categoryId}&exclude=${productId}&limit=4`
        );
        
        // Handle different response formats
        if (Array.isArray(data)) {
          setRelatedProducts(data);
        } else if (data.results && Array.isArray(data.results)) {
          setRelatedProducts(data.results);
        }
      } catch (err) {
        console.error('Error fetching related products:', err);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug, navigate]);

  // 1. Add this useEffect to set default size when product loads
  useEffect(() => {
    if (product && product.sizes) {
      // If there's only one size, auto-select it
      if (product.sizes.length === 1) {
        setSelectedSize(product.sizes[0]);
      } else {
        // Reset size selection when product changes
        setSelectedSize('');
      }
    }
  }, [product]);

  // Add this helper function at the beginning of your component
  const formatSizes = (sizes) => {
    if (!sizes) return [];
    
    if (Array.isArray(sizes)) {
      return sizes;
    }
    
    if (typeof sizes === 'string') {
      // If it's a JSON string, parse it
      if (sizes.includes('[') && sizes.includes(']')) {
        try {
          return JSON.parse(sizes);
        } catch (e) {
          return sizes.split(',').map(s => s.trim());
        }
      }
      // If it's a comma-separated string
      return sizes.split(',').map(s => s.trim());
    }
    
    return [];
  };

  // Handle cart addition
  const handleAddToCart = () => {
    // Only validate size if the product has size options
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      showToast.error('Please select a size');
      return;
    }
    
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      showToast.error('Please select a color');
      return;
    }
    
    addToCart({
      ...product,
      quantity,
      // Only include selectedSize if it exists or product has sizes
      selectedSize: product.sizes && product.sizes.length > 0 ? selectedSize : null,
      selectedColor
    });
    
    // Show confirmation toast instead of alert
    showToast.success('Product added to cart!');
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-xl">Loading product...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 text-center">
        <div className="bg-red-50 p-6 rounded-lg max-w-md mx-auto">
          <svg className="h-12 w-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h2 className="text-xl font-medium text-red-800 mb-2">Product Not Found</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/products')}
            className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            Browse All Products
          </button>
        </div>
      </div>
    );
  }

  // No product data
  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 text-center">
        <p>No product information available</p>
        <button 
          onClick={() => navigate('/products')}
          className="underline mt-4"
        >
          Browse all products
        </button>
      </div>
    );
  }

  // Product detail view
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="text-sm mb-6">
        <ol className="flex items-center space-x-2">
          <li><Link to="/" className="text-gray-500 hover:text-gray-700">Home</Link></li>
          <li className="text-gray-400">/</li>
          <li><Link to="/products" className="text-gray-500 hover:text-gray-700">Products</Link></li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-medium">{product.name}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Product Images */}
        <div className="product-images space-y-4">
          {/* Main Image */}
          <div 
            className="main-image relative rounded-lg overflow-hidden bg-gray-100"
            onMouseEnter={() => setShowZoom(true)}
            onMouseLeave={() => setShowZoom(false)}
          >
            {product.images && product.images.length > 0 ? (
              <ImageWithFallback
                src={product.images[activeImage] || product.image}
                alt={product.name}
                fallbackSrc="https://via.placeholder.com/600x800?text=No+Image"
                className="w-full h-auto object-cover"
              />
            ) : (
              <ImageWithFallback
                src={product.image}
                alt={product.name}
                fallbackSrc="https://via.placeholder.com/600x800?text=No+Image"
                className="w-full h-auto object-cover"
              />
            )}
            
            {/* Wishlist button */}
            <div className="absolute top-4 right-4">
              <WishlistButton productId={product.id} />
            </div>
          </div>
          
          {/* Thumbnail Images */}
          {product.images && product.images.length > 1 && (
            <div className="thumbnails grid grid-cols-5 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(index)}
                  className={`border rounded-md overflow-hidden ${
                    activeImage === index ? 'border-black' : 'border-gray-200'
                  }`}
                >
                  <ImageWithFallback 
                    src={image} 
                    alt={`${product.name} - view ${index + 1}`} 
                    className="w-full h-auto object-cover aspect-square"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Product Details */}
        <div className="product-details">
          <h1 className="text-3xl font-light mb-2">{product.name}</h1>
          
          {/* Price */}
          <div className="mb-6">
            {product.sale_price && product.sale_price < product.price ? (
              <div className="flex items-center">
                <span className="text-xl font-medium text-red-600 mr-2">${product.sale_price}</span>
                <span className="text-lg text-gray-500 line-through">${product.price}</span>
                <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                  {Math.round((1 - product.sale_price / product.price) * 100)}% OFF
                </span>
              </div>
            ) : (
              <span className="text-xl font-medium">${product.price}</span>
            )}
          </div>
          
          {/* Availability */}
          <div className="mb-6">
            {product.in_stock ? (
              <span className="text-green-600 flex items-center">
                <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                In Stock
              </span>
            ) : (
              <span className="text-red-600 flex items-center">
                <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                Out of Stock
              </span>
            )}
          </div>
          
          {/* Description */}
          <div className="mb-8">
            <p className="text-gray-700">{product.description}</p>
          </div>
          
          {/* Color Selection */}
          {product.colors && product.colors.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm uppercase tracking-wide mb-3">Color</h3>
              <div className="flex flex-wrap gap-2">
                {product.colors.map(color => (
                  <button
                    key={color.value}
                    onClick={() => setSelectedColor(color.value)}
                    className={`w-10 h-10 rounded-full border-2 ${
                      selectedColor === color.value 
                      ? 'border-black' 
                      : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    <span className="sr-only">{color.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Size selector */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-900">Size</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {product && formatSizes(product.sizes).map((size, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 text-sm border rounded-md ${
                    selectedSize === size
                      ? 'bg-black text-white border-black'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
          
          {/* Quantity */}
          <div className="mb-8">
            <h3 className="text-sm uppercase tracking-wide mb-3">Quantity</h3>
            <div className="flex border border-gray-300">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2 border-r border-gray-300"
                disabled={quantity <= 1}
              >
                -
              </button>
              <div className="px-6 py-2">{quantity}</div>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="px-4 py-2 border-l border-gray-300"
              >
                +
              </button>
            </div>
          </div>
          
          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={!product.in_stock}
            className={`w-full py-3 mb-4 uppercase tracking-wide ${
              product.in_stock 
              ? 'bg-black text-white hover:bg-gray-800' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            } transition-colors`}
          >
            {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
          </button>
          
          {/* Product Meta */}
          <div className="border-t border-gray-200 pt-6 mt-8">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">SKU:</p>
                <p className="font-medium">{product.sku || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Category:</p>
                <p className="font-medium">{product.category_name || 'N/A'}</p>
              </div>
              {product.brand && (
                <div>
                  <p className="text-gray-500">Brand:</p>
                  <p className="font-medium">{product.brand}</p>
                </div>
              )}
              {product.material && (
                <div>
                  <p className="text-gray-500">Material:</p>
                  <p className="font-medium">{product.material}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Reviews */}
      <ReviewSection 
        productId={product.id} 
        isLoggedIn={!!localStorage.getItem('authToken')} 
      />
      
      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-light mb-8">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map(relatedProduct => (
              <Link 
                key={relatedProduct.id} 
                to={`/product/${relatedProduct.slug}`}
                className="group"
              >
                <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg bg-gray-100">
                  <ImageWithFallback
                    src={relatedProduct.image}
                    alt={relatedProduct.name}
                    className="h-full w-full object-cover object-center group-hover:opacity-75"
                  />
                </div>
                <h3 className="mt-4 text-sm text-gray-700">{relatedProduct.name}</h3>
                <p className="mt-1 text-lg font-medium text-gray-900">
                  ${typeof relatedProduct.price === 'number' ? relatedProduct.price.toFixed(2) : parseFloat(relatedProduct.price || 0).toFixed(2)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetail;