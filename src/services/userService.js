import api from './api';

export const userService = {
  /**
   * Search users by username (or other search term).
   * GET /users?search=...
   */
  searchUsers: async (search) => {
    const response = await api.get('/users', {
      params: { search: search?.trim() || '' },
    });
    return response.data;
  },

  /**
   * Search users by email.
   * GET /users/search/email?q=...
   */
  searchUsersByEmail: async (q) => {
    const response = await api.get('/users/search/email', {
      params: { q: q?.trim() || '' },
    });
    return response.data;
  },
};
