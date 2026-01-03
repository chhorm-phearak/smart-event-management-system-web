import { Routes } from 'react-router-dom';
import { authRoutes } from './AuthRouter';
import { dashboardRoutes } from './DashboardRouter';
import { homeRoutes } from './HomeRouter';

export const AppRoutes = () => {
  return (
    <Routes>
      {dashboardRoutes}
      {authRoutes}
      {homeRoutes}
    </Routes>
  );
};

