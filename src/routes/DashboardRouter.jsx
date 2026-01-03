import { Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardPage } from '@/pages/dashboard';
import { AllEventsPage, ManageEventsPage } from '@/pages/events';
import { MyTicketPage } from '@/pages/tickets';
import { GroupPage } from '@/pages/groups';
import { ManageAttendeesPage } from '@/pages/attendees';

// Export routes as an array for proper flattening
// All routes are nested under DashboardLayout and protected
export const dashboardRoutes = [
  <Route
    key="dashboard-root"
    path="/"
    element={
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    }
  >
    <Route index element={<DashboardPage />} />
    <Route path="all-events" element={<AllEventsPage />} />
    <Route path="my-ticket" element={<MyTicketPage />} />
    <Route path="group" element={<GroupPage />} />
    <Route path="manage-attendees" element={<ManageAttendeesPage />} />
    <Route path="manage-events" element={<ManageEventsPage />} />
  </Route>,
];

export const DashboardRouter = () => null; // Keep for compatibility

