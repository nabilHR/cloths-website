import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Cart from './pages/Cart.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderSuccess from './pages/OrderSuccess.jsx';
import Profile from './pages/Profile.jsx';
import BulkUpload from './pages/BulkUpload.jsx';
import Addresses from './pages/Addresses.jsx';
import OrderHistory from './pages/OrderHistory.jsx';
import CategoryPage from './pages/CategoryPage.jsx'; // Import the new CategoryPage component
import WishlistPage from './pages/WishlistPage'; // Import the WishlistPage component
import AccountDashboard from './pages/AccountDashboard'; // Import AccountDashboard
import SearchPage from './pages/SearchPage'; // Import SearchPage
import ProductsPage from './pages/ProductsPage';
import { Toaster } from 'react-hot-toast';
import ProfileEdit from './pages/ProfileEdit'; // Import ProfileEdit
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <Router>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-grow">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />
                  <Route path="/products" element={<ErrorBoundary><ProductsPage /></ErrorBoundary>} />
                  <Route path="/category/:slug" element={<ErrorBoundary><CategoryPage /></ErrorBoundary>} />
                  <Route path="/search" element={<ErrorBoundary><SearchPage /></ErrorBoundary>} />
                  <Route path="/product/:slug" element={<ErrorBoundary><ProductDetail /></ErrorBoundary>} />
                  <Route path="/cart" element={<ErrorBoundary><Cart /></ErrorBoundary>} />
                  <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
                  <Route path="/register" element={<ErrorBoundary><Register /></ErrorBoundary>} />
                  <Route path="/order-success" element={<ErrorBoundary><OrderSuccess /></ErrorBoundary>} />
                  
                  {/* Protected Routes */}
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
                </Routes>
              </main>
              <Footer />
            </div>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;