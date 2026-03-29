import api from './api';

export const notificationService = {
  // Get all notifications with pagination
  getNotifications: async (page = 1, limit = 20) => {
    const response = await api.get('/notifications', {
      params: { page, limit }
    });
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  // Accept invitation
  acceptInvitation: async (invitationId) => {
    const response = await api.post(`/invitations/${invitationId}/accept`);
    return response.data;
  },

  // Reject invitation
  rejectInvitation: async (invitationId) => {
    const response = await api.post(`/invitations/${invitationId}/reject`);
    return response.data;
  },
};

export default notificationService;
