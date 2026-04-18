import api from './api';

export const attendeeService = {
  getMyEventsStats: async (params = {}) => {
    const response = await api.get('/attendees/my-events/stats', { params });
    return response.data;
  },

  getEventAttendees: async (eventId, params = {}) => {
    const response = await api.get(`/attendees/${eventId}/attendees`, { params });
    return response.data;
  },

  deleteAttendee: async (registrationId) => {
    const response = await api.delete(`/events/registrations/${registrationId}`);
    return response.data;
  },

  checkInAttendee: async (qrTicketId) => {
    const response = await api.post(`/events/checkin/${encodeURIComponent(qrTicketId)}`);
    return response.data;
  },
};
