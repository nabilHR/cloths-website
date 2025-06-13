import React from 'react';
import { Link } from 'react-router-dom';

function Hero() {
  return (
    <section className="relative h-screen max-h-[800px] overflow-hidden">
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80" 
          alt="Fashion banner" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      </div>
      
      <div className="relative h-full flex items-center justify-center text-center px-4">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl text-white font-light mb-6">
            New Season Arrivals
          </h1>
          <p className="text-lg md:text-xl text-white mb-8">
            Discover the latest trends in fashion and explore our new collection
          </p>
          <Link 
            to="/products" 
            className="inline-block bg-white text-black px-8 py-3 text-sm uppercase tracking-wider font-light hover:bg-gray-100 transition-colors duration-300"
          >
            Shop Now
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Hero;