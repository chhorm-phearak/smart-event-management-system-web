import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { organizationService } from '@/services';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  TrendingUp,
  CalendarDays,
  History,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LayoutDashboard,
} from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 py-8">
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'30\' height=\'30\' viewBox=\'0 0 30 30\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1.5 0V30M0 1.5H30\' stroke=\'white\' stroke-opacity=\'0.1\'/%3E%3C/svg%3E")' }} />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="text-white">
              <p className="text-blue-200 text-sm font-medium mb-2">Dashboard Overview</p>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Welcome back, {getUserDisplayName()}!
              </h1>
              <p className="text-blue-100 max-w-md">
                Here's what's happening with your events today. Keep up the great work!
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/create-event')}
                className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Create Event
              </button>
              <button
                onClick={() => navigate('/manage-events')}
                className="px-6 py-3 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-all backdrop-blur-sm"
              >
                Manage All
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Events */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                <CalendarDays className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                <span>Active</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.totalEvents}</p>
            <p className="text-gray-500">Total Events</p>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">All time</span>
                <span className="text-blue-600 font-medium cursor-pointer hover:underline" onClick={() => navigate('/manage-events')}>View all →</span>
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">Live</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.upcomingEvents}</p>
            <p className="text-gray-500">Upcoming Events</p>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full transition-all" 
                  style={{ width: `${stats.totalEvents > 0 ? (stats.upcomingEvents / stats.totalEvents) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Past Events */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
                <History className="w-6 h-6 text-white" />
              </div>
              <span className="px-2.5 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">Done</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.pastEvents}</p>
            <p className="text-gray-500">Completed Events</p>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all" 
                  style={{ width: `${stats.totalEvents > 0 ? (stats.pastEvents / stats.totalEvents) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Total Attendees */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-violet-600 text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                <span>Growing</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.totalAttendees}</p>
            <p className="text-gray-500">Total Attendees</p>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Avg per event</span>
                <span className="text-violet-600 font-bold">{stats.totalEvents > 0 ? Math.round(stats.totalAttendees / stats.totalEvents) : 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Events Section */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Recent Events</h2>
              <p className="text-sm text-gray-500 mt-0.5">Your latest event activities and performance</p>
            </div>
            <button
                onClick={fetchDashboardData}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                title="Refresh"
              >
                <History className="w-5 h-5" />
              </button>
          </div>

          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-20 h-20 bg-gray-200 rounded-xl" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                  </div>
                  <div className="h-10 bg-gray-200 rounded-lg w-24" />
                </div>
              ))}
            </div>
          ) : recentEvents.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CalendarDays className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No events yet</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">Create your first event and start building your community</p>
              <button
                onClick={() => navigate('/create-event')}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all inline-flex items-center gap-2 shadow-lg shadow-blue-600/20"
              >
                <Plus className="w-5 h-5" />
                Create Your First Event
              </button>
            </div>
          ) : (
            <>
              {/* Event List */}
              <div className="divide-y divide-gray-100">
                {recentEvents.map((event, index) => (
                  <div
                    key={event.id}
                    className="flex flex-col lg:flex-row lg:items-center gap-5 p-6 hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/events/${event.id}`, { state: { fromDashboard: true } })}
                  >
                    {/* Event Image - Larger */}
                    <div className="relative w-full lg:w-44 h-44 lg:h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 flex-shrink-0">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-bold text-gray-700">
                        #{index + 1}
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-xl line-clamp-1">
                          {event.title}
                        </h3>
                        <span className="flex-shrink-0 px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                          {event.category}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-500">
                        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">{event.date}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                          <Clock className="w-4 h-4 text-emerald-500" />
                          <span className="font-medium">{event.time}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                          <MapPin className="w-4 h-4 text-rose-500" />
                          <span className="truncate font-medium">{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                          <Users className="w-4 h-4 text-violet-500" />
                          <span className="font-medium">{event.maxAttendees} capacity</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/events/${event.id}`, { state: { fromDashboard: true } }); }}
                      className="w-full lg:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      View Details
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-gray-500">
                    Showing <span className="font-semibold text-gray-700">{((pagination.page - 1) * pagination.limit) + 1}</span> to <span className="font-semibold text-gray-700">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-semibold text-gray-700">{pagination.total}</span> events
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-medium flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(3, pagination.totalPages) }, (_, i) => {
                        let page = i + 1;
                        if (pagination.totalPages > 3) {
                          if (pagination.page <= 2) page = i + 1;
                          else if (pagination.page >= pagination.totalPages - 1) page = pagination.totalPages - 2 + i;
                          else page = pagination.page - 1 + i;
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => setPagination(prev => ({ ...prev, page }))}
                            className={`w-10 h-10 rounded-lg font-semibold text-sm transition-all ${
                              pagination.page === page
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page >= pagination.totalPages}
                      className="px-4 py-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-medium flex items-center gap-1"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
