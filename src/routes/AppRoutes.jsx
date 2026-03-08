import { Routes, Route } from 'react-router-dom';
import { authRoutes } from './AuthRouter';
import { dashboardRoutes } from './DashboardRouter';
import { homeRoutes } from './HomeRouter';
import { InviteAcceptPage } from '@/pages/invite/InviteAcceptPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Invite routes - public access */}
      <Route path="/invite/accept/:token" element={<InviteAcceptPage />} />
      
      {dashboardRoutes}
      {authRoutes}
      {homeRoutes}
    </Routes>
  );
};

