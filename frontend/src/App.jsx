import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductsPage from './pages/ProductsPage';
import CategoryPage from './pages/CategoryPage';
import SearchPage from './pages/SearchPage';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import OrderSuccess from './pages/OrderSuccess';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import BulkUpload from './pages/BulkUpload';
import Addresses from './pages/Addresses';
import OrderHistory from './pages/OrderHistory';
import WishlistPage from './pages/WishlistPage';
import AccountDashboard from './pages/AccountDashboard';
import ProfileEdit from './pages/ProfileEdit';
import ProductManagement from './pages/ProductManagement';

import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          {/* Add future flags to fix React Router warnings */}
          <Router future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />
                  <Route path="/products" element={<ErrorBoundary><ProductsPage /></ErrorBoundary>} />
                  <Route path="/category/:slug" element={<ErrorBoundary><CategoryPage /></ErrorBoundary>} />
                  <Route path="/search" element={<ErrorBoundary><SearchPage /></ErrorBoundary>} />
                  <Route path="/product/:slug" element={<ErrorBoundary><ProductDetail /></ErrorBoundary>} />
                  <Route path="/cart" element={<ErrorBoundary><Cart /></ErrorBoundary>} />
                  <Route path="/login" element={
                    <ErrorBoundary>
                      <Login />
                    </ErrorBoundary>
                  } />
                  <Route path="/register" element={<ErrorBoundary><Register /></ErrorBoundary>} />
                  <Route path="/order-success" element={<ErrorBoundary><OrderSuccess /></ErrorBoundary>} />
                  
                  {/* Protected routes */}
                  <Route 
                    path="/checkout" 
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary><Checkout /></ErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary><Profile /></ErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/orders" 
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary><Profile /></ErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/bulk-upload" 
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary><BulkUpload /></ErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="/order-confirmation/:orderId" element={<ErrorBoundary><OrderSuccess /></ErrorBoundary>} />
                  <Route 
                    path="/addresses" 
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary><Addresses /></ErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/order-history" 
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary><OrderHistory /></ErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/wishlist" 
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary><WishlistPage /></ErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/account" 
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary><AccountDashboard /></ErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/profile/edit" 
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary><ProfileEdit /></ErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/products" 
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary><ProductManagement /></ErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                </Routes>
              </main>
              <Footer />
            </div>
          </Router>
        </CartProvider>
      </AuthProvider>
      <Toaster position="top-right" />
    </ErrorBoundary>
  );
}

export default App;