import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, invites, schedule

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration - replace with actual API call
      const mockNotifications = [
        {
          id: 1,
          type: 'staff_invite',
          title: 'Staff Invitation',
          message: 'You have been invited to be a staff member for "Tech Conference 2025"',
          eventName: 'Tech Conference 2025',
          eventId: 1,
          timestamp: '2025-01-20T10:30:00',
          read: false,
          status: 'pending' // pending, accepted, rejected
        },
        {
          id: 2,
          type: 'group_invite',
          title: 'Group Invitation',
          message: 'You have been invited to join "Tech Enthusiasts" group',
          groupName: 'Tech Enthusiasts',
          groupId: 1,
          timestamp: '2025-01-19T14:20:00',
          read: false,
          status: 'pending'
        },
        {
          id: 3,
          type: 'schedule_change',
          title: 'Event Schedule Changed',
          message: 'The schedule for "Web Development Workshop" has been updated',
          eventName: 'Web Development Workshop',
          eventId: 3,
          oldDate: '2025-02-15',
          newDate: '2025-02-20',
          oldTime: '14:00',
          newTime: '15:00',
          timestamp: '2025-01-18T09:15:00',
          read: true
        },
        {
          id: 4,
          type: 'staff_invite',
          title: 'Staff Invitation',
          message: 'You have been invited to be a staff member for "AI & Machine Learning Summit"',
          eventName: 'AI & Machine Learning Summit',
          eventId: 2,
          timestamp: '2025-01-17T16:45:00',
          read: true,
          status: 'accepted'
        },
        {
          id: 5,
          type: 'group_invite',
          title: 'Group Invitation',
          message: 'You have been invited to join "Startup Founders" group',
          groupName: 'Startup Founders',
          groupId: 2,
          timestamp: '2025-01-16T11:30:00',
          read: true,
          status: 'rejected'
        },
        {
          id: 6,
          type: 'schedule_change',
          title: 'Event Schedule Changed',
          message: 'The schedule for "Tech Conference 2025" has been updated',
          eventName: 'Tech Conference 2025',
          eventId: 1,
          oldDate: '2025-03-15',
          newDate: '2025-03-18',
          oldTime: '09:00',
          newTime: '10:00',
          timestamp: '2025-01-15T08:00:00',
          read: true
        }
      ];
      
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
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
      // API call would go here
      // await notificationService.acceptInvite(notification.id);
      
      setNotifications(notifications.map(notif => 
        notif.id === notification.id 
          ? { ...notif, status: 'accepted', read: true }
          : notif
      ));
      
      // Navigate based on type
      if (notification.type === 'staff_invite') {
        navigate(`/manage-events/${notification.eventId}/staff`);
      } else if (notification.type === 'group_invite') {
        navigate(`/groups/${notification.groupId}`);
      }
    } catch (error) {
      console.error('Error accepting invite:', error);
    }
  };

  const handleRejectInvite = async (notification) => {
    try {
      // API call would go here
      // await notificationService.rejectInvite(notification.id);
      
      setNotifications(notifications.map(notif => 
        notif.id === notification.id 
          ? { ...notif, status: 'rejected', read: true }
          : notif
      ));
    } catch (error) {
      console.error('Error rejecting invite:', error);
    }
  };

  const handleMarkAsRead = (notificationId) => {
    setNotifications(notifications.map(notif => 
      notif.id === notificationId 
        ? { ...notif, read: true }
        : notif
    ));
  };

  const handleViewEvent = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'staff_invite':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'group_invite':
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
        return null;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'staff_invite':
        return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'group_invite':
        return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'schedule_change':
        return 'bg-orange-100 text-orange-600 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read;
    if (filter === 'invites') return notif.type === 'staff_invite' || notif.type === 'group_invite';
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
            <h1 className="text-3xl font-bold mb-2">Notifications</h1>
            <p className="text-blue-100">
              {unreadCount > 0 
                ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'All caught up!'
              }
            </p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'All', count: notifications.length },
          { key: 'unread', label: 'Unread', count: unreadCount },
          { key: 'invites', label: 'Invites', count: notifications.filter(n => n.type === 'staff_invite' || n.type === 'group_invite').length },
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
                        {notification.type === 'staff_invite' || notification.type === 'group_invite' ? (
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
                            <button
                              onClick={() => {
                                if (notification.type === 'staff_invite') {
                                  handleViewEvent(notification.eventId);
                                } else if (notification.type === 'group_invite') {
                                  navigate(`/groups/${notification.groupId}`);
                                }
                              }}
                              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              View {notification.type === 'staff_invite' ? 'Event' : 'Group'}
                            </button>
                          )
                        ) : (
                          notification.type === 'schedule_change' && (
                            <button
                              onClick={() => handleViewEvent(notification.eventId)}
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
