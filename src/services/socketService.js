import { io } from 'socket.io-client';
import { getAccessToken } from '@/utils';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

let socket = null;

export const socketService = {
  connect: () => {
    const token = getAccessToken();
    
    if (!token) {
      console.warn('No access token available for socket connection');
      return null;
    }

    if (socket?.connected) {
      return socket;
    }

    socket = io(SOCKET_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    return socket;
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  getSocket: () => socket,

  // Subscribe to notifications
  onNotification: (callback) => {
    if (socket) {
      socket.on('notification', callback);
    }
  },

  // Unsubscribe from notifications
  offNotification: (callback) => {
    if (socket) {
      socket.off('notification', callback);
    }
  },

  // Join organization room
  joinOrganization: (organizationId) => {
    if (socket) {
      socket.emit('join:organization', organizationId);
    }
  },

  // Leave organization room
  leaveOrganization: (organizationId) => {
    if (socket) {
      socket.emit('leave:organization', organizationId);
    }
  },

  // Join event room
  joinEvent: (eventId) => {
    if (socket) {
      socket.emit('join:event', eventId);
    }
  },

  // Leave event room
  leaveEvent: (eventId) => {
    if (socket) {
      socket.emit('leave:event', eventId);
    }
  },

  // Join group room
  joinGroup: (groupId) => {
    if (socket) {
      socket.emit('join:group', groupId);
    }
  },

  // Leave group room
  leaveGroup: (groupId) => {
    if (socket) {
      socket.emit('leave:group', groupId);
    }
  },

  // Check if connected
  isConnected: () => socket?.connected || false,

  // Generic socket emit
  emit: (event, data) => {
    if (!socket?.connected) {
      console.warn('Socket not connected, cannot emit:', event);
      return;
    }
    socket.emit(event, data);
  },
};

export default socketService;
