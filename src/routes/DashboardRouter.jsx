import { Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardPage } from '@/pages/dashboard';
import { AllEventsPage, ManageEventsPage, ManageEventStaffPage, CreateEventPage, EventDetailPage, RegisterEventPage } from '@/pages/events';
import { MyTicketPage, MyTicketEventDetailPage } from '@/pages/tickets';
import { GroupPage, GroupDetailPage } from '@/pages/groups';
import { ManageAttendeesPage, ManageAttendeesDetailPage } from '@/pages/attendees';
import { ProfilePage } from '@/pages/profile';
import { OrganizationMembersPage, RegisterOrganizationPage } from '@/pages/organization';
import { NotificationsPage } from '@/pages/notifications';

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
    <Route path="create-event" element={<CreateEventPage />} />
    <Route path="events/:id" element={<EventDetailPage />} />
    <Route path="events/:id/register" element={<RegisterEventPage />} />
    <Route path="my-ticket" element={<MyTicketPage />} />
    <Route path="my-ticket/detail/:id" element={<MyTicketEventDetailPage />} />
    <Route path="group" element={<GroupPage />} />
    <Route path="groups/:id" element={<GroupDetailPage />} />
    <Route path="manage-attendees" element={<ManageAttendeesPage />} />
    <Route path="manage-attendees/:id" element={<ManageAttendeesDetailPage />} />
    <Route path="manage-events" element={<ManageEventsPage />} />
    <Route path="manage-events/:id/staff" element={<ManageEventStaffPage />} />
    <Route path="profile" element={<ProfilePage />} />
    <Route path="organization/members" element={<OrganizationMembersPage />} />
    <Route path="organization/register" element={<RegisterOrganizationPage />} />
    <Route path="notifications" element={<NotificationsPage />} />
  </Route>,
];

export const DashboardRouter = () => null; // Keep for compatibility

