import api from './api';

export const eventService = {
  // Get all events
  getAllEvents: async (params = {}) => {
    const response = await api.get('/events', { params });
    return response.data;
  },

  // Get event by ID
  getEventById: async (id) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  // Create event
  createEvent: async (eventData) => {
    const response = await api.post('/events', eventData);
    return response.data;
  },

  // Update event
  updateEvent: async (id, eventData) => {
    const response = await api.put(`/events/${id}`, eventData);
    return response.data;
  },

  // Delete event
  deleteEvent: async (id) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },

  // Register for event
  registerForEvent: async (eventId) => {
    const response = await api.post(`/events/${eventId}/register`);
    return response.data;
  },

  // Get registered events for current user
  getRegisteredEvents: async () => {
    const response = await api.get('/events/registered');
    return response.data;
  },

  // Add images to event
  addEventImages: async (eventId, imageUrls) => {
    const response = await api.post(`/events/${eventId}/images`, {
      image_urls: Array.isArray(imageUrls) ? imageUrls : [imageUrls],
    });
    return response.data;
  },
};
