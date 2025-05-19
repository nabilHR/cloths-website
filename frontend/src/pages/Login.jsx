import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Simulate API call
    setTimeout(() => {
      // Mock successful login (replace with actual auth logic)
      console.log('Logging in with:', { email, password });
      
      if (email === 'user@example.com' && password === 'password') {
        // You would normally set auth state and redirect here
        alert('Login successful!');
      } else {
        setError('Invalid email or password');
      }
      
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">Login</h1>
      
      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
            required
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
            />
            <label htmlFor="remember" className="ml-2 block text-gray-700">
              Remember me
            </label>
          </div>
          
          <a href="#" className="text-sm text-gray-600 hover:text-black">
            Forgot password?
          </a>
        </div>
        
        <button
          type="submit"
          className="w-full py-3 bg-black text-white rounded-md hover:bg-gray-800 transition"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <p className="text-center mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-gray-600 hover:text-black font-medium">
          Register
        </Link>
      </p>
    </div>
  );
}

export default Login;