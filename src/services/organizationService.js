import api from './api';

export const organizationService = {
  // Get organization members
  getMembers: async (organizationId) => {
    const response = await api.get(`/organizations/${organizationId}/members`);
    return response.data;
  },
};
