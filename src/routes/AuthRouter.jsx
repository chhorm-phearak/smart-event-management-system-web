import { Route } from 'react-router-dom';
import { LoginPage, RegisterPage } from '@/pages/auth';

// Export routes as an array for proper flattening
export const authRoutes = [
  <Route key="login" path="/login" element={<LoginPage />} />,
  <Route key="register" path="/register" element={<RegisterPage />} />,
];

export const AuthRouter = () => null; // Keep for compatibility

