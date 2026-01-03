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

// Request interceptor to add access token to every request
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    // Handle 401 unauthorized - clear token and redirect to login
    if (error.response?.status === 401) {
      removeAccessToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

