import api from './api';

export const groupService = {
  // Create a new group
  createGroup: async (data) => {
    const requestData = {
      name: data.name,
      description: data.description,
    };
    
    // Add image_url if it exists
    if (data.image_url) {
      requestData.image_url = data.image_url;
    }
    
    const response = await api.post('/groups', requestData);
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

  // Update group by ID
  updateGroup: async (groupId, data) => {
    const requestData = {
      name: data.name,
      description: data.description,
    };
    
    // Add image_url if it exists
    if (data.image_url) {
      requestData.image_url = data.image_url;
    }
    
    const response = await api.put(`/groups/${groupId}`, requestData);
    return response.data;
  },

  // Create event in a group
  createGroupEvent: async (groupId, eventData) => {
    const response = await api.post(`/groups/${groupId}/events`, {
      group_id: groupId,
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
