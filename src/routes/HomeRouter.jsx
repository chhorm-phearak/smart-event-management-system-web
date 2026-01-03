import { Route } from 'react-router-dom';
import { HomePage } from '@/pages/Home';

export const homeRoutes = [
  <Route key="home" path="/home" element={<HomePage />} />,
];
export const HomeRouter = () => null; // Keep for compatibility