import { createContext, useContext, useState, useEffect } from 'react';
import { getAccessToken, removeAccessToken } from '@/utils';
import { authService } from '@/services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      if (token) {
        setIsAuthenticated(true);
        try {
          const profileData = await authService.getProfile();
          const userData = profileData?.data?.user || profileData?.user || profileData;
          if (userData) setUser(userData);
        } catch {
          // Token may be invalid, keep user null
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      setIsAuthenticated(true);
      const userData = data?.data?.user || data?.user || { email };
      setUser(userData);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Login failed',
      };
    }
  };

  const register = async (userData) => {
    try {
      const data = await authService.register(userData);
      setIsAuthenticated(true);
      const profileUser = data?.data?.user || data?.user || userData;
      setUser(profileUser);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Registration failed',
      };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      removeAccessToken();
    }
  };

  const value = {
    user,
    setUser,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

