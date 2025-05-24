import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  // If you're using the cart context, uncomment this line
  // const { totalItems } = useCart();
  
  return (
    <nav className="bg-gray-800 text-white py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div>
          <Link to="/" className="text-xl font-bold">Cloths Store</Link>
        </div>

        <div className="flex items-center space-x-6">
          <Link to="/" className="hover:text-gray-300">Home</Link>
          <Link to="/cart" className="hover:text-gray-300 relative">
            Cart
            {/* Uncomment when cart context is ready */}
            {/* {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            )} */}
          </Link>
          <Link to="/login" className="hover:text-gray-300">Login</Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;