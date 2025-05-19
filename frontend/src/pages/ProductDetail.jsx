import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  
  // Mock product data (replace with API call)
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProduct({
        id: id,
        name: 'Classic T-Shirt',
        price: 29.99,
        description: 'A comfortable cotton t-shirt perfect for everyday wear. Features a classic fit and soft fabric.',
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Black', 'White', 'Gray'],
        image: 'https://via.placeholder.com/600x800?text=Product+Image',
        gallery: [
          'https://via.placeholder.com/600x800?text=Image+1',
          'https://via.placeholder.com/600x800?text=Image+2',
          'https://via.placeholder.com/600x800?text=Image+3',
        ]
      });
      setLoading(false);
    }, 500);
  }, [id]);

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert('Please select a size');
      return;
    }
    
    console.log('Added to cart:', {
      productId: product.id,
      name: product.name,
      price: product.price,
      size: selectedSize,
      quantity
    });
    
    // Here you would typically dispatch to your cart state manager
    alert(`Added ${quantity} ${product.name} (${selectedSize}) to cart!`);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Product Images */}
      <div>
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-auto rounded-lg shadow-md"
        />
        <div className="grid grid-cols-3 gap-2 mt-4">
          {product.gallery.map((img, index) => (
            <img 
              key={index}
              src={img} 
              alt={`${product.name} view ${index + 1}`} 
              className="w-full h-auto rounded-lg cursor-pointer"
            />
          ))}
        </div>
      </div>
      
      {/* Product Details */}
      <div>
        <h1 className="text-3xl font-bold">{product.name}</h1>
        <p className="text-2xl font-semibold mt-2">${product.price}</p>
        
        <div className="my-6">
          <h3 className="text-lg font-medium mb-2">Description</h3>
          <p className="text-gray-600">{product.description}</p>
        </div>
        
        {/* Size Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Size</h3>
          <div className="flex space-x-2">
            {product.sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-4 py-2 border rounded-md ${
                  selectedSize === size 
                    ? 'bg-black text-white border-black' 
                    : 'border-gray-300'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
        
        {/* Quantity */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Quantity</h3>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-3 py-1 border border-gray-300 rounded-md"
            >
              -
            </button>
            <span className="px-3 py-1">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="px-3 py-1 border border-gray-300 rounded-md"
            >
              +
            </button>
          </div>
        </div>
        
        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className="w-full py-3 bg-black text-white rounded-md hover:bg-gray-800 transition"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export default ProductDetail;