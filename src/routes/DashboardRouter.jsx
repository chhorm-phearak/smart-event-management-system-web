import { Route } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { DashboardPage } from '@/pages/dashboard';
import { EventListPage, EventDetailPage, EventCreatePage } from '@/pages/events';
import { GroupListPage, GroupDetailPage, GroupCreatePage } from '@/pages/groups';

// Export routes as an array for proper flattening
// All routes are nested under DashboardLayout
export const dashboardRoutes = [
  <Route key="dashboard" path="/" element={<DashboardLayout />}>
    <Route index element={<DashboardPage />} />
    <Route path="events" element={<EventListPage />} />
    <Route path="events/:id" element={<EventDetailPage />} />
    <Route path="events/create" element={<EventCreatePage />} />
    <Route path="groups" element={<GroupListPage />} />
    <Route path="groups/:id" element={<GroupDetailPage />} />
    <Route path="groups/create" element={<GroupCreatePage />} />
  </Route>,
];

export const DashboardRouter = () => null; // Keep for compatibility

