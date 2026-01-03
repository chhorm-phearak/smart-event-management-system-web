import { Navigate } from 'react-router-dom';
import { getAccessToken } from '@/utils';

export const ProtectedRoute = ({ children }) => {
  const token = getAccessToken();

  // Primary check: token in localStorage (persists across tabs)
  // If token exists, allow access regardless of AuthContext state
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

