import { Routes } from 'react-router-dom';
import { authRoutes } from './AuthRouter';
import { dashboardRoutes } from './DashboardRouter';

export const AppRoutes = () => {
  return (
    <Routes>
      {dashboardRoutes}
      {authRoutes}
    </Routes>
  );
};

