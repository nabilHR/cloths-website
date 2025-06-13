import { showToast } from './toast';

// Standard headers for all requests
export const getHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (includeAuth) {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Standardize on Bearer format
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

// Reusable fetch function with error handling
export const fetchData = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getHeaders(options.auth !== false),
        ...options.headers
      }
    });
    
    // Handle common response scenarios
    if (response.status === 401) {
      // Unauthorized - token expired or invalid
      localStorage.removeItem('authToken');
      showToast.error('Your session has expired. Please log in again.');
      window.location.href = '/login';
      return { error: 'Unauthorized', status: 401 };
    }
    
    if (response.status === 404) {
      return { error: 'Resource not found', status: 404 };
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      return { 
        error: `Error: ${response.status} ${response.statusText}`, 
        details: errorText,
        status: response.status 
      };
    }
    
    // For successful requests, try to parse JSON
    try {
      const data = await response.json();
      return { data, status: response.status };
    } catch (e) {
      // Handle empty or non-JSON responses
      return { data: null, status: response.status };
    }
  } catch (error) {
    console.error('API request failed:', error);
    return { error: 'Network error', details: error.message };
  }
};

// API helper functions for common operations
export const api = {
  get: (url, options = {}) => fetchData(url, { method: 'GET', ...options }),
  
  post: (url, data, options = {}) => fetchData(url, { 
    method: 'POST', 
    body: JSON.stringify(data),
    ...options 
  }),
  
  put: (url, data, options = {}) => fetchData(url, {
    method: 'PUT',
    body: JSON.stringify(data),
    ...options
  }),
  
  delete: (url, options = {}) => fetchData(url, { method: 'DELETE', ...options }),
};