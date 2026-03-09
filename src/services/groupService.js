import api from './api';

export const groupService = {
  // Create a new group
  createGroup: async (data) => {
    const response = await api.post('/groups', {
      name: data.name,
      description: data.description,
    });
    return response.data;
  },

  // Get all groups (for "All Group" tab)
  getAllGroups: async () => {
    const response = await api.get('/groups');
    return response.data;
  },

  // Get groups by organization (for "My Groups" tab)
  getGroupsByOrganization: async () => {
    const response = await api.get('/groups/organization');
    return response.data;
  },

  // Get group details by ID
  getGroupDetail: async (groupId) => {
    const response = await api.get(`/groups/${groupId}`);
    return response.data;
  },

  // Create event in a group
  createGroupEvent: async (groupId, eventData) => {
    const response = await api.post(`/groups/${groupId}/events`, {
      title: eventData.title,
      short_description: eventData.shortDescription,
      long_description: eventData.longDescription,
      category: eventData.category,
      start_time: eventData.startTime,
      end_time: eventData.endTime,
      location: eventData.location,
      full_address: eventData.fullAddress,
      capacity: eventData.capacity,
      is_public: eventData.isPublic,
    });
    return response.data;
  },

  // Get invite link information by token
  getInviteInfo: async (token) => {
    const response = await api.get(`/invite/info/${token}`);
    return response.data;
  },

  // Get latest invite links for the organization
  getLatestInviteLinks: async () => {
    const response = await api.get('/organization/latest-invite-links');
    return response.data;
  },
};
