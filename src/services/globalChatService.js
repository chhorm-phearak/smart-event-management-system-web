import api from './api';

export const globalChatService = {
  // Get global chat messages with optional pagination
  getMessages: async ({ limit = 20, before = null } = {}) => {
    const params = {};
    if (limit) params.limit = limit;
    if (before) params.before = before;
    const response = await api.get('/global-chat/messages', { params });
    return response.data;
  },

  // Send a message (text only or with files)
  sendMessage: async ({ content, files = [] } = {}) => {
    if (files && files.length > 0) {
      const formData = new FormData();
      if (content) formData.append('content', content);
      files.forEach((file) => formData.append('files', file));
      const response = await api.post('/global-chat/messages', formData);
      return response.data;
    }
    const response = await api.post('/global-chat/messages', { content });
    return response.data;
  },

  // Mark all global messages as read
  markAllRead: async () => {
    const response = await api.post('/global-chat/read-all');
    return response.data;
  },

  // Get unread count for global chat
  getUnreadCount: async () => {
    const response = await api.get('/global-chat/unread-count');
    return response.data;
  },

  // Search global messages
  searchMessages: async (query, { limit = 50 } = {}) => {
    const params = { q: query };
    if (limit) params.limit = limit;
    const response = await api.get('/global-chat/search', { params });
    return response.data;
  },

  // Edit a message
  editMessage: async (messageId, content) => {
    const response = await api.put(`/global-chat/messages/${messageId}`, { content });
    return response.data;
  },

  // Delete a message
  deleteMessage: async (messageId) => {
    const response = await api.delete(`/global-chat/messages/${messageId}`);
    return response.data;
  },
};

export default globalChatService;
