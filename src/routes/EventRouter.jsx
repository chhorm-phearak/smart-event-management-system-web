import { Route } from 'react-router-dom';
import { EventListPage, EventDetailPage, EventCreatePage } from '@/pages/events';

// Export routes as an array for proper flattening
export const eventRoutes = [
  <Route key="events-list" path="/events" element={<EventListPage />} />,
  <Route key="events-detail" path="/events/:id" element={<EventDetailPage />} />,
  <Route key="events-create" path="/events/create" element={<EventCreatePage />} />,
];

export const EventRouter = () => null; // Keep for compatibility

