import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { organizationService } from '@/services';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    pastEvents: 0,
    totalAttendees: 0
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, [pagination.page]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from API
      const [statsResponse, eventsResponse] = await Promise.all([
        organizationService.getDashboardStats(),
        organizationService.getDashboardEvents(pagination.page, pagination.limit)
      ]);

      // Map stats from API response
      const statsData = statsResponse?.data || statsResponse || {};
      setStats({
        totalEvents: statsData.total_events ?? 0,
        upcomingEvents: statsData.upcoming_events ?? 0,
        pastEvents: statsData.past_events ?? 0,
        totalAttendees: statsData.total_attendees ?? 0
      });

      // Map events from API response
      const eventsData = eventsResponse?.data || eventsResponse || {};
      const events = eventsData.events || eventsData.data || [];
      
      const mappedEvents = events.map((e) => ({
        id: e.id,
        title: e.title,
        date: formatEventDate(e.start_time),
        time: formatEventTime(e.start_time),
        maxAttendees: e.capacity ?? 0,
        price: e.price ?? 0,
        status: e.status || 'published',
        image: e.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop',
        location: e.location || e.full_address || '—',
        category: e.category || 'Other'
      }));

      setRecentEvents(mappedEvents);
      setPagination(prev => ({
        ...prev,
        total: eventsData.total ?? eventsData.pagination?.total ?? 0,
        totalPages: eventsData.total_pages ?? eventsData.pagination?.totalPages ?? Math.ceil((eventsData.total || 0) / prev.limit)
      }));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatEventDate = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
  };

  const formatEventTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
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
            <p className="text-xs text-gray-500">All your events</p>
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

        {/* Past Events Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="px-3 py-1 bg-orange-50 rounded-full">
              <span className="text-xs font-semibold text-orange-700">Completed</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Past Events</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.pastEvents}</p>
            <p className="text-xs text-gray-500">Completed events</p>
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
          <>
            <div className="space-y-4">
              {recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Event Image */}
                    <div className="w-full lg:w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop';
                        }}
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate max-w-[200px]">{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <span>Max {event.maxAttendees}</span>
                        </div>
                      </div>
                    </div>

                    {/* View Detail Button */}
                    <div className="flex flex-col items-end gap-3 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/events/${event.id}`);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <span>View Detail</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} events
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
