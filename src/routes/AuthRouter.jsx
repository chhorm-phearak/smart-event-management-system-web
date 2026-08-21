import { Route } from 'react-router-dom';
import { LoginPage, RegisterPage, VerifyEmailPage, ForgotPasswordPage, ResetPasswordPage } from '@/pages/auth';

// Export routes as an array for proper flattening
export const authRoutes = [
  <Route key="login" path="/login" element={<LoginPage />} />,
  <Route key="register" path="/register" element={<RegisterPage />} />,
  <Route key="verify-email" path="/verify-email" element={<VerifyEmailPage />} />,
  <Route key="forgot-password" path="/forgot-password" element={<ForgotPasswordPage />} />,
  <Route key="reset-password" path="/reset-password" element={<ResetPasswordPage />} />,
];

export const AuthRouter = () => null; // Keep for compatibility

