import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '@/hooks/useSocket';
import { notificationService } from '@/services/notificationService';
import toast from 'react-hot-toast';

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, invites, schedule
  const [isConnected, setIsConnected] = useState(false);
  const { onNotification, isConnected: checkConnection } = useSocket();

  // Transform backend notification to frontend format
  const transformNotification = (notification) => ({
    id: notification.id,
    type: (notification.type === 'ORG_INVITE_RECEIVED' || notification.type === 'ORG_INVITE_ACCEPTED' || notification.type === 'ORG_INVITE_REJECTED') ? 'organization_member' : notification.type?.toLowerCase() || 'general',
    title: notification.title,
    message: notification.message,
    eventId: notification.event_id,
    eventName: notification.data?.event_name || '',
    groupId: notification.group_id,
    groupName: notification.data?.group_name || '',
    organizationId: notification.organization_id,
    invitationId: notification.invitation_id,
    actorUserId: notification.actor_user_id,
    timestamp: notification.created_at,
    read: notification.is_read || false,
    status: notification.type === 'ORG_INVITE_ACCEPTED' ? 'accepted' : notification.type === 'ORG_INVITE_REJECTED' ? 'rejected' : notification.data?.status || 'pending',
    oldDate: notification.data?.old_date,
    newDate: notification.data?.new_date,
    oldTime: notification.data?.old_time,
    newTime: notification.data?.new_time,
    data: notification.data,
  });

  // Handle incoming real-time notification
  const handleNewNotification = useCallback((notification) => {
    console.log('New notification received:', notification);
    
    const transformedNotification = transformNotification(notification);

    // Add new notification to the top of the list
    setNotifications(prev => [transformedNotification, ...prev]);

    // Show toast notification
    toast(notification.title, {
      icon: '🔔',
      duration: 4000,
    });
  }, []);

  // Set up socket connection and listeners
  useEffect(() => {
    const cleanup = onNotification(handleNewNotification);
    setIsConnected(checkConnection());

    // Check connection status periodically
    const interval = setInterval(() => {
      setIsConnected(checkConnection());
    }, 5000);

    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, [onNotification, handleNewNotification, checkConnection]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications();
      const transformedNotifications = (response.data || []).map(transformNotification);
      setNotifications(transformedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleAcceptInvite = async (notification) => {
    try {
      if (notification.invitationId) {
        await notificationService.acceptInvitation(notification.invitationId);
      }
      
      setNotifications(notifications.map(notif => 
        notif.id === notification.id 
          ? { ...notif, status: 'accepted', read: true }
          : notif
      ));
      
      toast.success('Invitation accepted!');
    } catch (error) {
      console.error('Error accepting invite:', error);
      toast.error('Failed to accept invitation');
    }
  };

  const handleRejectInvite = async (notification) => {
    try {
      if (notification.invitationId) {
        await notificationService.rejectInvitation(notification.invitationId);
      }
      
      setNotifications(notifications.map(notif => 
        notif.id === notification.id 
          ? { ...notif, status: 'rejected', read: true }
          : notif
      ));
      
      toast.success('Invitation rejected');
    } catch (error) {
      console.error('Error rejecting invite:', error);
      toast.error('Failed to reject invitation');
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(notifications.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleViewEvent = async (notification) => {
    if (notification?.id && !notification?.read) {
      await handleMarkAsRead(notification.id);
    }
    if (notification?.eventId) {
      navigate(`/events/${notification.eventId}`);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'staff_invite':
      case 'invitation':
      case 'group_invite':
      case 'organization_member':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'schedule_change':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'staff_invite':
      case 'invitation':
        return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'group_invite':
        return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'organization_member':
        return 'bg-indigo-100 text-indigo-600 border-indigo-200';
      case 'schedule_change':
        return 'bg-orange-100 text-orange-600 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  // Check if notification is an invite type
  const isInviteType = (type) => {
    return ['staff_invite', 'group_invite', 'invitation', 'organization_member'].includes(type);
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read;
    if (filter === 'invites') return isInviteType(notif.type);
    if (filter === 'schedule') return notif.type === 'schedule_change';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">Notifications</h1>
              <span className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                isConnected 
                  ? 'bg-green-500/20 text-green-100' 
                  : 'bg-red-500/20 text-red-100'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
            <p className="text-blue-100">
              {unreadCount > 0 
                ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'All caught up!'
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors backdrop-blur-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Mark all as read
              </button>
            )}
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'All', count: notifications.length },
          { key: 'unread', label: 'Unread', count: unreadCount },
          { key: 'invites', label: 'Invites', count: notifications.filter(n => isInviteType(n.type)).length },
          { key: 'schedule', label: 'Schedule', count: notifications.filter(n => n.type === 'schedule_change').length }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              filter === tab.key
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                filter === tab.key ? 'bg-white/20' : 'bg-blue-100 text-blue-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p className="text-gray-500 text-lg font-medium">No notifications found</p>
          <p className="text-gray-400 text-sm mt-2">
            {filter === 'unread' 
              ? "You're all caught up!"
              : filter === 'invites'
              ? 'No pending invitations'
              : filter === 'schedule'
              ? 'No schedule changes'
              : 'No notifications available'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map(notification => (
            <div
              key={notification.id}
              className={`bg-white rounded-xl p-6 shadow-sm border-2 transition-all hover:shadow-md ${
                !notification.read 
                  ? 'border-blue-200 bg-blue-50/30' 
                  : 'border-gray-200'
              }`}
            >
              <div className="flex gap-4">
                {/* Icon */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl border-2 flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">{notification.title}</h3>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-gray-700 mb-2">{notification.message}</p>
                      
                      {/* Schedule Change Details */}
                      {notification.type === 'schedule_change' && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-orange-600 font-semibold">Old:</span>
                              <span className="text-gray-700">
                                {new Date(notification.oldDate).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                })} at {notification.oldTime}
                              </span>
                            </div>
                            <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <div className="flex items-center gap-2">
                              <span className="text-green-600 font-semibold">New:</span>
                              <span className="text-gray-700">
                                {new Date(notification.newDate).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                })} at {notification.newTime}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Status Badge for Invites */}
                      {notification.status && (
                        <div className="mb-3">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            notification.status === 'accepted'
                              ? 'bg-green-100 text-green-700'
                              : notification.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {notification.status === 'accepted' && '✓ Accepted'}
                            {notification.status === 'rejected' && '✗ Rejected'}
                            {notification.status === 'pending' && '⏳ Pending'}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-xs text-gray-500">{formatTimestamp(notification.timestamp)}</span>
                        
                        {/* Action Buttons for Invites */}
                        {isInviteType(notification.type) ? (
                          notification.status === 'pending' ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAcceptInvite(notification)}
                                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Accept
                              </button>
                              <button
                                onClick={() => handleRejectInvite(notification)}
                                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Reject
                              </button>
                            </div>
                          ) : (
                            notification.type !== 'organization_member' && (
                              <button
                                onClick={() => {
                                  if (notification.type === 'group_invite') {
                                    navigate(`/groups/${notification.groupId}`);
                                  } else {
                                    handleViewEvent(notification);
                                  }
                                }}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                              >
                                {notification.type === 'group_invite' ? 'View Group' : 'View Event'}
                              </button>
                            )
                          )
                        ) : (
                          notification.eventId && (
                            <button
                              onClick={() => handleViewEvent(notification)}
                              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              View Event
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Mark as Read Button */}
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Mark as read"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
