import api from './api';

export const organizationService = {
  // Get current organization or application info for the logged-in user
  getCurrentOrganization: async () => {
    const response = await api.get('/organizations/current');
    return response.data;
  },

  // Submit a new organization application
  submitOrganizationApplication: async (organizationData) => {
    const response = await api.post('/organizations/applications', organizationData);
    return response.data;
  },

  // Get organization members (old endpoint with organizationId)
  getMembers: async (organizationId) => {
    const response = await api.get(`/organizations/${organizationId}/members`);
    return response.data;
  },

  // Get organization members (new endpoint)
  getOrganizationMembers: async () => {
    const response = await api.get('/organizations/members');
    return response.data;
  },

  // Invite user to organization
  inviteMember: async (organizationId, userId, message = 'Please join our organization') => {
    const response = await api.post('/invitations', {
      target_type: 'ORGANIZATION',
      organization_id: organizationId,
      invited_user_id: userId,
      role: 'MEMBER',
      message: message
    });
    return response.data;
  },

  // Remove member from organization
  removeMember: async (memberId) => {
    const response = await api.delete(`/organizations/members/${memberId}`);
    return response.data;
  },

  // Get organization members by organization ID (for staff assignment)
  getMembersByOrganizationId: async (organizationId) => {
    const response = await api.get(`/organizations/${organizationId}/members`);
    return response.data;
  },

  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await api.get('/organizations/dashboard/stats');
    return response.data;
  },

  // Get paginated dashboard events
  getDashboardEvents: async (page = 1, limit = 10) => {
    const response = await api.get('/organizations/dashboard/events', {
      params: { page, limit }
    });
    return response.data;
  },
};
