import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-0.5 px-1 mt-8">
      <div className="max-w-3xl mx-auto flex flex-col items-center">
        {/* Centered Logo */}
        <img
          src="/logo/logo.png"
          alt="Logo"
          className="w-[16rem] max-h-[4rem] md:max-h-[8rem] h-auto mb-1 object-contain"
        />
        {/* Content: Contact left, Links right */}
        <div className="w-full flex flex-col md:flex-row md:justify-between md:items-start gap-1 mb-0.5">
          {/* Contact Info - left */}
          <div className="flex flex-col items-center md:items-start space-y-0.5 md:text-left text-center">
            <h2 className="text-[9px] font-bold tracking-wide mb-0.5 flex items-center gap-1">
              <svg className="w-2.5 h-2.5 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75l8.25 6.75 8.25-6.75M3 6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v10.5A2.25 2.25 0 0118.75 19.5H5.25A2.25 2.25 0 013 17.25V6.75z" />
              </svg>
              Contact Us
            </h2>
            <div className="flex items-center gap-1 text-[8px]">
              <svg className="w-2.5 h-2.5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5A2.25 2.25 0 0119.5 19.5H4.5a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 014.5 4.5h15a2.25 2.25 0 012.25 2.25z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75l8.25 6.75 8.25-6.75" />
              </svg>
              <a href="mailto:nabil.baghoughi@usmba.ac.ma" className="underline hover:text-yellow-400 transition">nabil.baghoughi@usmba.ac.ma</a>
            </div>
            <div className="flex items-center gap-1 text-[8px]">
              <svg className="w-2.5 h-2.5 text-green-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75A2.25 2.25 0 014.5 4.5h2.25a2.25 2.25 0 012.25 2.25v2.25a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 9V6.75zm0 10.5A2.25 2.25 0 014.5 19.5h2.25a2.25 2.25 0 002.25-2.25v-2.25a2.25 2.25 0 00-2.25-2.25H4.5A2.25 2.25 0 012.25 15.75v1.5zm16.5-13.5a2.25 2.25 0 012.25 2.25v2.25a2.25 2.25 0 01-2.25 2.25h-2.25a2.25 2.25 0 01-2.25-2.25V4.5a2.25 2.25 0 012.25-2.25h2.25z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2h6z" />
              </svg>
              <a href="tel:+21266666666" className="underline hover:text-yellow-400 transition">+21266666666</a>
            </div>
          </div>
          {/* Quick Links - right */}
          <div className="flex flex-col items-center md:items-end space-y-0.5 md:text-right text-center">
            <h2 className="text-[9px] font-bold tracking-wide mb-0.5">Quick Links</h2>
            <Link to="/products" className="hover:text-yellow-400 transition text-[8px]">Shop</Link>
            <Link to="/about" className="hover:text-yellow-400 transition text-[8px]">About Us</Link>
            <Link to="/contact" className="hover:text-yellow-400 transition text-[8px]">Contact</Link>
          </div>
        </div>
        <div className="text-center text-[8px] text-gray-400">
          &copy; {new Date().getFullYear()} Cloths Store. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;