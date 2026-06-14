import { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getAccessToken, removeAccessToken, getOrganizationId, setOrganizationId, removeOrganizationId } from '@/utils';
import { authService, organizationService } from '@/services';

// Resolve the current organization id for the logged-in user from the
// dedicated organization endpoint. This is the authoritative source because
// /auth/login and /auth/profile responses may not include organization info.
const resolveCurrentOrganizationId = async () => {
  try {
    const res = await organizationService.getCurrentOrganization();
    const payload = res?.data ?? res;
    return (
      payload?.organization?.id ??
      payload?.organization_id ??
      payload?.id ??
      null
    );
  } catch {
    return null;
  }
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();
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
          console.log('Profile API Response:', profileData); // Debug log
          const userData = profileData?.data?.user || profileData?.user || profileData;
          console.log('Extracted User Data:', userData); // Debug log
          if (userData) {
            // /auth/profile may not include organization info. Resolve the org id
            // from (1) profile, (2) localStorage, (3) /organizations/current.
            const orgIdFromProfile =
              userData.organization_id ?? userData.organizationId ?? userData.organization?.id;
            let orgId = orgIdFromProfile ?? getOrganizationId();
            if (!orgId) {
              orgId = await resolveCurrentOrganizationId();
            }
            if (orgId) {
              setOrganizationId(orgId);
              userData.organization_id = userData.organization_id ?? orgId;
            }
            setUser(userData);
          }
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
      console.log('Login API Response:', data); // Debug log
      setIsAuthenticated(true);
      const userData = data?.data?.user || data?.user || { email };
      console.log('Login User Data:', userData); // Debug log
      
      // Store organization_id in localStorage if available; otherwise resolve
      // it from /organizations/current so refresh keeps the organizer state.
      let orgId = userData.organization_id ?? userData.organizationId ?? userData.organization?.id;
      if (!orgId) {
        orgId = await resolveCurrentOrganizationId();
      }
      if (orgId) {
        setOrganizationId(orgId);
        userData.organization_id = orgId;
      }
      
      setUser(userData);
      await queryClient.invalidateQueries({ predicate: () => true });
      
      // Handle redirect after login
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        sessionStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectPath;
      }
      
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
      await queryClient.invalidateQueries({ predicate: () => true });
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
      removeOrganizationId();
      queryClient.clear();
      window.location.replace('/login');
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

