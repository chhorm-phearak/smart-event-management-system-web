import { Route } from 'react-router-dom';
import { GroupListPage, GroupDetailPage, GroupCreatePage } from '@/pages/groups';

// Export routes as an array for proper flattening
export const groupRoutes = [
  <Route key="groups-list" path="/groups" element={<GroupListPage />} />,
  <Route key="groups-detail" path="/groups/:id" element={<GroupDetailPage />} />,
  <Route key="groups-create" path="/groups/create" element={<GroupCreatePage />} />,
];

export const GroupRouter = () => null; // Keep for compatibility

