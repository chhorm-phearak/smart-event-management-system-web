import api from './api';
import { setAccessToken, removeAccessToken } from '@/utils';

export const authService = {
  // Login
  login: async (email, password) => {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    
    // Store access token if provided in response
    // Check multiple possible locations for the token
    const token = 
      response.data?.accessToken || 
      response.data?.token || 
      response.data?.data?.accessToken ||
      response.data?.data?.token ||
      response.headers?.authorization?.replace('Bearer ', '') ||
      response.headers?.Authorization?.replace('Bearer ', '');
    
    if (token) {
      setAccessToken(token);
    } else {
      console.warn('No token found in login response:', response.data);
    }
    
    return response.data;
  },

  // Register
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    
    // Store access token if provided in response
    // Check multiple possible locations for the token
    const token = 
      response.data?.accessToken || 
      response.data?.token || 
      response.data?.data?.accessToken ||
      response.data?.data?.token ||
      response.headers?.authorization?.replace('Bearer ', '') ||
      response.headers?.Authorization?.replace('Bearer ', '');
    
    if (token) {
      setAccessToken(token);
    } else {
      console.warn('No token found in register response:', response.data);
    }
    
    return response.data;
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Even if logout fails, clear local token
      console.error('Logout error:', error);
    } finally {
      removeAccessToken();
    }
  },

  // Get Profile
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Update Profile
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  // Verify Email
  verifyEmail: async (token) => {
    const response = await api.get(`/auth/verify-email?token=${token}`);
    return response.data;
  },

  // Resend Verification Email
  resendVerification: async (email) => {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
  },
};

