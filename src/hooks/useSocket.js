import { useState, useCallback } from 'react';
import socketService from '@/services/socketService';

export const useSocket = () => {
  const [socket] = useState(() => socketService.connect());

  const onNotification = useCallback((callback) => {
    socketService.onNotification(callback);
    return () => socketService.offNotification(callback);
  }, []);

  const joinOrganization = useCallback((organizationId) => {
    socketService.joinOrganization(organizationId);
  }, []);

  const leaveOrganization = useCallback((organizationId) => {
    socketService.leaveOrganization(organizationId);
  }, []);

  const joinEvent = useCallback((eventId) => {
    socketService.joinEvent(eventId);
  }, []);

  const leaveEvent = useCallback((eventId) => {
    socketService.leaveEvent(eventId);
  }, []);

  const joinGroup = useCallback((groupId) => {
    socketService.joinGroup(groupId);
  }, []);

  const leaveGroup = useCallback((groupId) => {
    socketService.leaveGroup(groupId);
  }, []);

  const isConnected = useCallback(() => {
    return socketService.isConnected();
  }, []);

  return {
    socket,
    onNotification,
    joinOrganization,
    leaveOrganization,
    joinEvent,
    leaveEvent,
    joinGroup,
    leaveGroup,
    isConnected,
  };
};

export default useSocket;
