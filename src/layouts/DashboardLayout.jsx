import { useState, useEffect, useCallback } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/assets/icons/MPR Smart Event.png';
import { useSocket } from '@/hooks/useSocket';
import { notificationService } from '@/services/notificationService';
import toast from 'react-hot-toast';
import { FloatingChatWidget } from '@/components/FloatingChatWidget';

export const DashboardLayout = () => {
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { onNotification } = useSocket();
  
  const isOrganizer = !!(user?.organization_id ?? user?.organizationId ?? user?.organization?.id);

  // Format timestamp to relative time
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return 'Last week';
  };

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      setLoadingNotifications(true);
      const response = await notificationService.getNotifications(1, 5);
      const transformedNotifications = (response.data || []).map(n => ({
        id: n.id,
        title: n.title,
        description: n.message,
        time: formatTime(n.created_at),
        unread: !n.is_read,
        type: n.type,
        eventId: n.event_id,
        groupId: n.group_id,
      }));
      setNotifications(transformedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  // Handle real-time notification
  const handleNewNotification = useCallback((notification) => {
    const newNotif = {
      id: notification.id,
      title: notification.title,
      description: notification.message,
      time: 'Just now',
      unread: true,
      type: notification.type,
      eventId: notification.event_id,
      groupId: notification.group_id,
    };
    
    setNotifications(prev => [newNotif, ...prev.slice(0, 4)]);
    
    toast(notification.title, {
      icon: '🔔',
      duration: 4000,
    });
  }, []);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Set up real-time notification listener
  useEffect(() => {
    const cleanup = onNotification(handleNewNotification);
    return () => cleanup();
  }, [onNotification, handleNewNotification]);

  const unreadCount = notifications.filter((item) => item.unread).length;

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, unread: false })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  // Handle notification click - navigate to appropriate page
  const handleNotificationClick = async (item) => {
    setIsNotificationDropdownOpen(false);

    if (item.unread) {
      try {
        await notificationService.markAsRead(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
        );
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    const type = item.type?.toLowerCase();
    
    if (type === 'group_invite' && item.groupId) {
      navigate(`/groups/${item.groupId}`);
    } else if ((type === 'invitation' || type === 'staff_invite') && item.eventId) {
      navigate(`/events/${item.eventId}`);
    } else if (item.eventId) {
      navigate(`/events/${item.eventId}`);
    } else if (item.groupId) {
      navigate(`/groups/${item.groupId}`);
    } else {
      navigate('/notifications');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { 
      path: '/', 
      label: 'Dashboard', 
      organizerOnly: true,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v6a2 2 0 002 2h10a2 2 0 002-2v-6" />
        </svg>
      )
    },
    { 
      path: '/all-events', 
      label: 'All Events', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      path: '/my-ticket', 
      label: 'My Ticket', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      )
    },
    { 
      path: '/group', 
      label: 'Group', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    { 
      path: '/manage-attendees', 
      label: 'Manage Attendees', 
      organizerOnly: true,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    { 
      path: '/manage-events', 
      label: 'Manage Events', 
      organizerOnly: true,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
  ].filter(item => !item.organizerOnly || isOrganizer);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Left Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-30 shadow-lg">
        {/* Logo/Brand Section */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={Logo} alt="MPR Smart Event" className="w-10 h-10 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-200 object-contain" />
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">MPR Smart Event</span>
              <span className="text-xs text-gray-600">Event Management</span>
            </div>
          </Link>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
            Navigation
          </h3>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-600 transition-colors'}`}>
                      {item.icon}
                    </span>
                    <span className="font-medium text-sm">{item.label}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content Area - with left margin for fixed sidebar */}
      <div className="ml-64 flex flex-col min-h-screen">
        {/* Fixed Top Header Bar */}
        <header className="sticky top-0 bg-white border-b border-gray-200 px-6 py-6 z-20">
          <div className="flex items-center justify-between">
            {/* Left side - My Ticket */}
            <div className="flex items-center">
              <Link
                to="/my-ticket"
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
                <span className="font-medium">My Ticket</span>
              </Link>
            </div>

            {/* Right side - Profile */}
            <div className="flex items-center gap-4">
              {/* Notification Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsNotificationDropdownOpen(!isNotificationDropdownOpen);
                    setIsProfileDropdownOpen(false);
                  }}
                  className="relative w-10 h-10 rounded-full border border-gray-200 bg-white text-gray-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors flex items-center justify-center focus:outline-none"
                  aria-label="Open notifications"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[1.2rem] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center border-2 border-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {isNotificationDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsNotificationDropdownOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-[30rem] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-gray-200 z-20 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                          <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                              <>
                                <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                                  {unreadCount} new
                                </span>
                                <button
                                  onClick={handleMarkAllAsRead}
                                  className="text-xs font-medium text-gray-600 hover:text-blue-600 transition-colors"
                                >
                                  Mark all read
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="max-h-[30rem] overflow-y-auto">
                        {loadingNotifications ? (
                          <div className="px-4 py-8 text-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-sm text-gray-500 mt-2">Loading...</p>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-sm text-gray-500">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => handleNotificationClick(item)}
                              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div className="flex items-start gap-3">
                                <span className={`mt-1 w-2 h-2 rounded-full ${item.unread ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{item.description}</p>
                                  <p className="text-[11px] text-gray-500 mt-1">{item.time}</p>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>

                      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                        <button
                          onClick={() => {
                            setIsNotificationDropdownOpen(false);
                            navigate('/notifications');
                          }}
                          className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          View all notifications
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(!isProfileDropdownOpen);
                    setIsNotificationDropdownOpen(false);
                  }}
                  className="flex items-center gap-3 focus:outline-none hover:opacity-80 transition-opacity group"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">
                      {user?.first_name && user?.last_name
                        ? `${user.first_name} ${user.last_name}`
                        : user?.first_name || user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs text-gray-600 truncate max-w-[120px]">
                      {user?.email || 'No email'}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-md group-hover:shadow-lg transition-shadow">
                    {user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-20 overflow-hidden">
                      {/* User Info Header */}
                      <div className="px-4 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0 text-lg shadow-md">
                            {user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-bold text-gray-900 truncate">
                              {user?.first_name && user?.last_name
                                ? `${user.first_name} ${user.last_name}`
                                : user?.first_name || user?.email?.split('@')[0] || 'User'}
                            </p>
                            <p className="text-sm text-gray-700 truncate font-medium">
                              {user?.email || 'No email'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            navigate('/profile');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                        >
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="font-medium">Profile</span>
                        </button>

                        {isOrganizer && (
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            navigate('/organization/members');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                        >
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <span className="font-medium">Organization Members</span>
                        </button>
                        )}

                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            navigate('/organization/register');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                        >
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="font-medium">Register Organization</span>
                        </button>

                        {/* Divider */}
                        <div className="my-2 border-t border-gray-200"></div>

                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors group"
                        >
                          <svg className="w-5 h-5 text-red-500 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span className="font-medium">Logout</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Floating Chat Widget */}
      <FloatingChatWidget />
    </div>
  );
};
