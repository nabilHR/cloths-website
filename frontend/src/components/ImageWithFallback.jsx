import React, { useState } from 'react';

function ImageWithFallback({ 
  src, 
  alt, 
  fallbackSrc = 'https://via.placeholder.com/300x400?text=No+Image', 
  ...props 
}) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setImgSrc(fallbackSrc);
      setHasError(true);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      onError={handleError}
      {...props}
    />
  );
}

export default ImageWithFallback;