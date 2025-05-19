import React from 'react';

function ProductCard({ product }) {
  return (
    <div style={{ border: '1px solid #eee', padding: 16, borderRadius: 8, width: 200 }}>
      <img
        src={product.image}
        alt={product.name}
        style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 4 }}
      />
      <h3>{product.name}</h3>
      <p>{product.price} $</p>
    </div>
  );
}

export default ProductCard;