import api from './api';

export const staffService = {
  // Get all staff members
  getAllStaff: async () => {
    const response = await api.get('/staff');
    return response.data;
  },

  // Get staff by ID
  getStaffById: async (id) => {
    const response = await api.get(`/staff/${id}`);
    return response.data;
  },
};
