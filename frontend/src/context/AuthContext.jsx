import React, { createContext, useState, useContext, useEffect } from 'react';
import { showToast } from '../utils/toast';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem('refreshToken') || null
  );
  
  useEffect(() => {
    const checkAuthStatus = async () => {
      setLoading(true);
      
      try {
        // Check if token exists in localStorage
        const token = localStorage.getItem('authToken');
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (!token) {
          // No token found, user is not authenticated
          setIsAuthenticated(false);
          setUser(null);
          return;
        }
        
        // If we have a token, consider the user authenticated
        setIsAuthenticated(true);
        setUser(userData);
        
        // Test if token is still valid by making a simple API call
        try {
          const testResponse = await fetch('http://localhost:8000/api/users/profile/', {
            headers: {
              'Authorization': `Token ${token}`
            }
          });
          
          if (!testResponse.ok) {
            // Token is invalid, clear auth state
            throw new Error('Invalid token');
          }
        } catch (error) {
          console.error('Token validation failed:', error);
          logout(); // Call your logout function
        }
        
      } catch (error) {
        console.error('Auth check error:', error);
        // Clear invalid auth data
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  const login = (token, userData) => {
    console.log("Storing user data:", userData);
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };
  
  const logout = () => {
    // Clear ALL auth-related localStorage items
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiry');
    
    // Reset auth state
    setRefreshToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };
  
  const refreshAccessToken = async () => {
    if (!refreshToken) return null;
    
    try {
      const { data, error } = await api.post(
        'http://localhost:8000/api/token/refresh/',
        { refresh: refreshToken },
        { auth: false }
      );
      
      if (error) {
        logout();
        return null;
      }
      
      const newToken = data.access;
      localStorage.setItem('authToken', newToken);
      localStorage.setItem('tokenExpiry', new Date(Date.now() + 55 * 60 * 1000).toString());
      
      return newToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      logout();
      return null;
    }
  };
  
  const getValidToken = async () => {
    const token = localStorage.getItem('authToken');
    const expiry = localStorage.getItem('tokenExpiry');
    
    if (!token || !refreshToken) return null;
    
    // If token is about to expire, refresh it
    if (expiry && new Date(expiry) <= new Date()) {
      return await refreshAccessToken();
    }
    
    return token;
  };
  
  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        user, 
        loading, 
        login, 
        logout, 
        refreshAccessToken,
        getValidToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}