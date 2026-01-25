import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { eventService } from '@/services';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalRevenue: 0,
    totalAttendees: 0,
    publishedEvents: 0
  });
  const [recentEvents, setRecentEvents] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration - replace with actual API calls
      // const statsData = await eventService.getDashboardStats();
      // const eventsData = await eventService.getRecentEvents();
      
      // Mock statistics
      const mockStats = {
        totalEvents: 7,
        upcomingEvents: 0,
        totalRevenue: 200,
        totalAttendees: 5,
        publishedEvents: 7
      };

      // Mock recent events
      const mockRecentEvents = [
        {
          id: 1,
          title: 'Web Development',
          date: 'Dec 30, 2025',
          time: '09:00 AM',
          maxAttendees: 100,
          price: 600,
          status: 'published',
          image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=200&fit=crop'
        },
        {
          id: 2,
          title: 'App Development',
          date: 'April 10, 2026',
          time: '07:00 AM',
          maxAttendees: 200,
          price: 600,
          status: 'published',
          image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=200&fit=crop'
        },
        {
          id: 3,
          title: 'Data Science Workshop',
          date: 'May 15, 2026',
          time: '10:00 AM',
          maxAttendees: 150,
          price: 800,
          status: 'published',
          image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop'
        }
      ];

      setStats(mockStats);
      setRecentEvents(mockRecentEvents);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`.toUpperCase();
    }
    if (user?.first_name) {
      return user.first_name.toUpperCase();
    }
    if (user?.email) {
      return user.email.split('@')[0].toUpperCase();
    }
    return 'ORGANIZER';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-8 text-white">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, {getUserDisplayName()}!
          </h1>
          <p className="text-blue-100 text-lg">
            Manage your events and track your success
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Events Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="px-3 py-1 bg-green-50 rounded-full">
              <span className="text-xs font-semibold text-green-700">Active</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Events</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.totalEvents}</p>
            <p className="text-xs text-gray-500">{stats.publishedEvents} published</p>
          </div>
        </div>

        {/* Upcoming Events Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="px-3 py-1 bg-blue-50 rounded-full">
              <span className="text-xs font-semibold text-blue-700">Upcoming</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Upcoming Events</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.upcomingEvents}</p>
            <p className="text-xs text-gray-500">Currently running</p>
          </div>
        </div>

        {/* Total Revenue Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-emerald-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="px-3 py-1 bg-emerald-50 rounded-full">
              <span className="text-xs font-semibold text-emerald-700">Revenue</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">${stats.totalRevenue}</p>
            <p className="text-xs text-gray-500">From all Events</p>
          </div>
        </div>

        {/* Total Attendees Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="px-3 py-1 bg-purple-50 rounded-full">
              <span className="text-xs font-semibold text-purple-700">Attendees</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Attendees</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.totalAttendees}</p>
            <p className="text-xs text-gray-500">Across all events</p>
          </div>
        </div>
      </div>

      {/* Recent Events Section */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Recent Events</h2>
            <p className="text-gray-600 text-sm">Your latest event activities</p>
          </div>
          <button
            onClick={() => navigate('/create-event')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Event
          </button>
        </div>

        {recentEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-2">No events yet</p>
            <p className="text-gray-500 text-sm mb-4">Create your first event to get started</p>
            <button
              onClick={() => navigate('/create-event')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              Create Your First Event
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {recentEvents.map((event) => (
              <div
                key={event.id}
                className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Event Image */}
                  <div className="w-full lg:w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{event.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span>Max {event.maxAttendees}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status and Price Tags */}
                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    <div className="flex flex-wrap gap-2 justify-end">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                        Published
                      </span>
                      <span className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded-full">
                        ${event.price}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
