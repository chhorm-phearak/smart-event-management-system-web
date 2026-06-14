import api from './api';

export const chatService = {
  // Get conversations list (groups with last message + unread count)
  getConversations: async () => {
    const response = await api.get('/groups/conversations');
    return response.data;
  },

  // Get messages of a group with optional pagination cursor
  getMessages: async (groupId, { limit = 20, before } = {}) => {
    const params = {};
    if (limit) params.limit = limit;
    if (before) params.before = before;
    const response = await api.get(`/groups/${groupId}/messages`, { params });
    return response.data;
  },

  // Mark all messages in a group as read
  markAsRead: async (groupId) => {
    const response = await api.post(`/groups/${groupId}/messages/read-all`);
    return response.data;
  },

  // Send a message (text only or with files)
  sendMessage: async (groupId, { content, files = [], replyToId = null } = {}) => {
    if (files && files.length > 0) {
      const formData = new FormData();
      if (content) formData.append('content', content);
      if (replyToId) formData.append('reply_to_id', replyToId);
      files.forEach((file) => formData.append('files', file));
      const response = await api.post(`/groups/${groupId}/messages`, formData);
      return response.data;
    }
    const response = await api.post(`/groups/${groupId}/messages`, {
      content,
      reply_to_id: replyToId,
    });
    return response.data;
  },

  // Edit a message (sender-only)
  editMessage: async (groupId, messageId, content) => {
    const response = await api.put(`/groups/${groupId}/messages/${messageId}`, { content });
    return response.data;
  },

  // Delete a message (sender, org owner, or admin)
  deleteMessage: async (groupId, messageId) => {
    const response = await api.delete(`/groups/${groupId}/messages/${messageId}`);
    return response.data;
  },
};

export default chatService;
