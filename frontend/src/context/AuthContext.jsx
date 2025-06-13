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
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return;
      }
      
      try {
        // Use our new API utility
        const { data, error } = await api.get('http://localhost:8000/api/users/profile/');
        
        if (error) {
          localStorage.removeItem('authToken');
          setIsAuthenticated(false);
          setUser(null);
        } else {
          setUser(data);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('authToken');
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  const login = (tokenData, userData) => {
    // Handle different token response formats
    const token = typeof tokenData === 'string' ? tokenData : tokenData?.access || tokenData?.token;
    const refresh = tokenData?.refresh;
    
    if (token) {
      localStorage.setItem('authToken', token);
      
      if (refresh) {
        localStorage.setItem('refreshToken', refresh);
        localStorage.setItem('tokenExpiry', new Date(Date.now() + 55 * 60 * 1000).toString());
        setRefreshToken(refresh);
      }
      
      setUser(userData);
      setIsAuthenticated(true);
    } else {
      console.error('Invalid token data received:', tokenData);
    }
  };
  
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiry');
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