import { Route } from 'react-router-dom';
import { HomePage } from '@/pages/Home';

export const homeRoutes = [
  <Route key="home" path="/landing-page" element={<HomePage />} />,
];
export const HomeRouter = () => null; // Keep for compatibility