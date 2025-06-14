import React, { createContext, useState, useContext, useEffect } from 'react';
import { showToast } from '../utils/toast';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem('refreshToken') || null
  );
  
  // This runs on initial load and checks auth status
  useEffect(() => {
    const checkAuthStatus = async () => {
      setLoading(true);
      
      try {
        const token = localStorage.getItem('authToken');
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (!token) {
          setIsAuthenticated(false);
          setUser(null);
          return;
        }
        
        // Token exists, consider user authenticated
        setUser(userData);
        setIsAuthenticated(true);
        
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthStatus();
    
    // Optional: Listen for localStorage changes from other tabs
    window.addEventListener('storage', (event) => {
      if (event.key === 'authToken') {
        checkAuthStatus();
      }
    });
    
    return () => {
      window.removeEventListener('storage', checkAuthStatus);
    };
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