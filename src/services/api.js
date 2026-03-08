import axios from 'axios';
import { getAccessToken, removeAccessToken } from '@/utils';

// Create axios instance with base URL
// Use relative URL when in development (Vite proxy handles it)
// Use full URL in production or if VITE_API_BASE_URL is set
const getBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // In development, use relative path (Vite proxy will handle it)
  // In production, use the full URL
  return import.meta.env.DEV ? '/api' : 'http://localhost:3000/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent multiple token expiration redirects
let isRedirecting = false;

// Request interceptor to add access token to every request
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Let browser/axios set Content-Type with boundary for FormData (e.g. file upload)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 unauthorized - show alert and redirect to login
    // But exclude login/register endpoints as they return 401 for invalid credentials
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');
      const isPublicEndpoint = requestUrl.includes('/invite/validate') || requestUrl.includes('/invite/accept');
      
      // Only show token expiration message for authenticated requests, not for login/register failures or public endpoints
      if (!isAuthEndpoint && !isPublicEndpoint && !isRedirecting) {
        isRedirecting = true;
        removeAccessToken();
        alert('Your token is expired. Please login again.');
        // Use replace instead of href to prevent back button issues
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;

