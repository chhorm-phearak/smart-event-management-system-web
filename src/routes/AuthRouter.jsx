import { Route } from 'react-router-dom';
import { LoginPage, RegisterPage, VerifyEmailPage } from '@/pages/auth';

// Export routes as an array for proper flattening
export const authRoutes = [
  <Route key="login" path="/login" element={<LoginPage />} />,
  <Route key="register" path="/register" element={<RegisterPage />} />,
  <Route key="verify-email" path="/verify-email" element={<VerifyEmailPage />} />,
];

export const AuthRouter = () => null; // Keep for compatibility

